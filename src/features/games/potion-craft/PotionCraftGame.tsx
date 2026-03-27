'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { InstructionsModal } from '../shared/InstructionsModal';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { R3FGameContainer } from '../shared/r3f/R3FGameContainer';
import { PotionCraftScene } from './PotionCraftScene';
import { usePotionCraftGame } from './usePotionCraftGame';
import { CREATURES, POTIONS } from './recipes';
import { Difficulty, PotionId } from './types';
import { useTranslations } from 'next-intl';



// ─── Temperature conversion (0-1 → Celsius) ────────────────
const MIN_TEMP = 20;
const MAX_TEMP = 500;
function toCelsius(heat: number): number {
  return Math.round(MIN_TEMP + heat * (MAX_TEMP - MIN_TEMP));
}

// ─── Creature Emoji Map ─────────────────────────────────────
const creatureEmoji: Record<string, string> = {
  slime: '🟢',
  fireImp: '🔥',
  waterSprite: '💧',
  stoneGolem: '🪨',
  fairy: '🧚',
  shadowWisp: '👻',
  crystalDragon: '🐉',
  goldenPhoenix: '🦅',
  failBlob: '😅',
  failSpiky: '😬',
  failWobbly: '🤪',
};

// ─── Potion color map (for HUD circles) ─────────────────────
const potionColors: Record<PotionId, string> = {
  green: '#22c55e',
  purple: '#a855f7',
  blue: '#3b82f6',
  red: '#ef4444',
  yellow: '#eab308',
  cyan: '#06b6d4',
  golden: '#f59e0b',
  pink: '#ec4899',
};

// ─── Component ──────────────────────────────────────────────
interface PotionCraftGameProps {
  locale?: string;
}

export default function PotionCraftGame({ locale = 'en' }: PotionCraftGameProps) {
  const t = useTranslations('potionCraft');
  const sounds = useRetroSounds();
  const [showInstructions, setShowInstructions] = useState(true);
  const [selectedPotion, setSelectedPotion] = useState<PotionId | null>(null);
  const [isStirring, setIsStirring] = useState(false);
  const [stirDirection, setStirDirection] = useState<'cw' | 'ccw'>('cw');
  const [lastAddedColor, setLastAddedColor] = useState<string | null>(null);
  const stirTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    state,
    startGame,
    addPotion,
    undoPotion,
    setHeatLevel,
    stir,
    brew,
    nextLevel,
    retryLevel,
    pause,
    resume,
    backToMenu,
  } = usePotionCraftGame();

  // Keep a ref for unlocked potion IDs to avoid Set in deps
  const potionIdsRef = useRef<PotionId[]>([]);
  potionIdsRef.current = Array.from(state.unlockedPotions);

  // ─── Handlers ───────────────────────────────────────────
  const handleAddPotion = useCallback((id: PotionId) => {
    if (state.phase !== 'playing') return;
    if (!state.unlockedPotions.has(id)) return;
    sounds.playDrop();
    addPotion(id);
    setSelectedPotion(id);
    // Trigger splash color
    setLastAddedColor(POTIONS[id].color);
    if (lastAddedTimerRef.current) clearTimeout(lastAddedTimerRef.current);
    lastAddedTimerRef.current = setTimeout(() => setLastAddedColor(null), 1200);
  }, [state.phase, state.unlockedPotions, sounds, addPotion]);

  const handleStir = useCallback((direction?: 'cw' | 'ccw') => {
    if (state.phase !== 'playing') return;
    sounds.playWhoosh();
    stir();
    if (direction) setStirDirection(direction);
    setIsStirring(true);
    if (stirTimeoutRef.current) clearTimeout(stirTimeoutRef.current);
    stirTimeoutRef.current = setTimeout(() => setIsStirring(false), 600);
  }, [state.phase, sounds, stir]);

  const handleBrew = useCallback(() => {
    if (state.phase !== 'playing') return;
    if (state.cauldronPotions.length === 0) return;
    sounds.playPowerUp();
    brew();
  }, [state.phase, state.cauldronPotions.length, sounds, brew]);

  const handleUndo = useCallback(() => {
    if (state.phase !== 'playing') return;
    sounds.playClick();
    undoPotion();
  }, [state.phase, sounds, undoPotion]);

  const handleDifficultySelect = useCallback((diff: Difficulty) => {
    sounds.playClick();
    startGame(diff);
  }, [sounds, startGame]);

  const handleNextLevel = useCallback(() => {
    sounds.playLevelUp();
    nextLevel();
  }, [sounds, nextLevel]);

  const handleRetry = useCallback(() => {
    sounds.playClick();
    retryLevel();
  }, [sounds, retryLevel]);

  const handleBackToMenu = useCallback(() => {
    sounds.playClick();
    backToMenu();
  }, [sounds, backToMenu]);

  // ─── Keyboard handling (use refs to avoid stale closures) ─
  const handleAddPotionRef = useRef(handleAddPotion);
  handleAddPotionRef.current = handleAddPotion;
  const handleStirRef = useRef(handleStir);
  handleStirRef.current = handleStir;
  const handleBrewRef = useRef(handleBrew);
  handleBrewRef.current = handleBrew;
  const handleUndoRef = useRef(handleUndo);
  handleUndoRef.current = handleUndo;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (state.phase === 'playing') { pause(); return; }
        if (state.phase === 'paused') { resume(); return; }
      }

      if (state.phase !== 'playing') return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 8) {
        const ids = potionIdsRef.current;
        if (num <= ids.length) {
          handleAddPotionRef.current(ids[num - 1]);
        }
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        handleStirRef.current();
        return;
      }

      if (e.key.toLowerCase() === 'q') {
        handleStirRef.current('ccw');
        return;
      }
      if (e.key.toLowerCase() === 'e') {
        handleStirRef.current('cw');
        return;
      }

      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        handleStirRef.current('ccw');
        return;
      }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        handleStirRef.current('cw');
        return;
      }

      if (e.key === 'Enter') {
        handleBrewRef.current();
        return;
      }

      if (e.key.toLowerCase() === 'z') {
        handleUndoRef.current();
        return;
      }

      if (e.key === '+' || e.key === '=') {
        setHeatLevel(state.heatLevel + 0.05);
        return;
      }
      if (e.key === '-' || e.key === '_') {
        setHeatLevel(state.heatLevel - 0.05);
        return;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.phase, state.heatLevel, pause, resume, setHeatLevel]);

  // Play sound on result phase
  useEffect(() => {
    if (state.phase === 'result') {
      if (state.stars > 0) {
        sounds.playSuccess();
      } else {
        sounds.playGameOver();
      }
    }
  }, [state.phase, state.stars, sounds]);

  // ─── Derived values ─────────────────────────────────────
  const targetCreatureName = t(CREATURES[state.targetCreature]?.label ?? '') || state.targetCreature;
  const targetEmoji = creatureEmoji[state.targetCreature] || '❓';
  const resultCreatureName = state.resultCreature
    ? (t(CREATURES[state.resultCreature]?.label ?? '') || state.resultCreature)
    : '';
  const resultEmoji = state.resultCreature ? (creatureEmoji[state.resultCreature] || '❓') : '';
  const potionList = potionIdsRef.current;

  return (
    <GameWrapper
      title={t('title')}
      onInstructionsClick={() => setShowInstructions(true)}
    >
      <div className="flex flex-col items-center gap-3 w-full max-w-[800px] mx-auto">
        {/* ─── Menu Phase ──────────────────────────── */}
        <AnimatePresence mode="wait">
          {state.phase === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-4 p-6 bg-white rounded-3xl shadow-lg w-full"
            >
              <h2 className="text-2xl font-bold text-gray-800">{t('difficulty')}</h2>

              {state.highScore > 0 && (
                <p className="text-sm text-gray-500">
                  {t('highScore')}: {state.highScore}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
                  const colors = {
                    easy: 'bg-green-400 hover:bg-green-500',
                    medium: 'bg-yellow-400 hover:bg-yellow-500',
                    hard: 'bg-red-400 hover:bg-red-500',
                  };
                  const emojis = { easy: '🟢', medium: '🟡', hard: '🔴' };
                  return (
                    <button
                      key={diff}
                      onClick={() => handleDifficultySelect(diff)}
                      className={`flex-1 p-4 rounded-2xl text-white font-bold text-lg
                        shadow-md transition-all active:scale-95 min-h-[60px]
                        ${colors[diff]}`}
                    >
                      <span className="text-2xl">{emojis[diff]}</span>
                      <div>{t(diff)}</div>
                      <div className="text-xs opacity-80">{t(`${diff}Desc`)}</div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Game Area (all controls overlaid on 3D scene) ─── */}
        {state.phase !== 'menu' && (
          <div
            className="relative w-full rounded-xl overflow-hidden shadow-2xl"
            style={{ height: 'min(65vh, 600px)', minHeight: '420px' }}
          >
            {/* 3D Scene — fills the entire game container */}
            <div className="absolute inset-0">
            <R3FGameContainer
              camera={{ position: [0, 4, 7], fov: 50 }}
              className="!aspect-auto !max-w-none !mx-0 h-full"
            >
              <PotionCraftScene
                state={state}
                onSelectPotion={handleAddPotion}
                selectedPotion={selectedPotion}
                isStirring={isStirring}
                stirDirection={stirDirection}
                lastAddedColor={lastAddedColor}
                targetCreatureId={state.targetCreature}
              />
            </R3FGameContainer>
            </div>

            {/* ─── Top HUD: Level + Score ──────── */}
            <div className="absolute top-0 left-0 right-0 z-10 p-2 pointer-events-none
              bg-gradient-to-b from-black/60 via-black/30 to-transparent">
              <div className="flex justify-between items-start gap-2">
                {/* Level badge */}
                <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1 text-white text-xs font-bold pointer-events-auto shrink-0">
                  {t('level')} {state.level}
                </div>

                {/* Timer (if active) */}
                {state.phase === 'playing' && state.timeRemaining !== null && (
                  <div className={`bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs font-bold pointer-events-auto
                    ${state.timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                    ⏱️ {state.timeRemaining}s
                  </div>
                )}

                {/* Score badge */}
                <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1 text-white text-xs font-bold pointer-events-auto shrink-0">
                  ⭐ {state.score}
                </div>
              </div>
            </div>

            {/* ─── Left Side: Creature Goal + Recipe Card ── */}
            {state.phase === 'playing' && state.currentLevel && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 pointer-events-auto w-36 space-y-2">
                {/* 🎯 Target creature badge */}
                <div className="bg-gradient-to-b from-amber-500/90 to-amber-700/90
                  border-2 border-yellow-300/80 rounded-xl px-2 py-2 shadow-lg shadow-yellow-500/25">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-yellow-100/80 font-medium uppercase tracking-wider">🎯 {t('mission')}</span>
                    <span className="text-2xl drop-shadow-md">{targetEmoji}</span>
                    <span className="text-xs font-bold text-white drop-shadow-sm text-center leading-tight">{targetCreatureName}</span>
                  </div>
                </div>

                {/* Recipe card */}
                <div className="bg-black/65 backdrop-blur-sm rounded-xl px-2.5 py-2 text-white space-y-1.5">
                  {state.showHints && (
                    <>
                      <div className="space-y-1">
                        {state.currentLevel.recipe.ingredients.map((pid, idx) => (
                          <div key={`${pid}-${idx}`} className="flex items-center gap-1.5">
                            <span
                              className={`w-4 h-4 rounded-full shrink-0 border-2 shadow-sm
                                ${idx < state.cauldronPotions.length
                                  ? 'border-green-400 opacity-50'
                                  : 'border-white/60'}`}
                              style={{ backgroundColor: potionColors[pid] }}
                            />
                            <span className="text-[11px] text-gray-200 leading-tight">
                              {t(POTIONS[pid].label) || pid}
                            </span>
                            {idx < state.cauldronPotions.length && (
                              <span className="text-green-400 text-[10px]">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-white/15" />
                      <div className="space-y-0.5 text-[10px] text-gray-300">
                        <div>🔥 {toCelsius(state.currentLevel.recipe.heatRange[0])}–{toCelsius(state.currentLevel.recipe.heatRange[1])}°C</div>
                        {/* Stir pattern display */}
                        <div className="flex items-center gap-0.5 flex-wrap">
                          <span>🥄</span>
                          {state.currentLevel.recipe.stirPattern.map((dir, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold
                                ${i < state.stirCount
                                  ? 'bg-green-500/60 text-green-200'
                                  : i === state.stirCount
                                    ? 'bg-blue-500/80 text-white animate-pulse'
                                    : 'bg-white/15 text-gray-400'}`}
                              title={dir === 'cw' ? 'Clockwise' : 'Counter-clockwise'}
                            >
                              {dir === 'cw' ? '↻' : '↺'}
                            </span>
                          ))}
                        </div>
                        {state.currentLevel.recipe.orderMatters && (
                          <div className="text-yellow-300">⚠️ {t('orderMatters')}</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ─── Right Side Thermometer ─────────── */}
            {state.phase === 'playing' && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1 pointer-events-auto w-12">
                {/* Temperature readout */}
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-1 py-1 w-12 text-center">
                  <div className="text-white font-bold text-xs leading-none tabular-nums">{toCelsius(state.heatLevel)}°C</div>
                </div>
                {/* Thermometer body */}
                <div className="relative w-8 h-40 bg-gray-800/80 backdrop-blur-sm rounded-full border-2 border-gray-600 overflow-hidden">
                  {/* Mercury fill */}
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-150"
                    style={{
                      height: `${state.heatLevel * 100}%`,
                      background: `linear-gradient(to top, #ff4400, #ff8800 40%, #ffcc00 70%, #ffee88)`,
                    }}
                  />
                  {/* Tick marks */}
                  {[0.25, 0.5, 0.75].map((tick) => (
                    <div
                      key={tick}
                      className="absolute left-0 right-0 border-t border-white/20"
                      style={{ bottom: `${tick * 100}%` }}
                    />
                  ))}
                </div>
                {/* Slider (invisible, overlaid on thermometer) */}
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={state.heatLevel}
                  onChange={(e) => setHeatLevel(parseFloat(e.target.value))}
                  className="absolute top-8 w-8 h-40 opacity-0 cursor-pointer"
                  style={{
                    WebkitAppearance: 'slider-vertical',
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                  }}
                />
                {/* Labels */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-300">❄️</span>
                </div>
              </div>
            )}

            {/* ─── Bottom Controls (absolute overlay) ─ */}
            {state.phase === 'playing' && (
              <div className="absolute bottom-0 left-0 right-0 z-10
                bg-gradient-to-t from-black/80 via-black/60 to-transparent
                pt-4 pb-2.5 px-3 space-y-1.5">

                {/* Cauldron contents */}
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-sm">🧪</span>
                  {state.cauldronPotions.length > 0 ? (
                    state.cauldronPotions.map((id, idx) => (
                      <motion.span
                        key={`${id}-${idx}`}
                        initial={{ scale: 0, y: -10 }}
                        animate={{ scale: 1, y: 0 }}
                        className="w-6 h-6 rounded-full inline-block border-2 border-white/60 shadow-lg"
                        style={{ backgroundColor: potionColors[id] }}
                      />
                    ))
                  ) : (
                    <span className="text-xs text-gray-300/80 italic">
                      {t('step1')}
                    </span>
                  )}
                </div>

                {/* Potion selection row — with labels */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {potionList.map((id, idx) => (
                    <button
                      key={id}
                      onClick={() => handleAddPotion(id)}
                      className="flex flex-col items-center gap-0.5 group cursor-pointer select-none"
                      title={`${t(POTIONS[id].label) || id} (${idx + 1})`}
                    >
                      <span
                        className="w-10 h-10 rounded-full border-2 border-white/70 shadow-lg
                          transition-all active:scale-90 group-hover:scale-110 group-hover:border-yellow-400
                          flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: potionColors[id] }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-[10px] text-gray-300 leading-none">
                        {t(POTIONS[id].label) || id}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Stir controls + Action buttons */}
                <div className="flex items-center justify-center gap-3">
                  {/* Undo */}
                  <button
                    onClick={handleUndo}
                    disabled={state.cauldronPotions.length === 0}
                    className="px-3 py-1.5 bg-gray-500/80 backdrop-blur-sm text-white rounded-lg font-bold text-xs
                      shadow-md hover:bg-gray-600 active:scale-95 transition-all
                      disabled:opacity-30 disabled:cursor-not-allowed min-h-[36px]"
                  >
                    ↩️ {t('undo')}
                  </button>

                  {/* Interactive Stir Wheel */}
                  <div className="flex items-center gap-1.5">
                    {/* Counter-clockwise button */}
                    <button
                      onClick={() => handleStir('ccw')}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center
                        transition-all active:scale-90 shadow-md
                        ${stirDirection === 'ccw' && isStirring
                          ? 'bg-blue-400/90 border-blue-300 scale-110 animate-spin'
                          : 'bg-blue-500/70 border-blue-400/60 hover:bg-blue-400/80 hover:scale-105'}`}
                      style={stirDirection === 'ccw' && isStirring ? { animationDirection: 'reverse', animationDuration: '0.6s' } : {}}
                      title="Stir counter-clockwise (Q)"
                    >
                      <span className="text-lg">↺</span>
                    </button>

                    {/* Stir count display */}
                    <div className="flex flex-col items-center px-1">
                      <span className="text-white font-bold text-sm tabular-nums">{state.stirCount}</span>
                      <span className="text-[9px] text-gray-400 leading-none">{t('stir')}</span>
                    </div>

                    {/* Clockwise button */}
                    <button
                      onClick={() => handleStir('cw')}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center
                        transition-all active:scale-90 shadow-md
                        ${stirDirection === 'cw' && isStirring
                          ? 'bg-blue-400/90 border-blue-300 scale-110 animate-spin'
                          : 'bg-blue-500/70 border-blue-400/60 hover:bg-blue-400/80 hover:scale-105'}`}
                      style={stirDirection === 'cw' && isStirring ? { animationDuration: '0.6s' } : {}}
                      title="Stir clockwise (E)"
                    >
                      <span className="text-lg">↻</span>
                    </button>
                  </div>

                  {/* Brew */}
                  <button
                    onClick={handleBrew}
                    disabled={state.cauldronPotions.length === 0}
                    className="px-5 py-1.5 bg-purple-600/90 backdrop-blur-sm text-white rounded-lg font-bold text-xs
                      shadow-md hover:bg-purple-700 active:scale-95 transition-all
                      disabled:opacity-30 disabled:cursor-not-allowed min-h-[36px]"
                  >
                    ✨ {t('brew')}
                  </button>
                </div>
              </div>
            )}

            {/* ─── Brewing Overlay ──────────────────── */}
            <AnimatePresence>
              {state.phase === 'brewing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-4 rounded-xl z-20"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="text-5xl"
                  >
                    🧪
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white">{t('brewing')}</h2>
                  <div className="w-48 h-3 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${state.brewProgress * 100}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Result Overlay ───────────────────── */}
            <AnimatePresence>
              {state.phase === 'result' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 rounded-xl z-20"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="text-7xl"
                  >
                    {resultEmoji}
                  </motion.div>
                  <h2 className={`text-3xl font-bold ${state.stars > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {state.stars > 0 ? t('success') : t('failure')}
                  </h2>
                  <p className="text-xl text-white">{resultCreatureName}</p>
                  <div className="text-2xl">
                    {Array.from({ length: 3 }, (_, i) => (
                      <span key={i}>{i < state.stars ? '⭐' : '☆'}</span>
                    ))}
                  </div>
                  <p className="text-white">{t('score')}: {state.score}</p>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={handleRetry}
                      className="px-6 py-2 bg-orange-500 text-white font-bold rounded-2xl
                        shadow-lg hover:bg-orange-600 active:scale-95 transition-all min-h-[44px]"
                    >
                      {t('tryAgain')}
                    </button>
                    {state.stars > 0 && (
                      <button
                        onClick={handleNextLevel}
                        className="px-6 py-2 bg-green-500 text-white font-bold rounded-2xl
                          shadow-lg hover:bg-green-600 active:scale-95 transition-all min-h-[44px]"
                      >
                        {t('nextLevel')}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Pause Overlay ────────────────────── */}
            <AnimatePresence>
              {state.phase === 'paused' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-4 rounded-xl z-20"
                >
                  <h2 className="text-4xl font-bold text-white">{t('paused')}</h2>
                  <button
                    onClick={() => { sounds.playClick(); resume(); }}
                    className="px-8 py-3 bg-green-500 text-white text-xl font-bold rounded-2xl
                      shadow-lg hover:bg-green-600 active:scale-95 transition-all min-h-[48px]"
                  >
                    {t('resume')}
                  </button>
                  <button
                    onClick={handleBackToMenu}
                    className="px-6 py-2 bg-gray-500 text-white font-bold rounded-2xl
                      shadow-lg hover:bg-gray-600 active:scale-95 transition-all min-h-[40px]"
                  >
                    🏠
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Instructions modal */}
        <InstructionsModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          title={t('title')}
          instructions={[
            { icon: t('instructions.step0Icon'), title: t('instructions.step0Title'), description: t('instructions.step0Desc') },
            { icon: t('instructions.step1Icon'), title: t('instructions.step1Title'), description: t('instructions.step1Desc') },
            { icon: t('instructions.step2Icon'), title: t('instructions.step2Title'), description: t('instructions.step2Desc') },
            { icon: t('instructions.step3Icon'), title: t('instructions.step3Title'), description: t('instructions.step3Desc') },
          ]}
          controls={[
            { icon: t('instructions.control0Icon'), description: t('instructions.control0Desc') },
            { icon: t('instructions.control1Icon'), description: t('instructions.control1Desc') },
            { icon: t('instructions.control2Icon'), description: t('instructions.control2Desc') },
            { icon: t('instructions.control3Icon'), description: t('instructions.control3Desc') },
            { icon: t('instructions.control4Icon'), description: t('instructions.control4Desc') },
            { icon: t('instructions.control5Icon'), description: t('instructions.control5Desc') },
          ]}
          tip={t('instructions.tip')}
          locale={locale}
        />
      </div>
    </GameWrapper>
  );
}
