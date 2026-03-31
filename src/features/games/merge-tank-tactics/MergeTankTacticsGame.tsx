'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import * as THREE from 'three';

import { GameWrapper } from '../shared/GameWrapper';
import { InstructionsModal } from '../shared/InstructionsModal';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';

import { Difficulty, TankType, BattleEnvironment, CameraMode } from './types';
import { DIFFICULTY_SETTINGS } from './hooks/useMergeTankGame';
import { useMergeTankGame } from './hooks/useMergeTankGame';
import { useBattleLoop, FXPhase } from './hooks/useBattleLoop';
import { useDragMerge } from './hooks/useDragMerge';
import { useBattleSounds } from './hooks/useBattleSounds';
import { getTankCost } from './data/tankStats';
import { STAGE_INFO } from './data/stages';
import { BattleArena } from './components/BattleArena';

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Horizontal layout: player on RIGHT (+x), enemy on LEFT (-x) */
function tankWorldVec(col: number, row: number, owner: 'player' | 'enemy'): THREE.Vector3 {
  const z = (row - 1) * 1.5;
  const localX = (col - 1.5) * 1.5;
  const armyX = owner === 'player' ? 4.5 : -4.5;
  return new THREE.Vector3(armyX + localX, 0.5, z);
}

// ─── Main component ────────────────────────────────────────────────────────

export default function MergeTankTacticsGame() {
  const t = useTranslations('mergeTankTactics');
  const locale = useLocale();
  const dir = useDirection();
  const sounds = useRetroSounds();
  const battleSounds = useBattleSounds();

  // ── Phase: difficulty selection first ──────────────────────────────────
  const [phase, setPhase] = useState<'selectDifficulty' | 'playing'>('selectDifficulty');
  const [chosenDifficulty, setChosenDifficulty] = useState<Difficulty>('medium');
  // ── Camera mode for cinematic camera ──────────────────────────────────
  const [cameraMode, setCameraMode] = useState<CameraMode>('overview');

  // ── Game state ─────────────────────────────────────────────────────────
  const {
    state,
    buyTank,
    cancelPending,
    placeTank,
    selectTank,
    moveTank,
    mergeTanks,
    startBattle,
    endBattle,
    nextStage,
    resetGame,
    getTanksAtRound,
  } = useMergeTankGame(chosenDifficulty);

  // ── Instructions modal ─────────────────────────────────────────────────
  const [showInstructions, setShowInstructions] = useState(true);

  // ── Battle animation state ─────────────────────────────────────────────
  const [displayedRound, setDisplayedRound] = useState(0);
  const [fxPhase, setFxPhase] = useState<FXPhase>('idle');
  const [hitTankIds, setHitTankIds] = useState<Set<string>>(new Set());
  const [explosionPositions, setExplosionPositions] = useState<THREE.Vector3[]>([]);
  const [mergeSparkPos, setMergeSparkPos] = useState<THREE.Vector3 | null>(null);
  const mergeSparkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Battle loop hook
  useBattleLoop({
    isActive: state.phase === 'battle',
    totalRounds: state.battleLog.length,
    roundMs: 1800,
    onRoundAdvance: (round) => {
      setDisplayedRound(round);
    },
    onFXPhase: (fx) => {
      setFxPhase(fx);
      if (fx === 'projectile') {
        setCameraMode('attack');
        battleSounds.playCannonFire();
      } else if (fx === 'hit') {
        // Collect hit tank ids for flash
        const round = state.battleLog[displayedRound - 1];
        setCameraMode('explosion');
        if (round) {
          const attackedIds = new Set([
            ...round.playerAttacks.map(a => a.targetId),
            ...round.enemyAttacks.map(a => a.targetId),
          ]);
          setHitTankIds(attackedIds);
          sounds.playHit();
          battleSounds.playShellImpact();

          // Collect explosions for killed tanks
          const killed = [
            ...round.playerAttacks.filter(a => a.killedTarget),
            ...round.enemyAttacks.filter(a => a.killedTarget),
          ];
          if (killed.length) {
            const allTanks = getTanksAtRound(displayedRound - 1);
            const positions = killed.map(atk => {
              const t = allTanks.find(t => t.id === atk.targetId);
              return t ? tankWorldVec(t.col, t.row, t.owner) : null;
            }).filter(Boolean) as THREE.Vector3[];
            setExplosionPositions(positions);
            battleSounds.playExplosion();
          }
        }
      } else if (fx === 'idle') {
        setHitTankIds(new Set());
        setExplosionPositions([]);
        setCameraMode('battle_start');
      }
    },
    onBattleEnd: () => {
      const roundState = state.battleLog[state.battleLog.length - 1]?.tankStates ?? {};
      const enemyAlive = state.initialBattleEnemyTanks.some(t => roundState[t.id]?.isAlive ?? t.isAlive);
      const result = enemyAlive ? 'lose' : 'win';
      endBattle(result);
      if (result === 'win') {
        sounds.playWin();
        setCameraMode('victory');
      } else {
        sounds.playGameOver();
        setCameraMode('overview');
      }
      setDisplayedRound(0);
      setFxPhase('idle');
    },
  });

  // ── Merge sparks FX ───────────────────────────────────────────────────
  const prevPlayerCount = useRef(state.playerTanks.length);
  useEffect(() => {
    // Tank count decreased because of merge → show sparks at last player tank position
    if (state.playerTanks.length < prevPlayerCount.current && state.phase === 'prep') {
      const t = state.playerTanks[state.playerTanks.length - 1];
      if (t) {
        setMergeSparkPos(tankWorldVec(t.col, t.row, 'player'));
        sounds.playPowerUp();
        if (mergeSparkTimer.current) clearTimeout(mergeSparkTimer.current);
        mergeSparkTimer.current = setTimeout(() => setMergeSparkPos(null), 700);
      }
    }
    prevPlayerCount.current = state.playerTanks.length;
  }, [state.playerTanks, state.phase, sounds]);

  // ── Drag-merge hook ────────────────────────────────────────────────────
  const { handleCellClick, handleTankClick } = useDragMerge({
    playerTanks: state.playerTanks,
    selectedTankId: state.selectedTankId,
    pendingTankType: state.pendingTankType,
    onSelectTank: selectTank,
    onPlaceTank: (col, row) => { placeTank(col, row); sounds.playMove(); },
    onMoveTank: (id, col, row) => { moveTank(id, col, row); sounds.playMove(); },
    onMergeTanks: (src, tgt) => { mergeTanks(src, tgt); },
  });

  const handleCellClickMapped = useCallback(
    (col: number, row: number, owner: 'player' | 'enemy') => {
      if (owner === 'player') handleCellClick(col, row);
    },
    [handleCellClick]
  );

  const handleTankClickMapped = useCallback(
    (id: string) => {
      const tank = state.phase === 'prep'
        ? [...state.playerTanks, ...state.enemyTanks].find(t => t.id === id)
        : null;
      if (tank?.owner === 'player') {
        handleTankClick(id);
        sounds.playClick();
      }
    },
    [state.phase, state.playerTanks, state.enemyTanks, handleTankClick, sounds]
  );

  // ── Compute displayed tanks ────────────────────────────────────────────
  const displayedTanks =
    state.phase === 'battle'
      ? getTanksAtRound(displayedRound)
      : [...state.playerTanks, ...state.enemyTanks];
  // ── Derive environment for current stage ──────────────────────────────────
  const currentEnvironment: BattleEnvironment =
    STAGE_INFO[Math.min(state.stage - 1, STAGE_INFO.length - 1)]?.environment ?? 'desert_storm';
  // ── Costs ──────────────────────────────────────────────────────────────
  const nextCost = getTankCost(state.purchaseCount);
  const canAfford = state.gold >= nextCost;
  const hasAnyPlayerTank = state.playerTanks.some(t => t.isAlive);

  // ── Keyboard support ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectTank(null);
      if (e.key === 'Enter' || e.key === ' ') {
        if (state.phase === 'prep' && hasAnyPlayerTank) {
          e.preventDefault();
          sounds.playClick();
          battleSounds.playEngineStart();
          startBattle();
          setCameraMode('battle_start');
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        if (state.phase === 'prep' && canAfford) { buyTank('melee'); sounds.playClick(); }
      }
      if (e.key === 'r' || e.key === 'R') {
        if (state.phase === 'prep' && canAfford) { buyTank('range'); sounds.playClick(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, state.phase, canAfford, hasAnyPlayerTank, buyTank, startBattle, selectTank, sounds, battleSounds, setCameraMode]);

  // ── Difficulty selection screen ────────────────────────────────────────
  if (phase === 'selectDifficulty') {
    return (
      <GameWrapper title={t('title')} fullHeight>
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
          <div className="text-6xl mb-4">🪖</div>
          <h1 className="text-4xl font-extrabold text-white mb-2 text-center">
            {t('title')}
          </h1>
          <p className="text-slate-400 mb-10 text-center">{t('subtitle')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
              const s = DIFFICULTY_SETTINGS[d];
              return (
                <button
                  key={d}
                  onClick={() => setChosenDifficulty(d)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                    chosenDifficulty === d
                      ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-400'
                  }`}
                >
                  <div className="text-lg font-bold text-white capitalize">{t(`difficulty.${d}`)}</div>
                  <div className="text-slate-400 text-sm mt-1">
                    {t('gold')}: {s.startGold} · {t('stage')} ×{s.stagesNeeded}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              resetGame(chosenDifficulty);
              setPhase('playing');
              sounds.playClick();
            }}
            className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold px-10 py-4 rounded-2xl text-xl transition-transform active:scale-95 shadow-lg"
          >
            ▶ {t('startBattle')}
          </button>
        </div>
      </GameWrapper>
    );
  }

  // ── Play screen ────────────────────────────────────────────────────────
  return (
    <GameWrapper title={`🪖 ${t('title')}`} fullHeight onInstructionsClick={() => setShowInstructions(true)}>
      <div className="relative w-full h-full bg-slate-900 overflow-hidden" dir={dir}>
        {/* ── 3D Canvas ── */}
        <div className="absolute inset-0">
          <BattleArena
            tanks={displayedTanks}
            phase={state.phase}
            selectedTankId={state.selectedTankId}
            pendingTankType={state.pendingTankType}
            fxPhase={fxPhase}
            currentRound={state.battleLog[displayedRound - 1] ?? null}
            hitTankIds={hitTankIds}
            explosionPositions={explosionPositions}
            mergeSparkPos={mergeSparkPos}
            environment={currentEnvironment}
            cameraMode={cameraMode}
            onCellClick={handleCellClickMapped}
            onTankClick={handleTankClickMapped}
          />
        </div>

        {/* ── HUD: top bar ── */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-black/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 font-bold text-sm">
              💰 {t('gold')}: {state.gold}
            </span>
            <span className="text-slate-300 text-sm">
              {t('stage')} {state.stage}/{DIFFICULTY_SETTINGS[state.difficulty].stagesNeeded}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {state.phase === 'prep' && (
              <span className="text-blue-400 text-xs hidden sm:block">
                [M] {t('buyMelee')} · [R] {t('buyRange')}
              </span>
            )}
            <button
              onClick={() => setShowInstructions(true)}
              className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded"
              aria-label="Instructions"
            >
              ❓
            </button>
            <button
              onClick={() => { setPhase('selectDifficulty'); sounds.playClick(); }}
              className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Prep phase: Shop panel ── */}
        {state.phase === 'prep' && (
          <div className={`absolute top-12 ${dir === 'rtl' ? 'right-2' : 'left-2'} w-40 z-10 flex flex-col gap-2`}>
            {/* Shop */}
            <div className="bg-black/70 backdrop-blur-sm rounded-xl p-3 border border-slate-600">
              <div className="text-white font-bold text-xs mb-2 uppercase tracking-wide">🛒 Shop</div>
              <div className="text-slate-400 text-xs mb-2">
                {t('gold')}: <span className="text-yellow-400 font-bold">{state.gold}</span>
                <br />
                Cost: <span className={canAfford ? 'text-green-400' : 'text-red-400'}>{nextCost}</span>
              </div>

              <button
                onClick={() => {
                  if (!canAfford) { sounds.playGameOver(); return; }
                  buyTank('melee');
                  sounds.playClick();
                }}
                disabled={!canAfford}
                className="w-full mb-1 py-2 rounded-lg text-xs font-bold text-center transition-all bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-500 text-white"
              >
                🛡️ {t('buyMelee')}
              </button>
              <button
                onClick={() => {
                  if (!canAfford) { sounds.playGameOver(); return; }
                  buyTank('range');
                  sounds.playClick();
                }}
                disabled={!canAfford}
                className="w-full py-2 rounded-lg text-xs font-bold text-center transition-all bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-500 text-white"
              >
                🎯 {t('buyRange')}
              </button>
            </div>

            {/* Pending indicator */}
            {state.pendingTankType && (
              <div className="bg-yellow-400/20 border border-yellow-400 rounded-xl p-2 text-center">
                <div className="text-yellow-300 text-xs font-bold mb-1">
                  {state.pendingTankType === 'melee' ? '🛡️' : '🎯'}{' '}
                  {t(state.pendingTankType === 'melee' ? 'melee' : 'range')} {t('level')}1
                </div>
                <div className="text-yellow-200 text-[10px] mb-1">Tap grid to place</div>
                <button
                  onClick={() => { cancelPending(); sounds.playClick(); }}
                  className="text-red-400 text-[10px] underline"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Selected tank info */}
            {state.selectedTankId && !state.pendingTankType && (() => {
              const sel = state.playerTanks.find(t => t.id === state.selectedTankId);
              if (!sel) return null;
              return (
                <div className="bg-blue-400/20 border border-blue-400 rounded-xl p-2">
                  <div className="text-blue-300 text-xs font-bold">
                    {sel.type === 'melee' ? '🛡️' : '🎯'} {t(sel.type)} {t('level')}{sel.level}
                  </div>
                  <div className="text-slate-300 text-[10px] mt-1">
                    {t('hp')} {sel.hp} · {t('attack')} {sel.atk}
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    {sel.level < 5 ? `Tap same type to ${t('merge')}` : 'Max level!'}
                  </div>
                </div>
              );
            })()}

            {/* Start Battle */}
            <button
              onClick={() => {
                if (!hasAnyPlayerTank) return;
                sounds.playClick();
                battleSounds.playEngineStart();
                startBattle();
                setCameraMode('battle_start');
              }}
              disabled={!hasAnyPlayerTank}
              className="w-full py-3 rounded-xl font-extrabold text-sm text-center transition-all bg-red-500 hover:bg-red-400 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg shadow-red-500/30 active:scale-95"
            >
              ⚔️ {t('startBattle')}
            </button>
          </div>
        )}

        {/* ── Battle phase: status banner ── */}
        {state.phase === 'battle' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/70 backdrop-blur-sm px-5 py-2 rounded-full border border-slate-500">
            <span className="text-white text-sm font-bold">
              ⚔️ Round {displayedRound} / {state.battleLog.length}
              {fxPhase === 'projectile' && ' · Firing…'}
              {fxPhase === 'hit' && ' · Impact!'}
            </span>
          </div>
        )}

        {/* ── Result overlay ── */}
        {state.phase === 'result' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 border-2 border-slate-600 rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
              <div className="text-7xl mb-4">{state.result === 'win' ? '🏆' : '💀'}</div>
              <h2 className={`text-3xl font-extrabold mb-2 ${state.result === 'win' ? 'text-yellow-400' : 'text-red-400'}`}>
                {state.result === 'win' ? t('victory') : t('defeat')}
              </h2>
              {state.result === 'win' && (
                <p className="text-green-400 text-lg mb-3">
                  +{state.reward} {t('gold')}
                </p>
              )}
              <p className="text-slate-400 text-sm mb-6">
                {t('stage')} {state.stage} · {state.stagesWon}/{DIFFICULTY_SETTINGS[state.difficulty].stagesNeeded}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    sounds.playClick();
                    nextStage();
                    setDisplayedRound(0);
                  }}
                  className="px-6 py-3 rounded-2xl font-bold bg-yellow-400 hover:bg-yellow-300 text-slate-900 transition-all active:scale-95"
                >
                  {state.result === 'win' ? `${t('nextStage')} ▶` : `↩ ${t('nextStage')}`}
                </button>
                <button
                  onClick={() => { setPhase('selectDifficulty'); sounds.playClick(); }}
                  className="px-6 py-3 rounded-2xl font-bold bg-slate-600 hover:bg-slate-500 text-white transition-all active:scale-95"
                >
                  🏠 Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Instructions Modal ── */}
        <InstructionsModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          locale={locale}
          title={t('instructions.title')}
          instructions={[
            { icon: '🛒', title: t('instructions.step1'), description: t('instructions.step1') },
            { icon: '🔀', title: t('instructions.step2'), description: t('instructions.step2') },
            { icon: '⚔️', title: t('instructions.step3'), description: t('instructions.step3') },
            { icon: '🏆', title: t('instructions.step4'), description: t('instructions.step4') },
          ]}
          controls={[
            { icon: '🖱️', description: 'Click grid to place / select tanks' },
            { icon: '⌨️', description: '[M] Melee · [R] Range · [Enter] Battle' },
            { icon: '📱', description: 'Tap grid cells on mobile' },
          ]}
          tip={t('instructions.tip')}
        />
      </div>
    </GameWrapper>
  );
}
