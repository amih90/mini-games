'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { R3FGameContainer } from '../shared/r3f/R3FGameContainer';
import { ArmyRunnerScene } from './ArmyRunnerScene';
import { useArmyRunnerGame, Difficulty, DIFFICULTY_SETTINGS, TRACK_WIDTH } from './useArmyRunnerGame';
import { useTranslations } from 'next-intl';



// ─── Component ──────────────────────────────────────────────
interface ArmyRunnerGameProps {
  locale?: string;
}

export default function ArmyRunnerGame({ locale = 'en' }: ArmyRunnerGameProps) {
  const t = useTranslations('armyRunner');
  const sounds = useRetroSounds();
  const [showInstructions, setShowInstructions] = useState(true);
  const pointerRef = useRef<{ active: boolean }>({ active: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    phase,
    setPhase,
    displaySoldierCount,
    displayCoins,
    displayScore,
    displayLevel,
    displayProgress,
    gameStateRef,
    startGame,
    nextLevel,
    pause,
    resume,
    moveGroup,
    setGroupTarget,
    updateFrame,
    handleEvents,
  } = useArmyRunnerGame();

  // High score tracking
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('army-runner-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // Update high score when game ends
  const checkHighScore = useCallback((score: number) => {
    setHighScore(prev => {
      if (score > prev) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('army-runner-highscore', String(score));
        }
        return score;
      }
      return prev;
    });
  }, []);

  // Keyboard pause
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.key.toLowerCase() === 'p') && phase === 'playing') {
        pause();
      } else if ((e.key === 'Escape' || e.key.toLowerCase() === 'p') && phase === 'paused') {
        resume();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, pause, resume]);

  // Position-based pointer input: finger X position maps directly to track position
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== 'playing') return;
    pointerRef.current.active = true;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    setGroupTarget((relX - 0.5) * TRACK_WIDTH);
  }, [phase, setGroupTarget]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (phase !== 'playing' || !pointerRef.current.active) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    setGroupTarget((relX - 0.5) * TRACK_WIDTH);
  }, [phase, setGroupTarget]);

  const handlePointerUp = useCallback(() => {
    pointerRef.current.active = false;
  }, []);

  const onFrame = useCallback((delta: number) => {
    return updateFrame(delta);
  }, [updateFrame]);

  const onEvents = useCallback((events: string[]) => {
    handleEvents(events, {
      playPowerUp: sounds.playPowerUp,
      playHit: sounds.playHit,
      playShoot: sounds.playShoot,
      playGameOver: sounds.playGameOver,
      playWin: sounds.playWin,
      playSuccess: sounds.playSuccess,
      playLevelUp: sounds.playLevelUp,
    });
    if (events.includes('win') || events.includes('gameOver')) {
      checkHighScore(gameStateRef.current.score);
    }
  }, [handleEvents, sounds, checkHighScore, gameStateRef]);

  const handleDifficultySelect = useCallback((diff: Difficulty) => {
    sounds.playClick();
    startGame(diff);
  }, [sounds, startGame]);

  const handlePlayAgain = useCallback(() => {
    sounds.playClick();
    setPhase('menu');
  }, [sounds, setPhase]);

  const handleNextLevel = useCallback(() => {
    sounds.playClick();
    nextLevel();
  }, [sounds, nextLevel]);

  // Mobile button helpers — continuous movement while held
  const stopMobileMove = useCallback(() => {
    if (mobileIntervalRef.current) {
      clearInterval(mobileIntervalRef.current);
      mobileIntervalRef.current = null;
    }
  }, []);

  const startMobileMove = useCallback((dir: 1 | -1) => {
    stopMobileMove();
    moveGroup(dir * 0.15);
    mobileIntervalRef.current = setInterval(() => {
      moveGroup(dir * 0.15);
    }, 16);
  }, [moveGroup, stopMobileMove]);

  return (
    <GameWrapper
      title={t('title')}
      onInstructionsClick={() => setShowInstructions(true)}
    >
      <div className="flex flex-col items-center gap-3 w-full max-w-[800px] mx-auto">
        {/* Level display */}
        {phase !== 'menu' && <LevelDisplay level={displayLevel} />}

        {/* ─── Menu Phase ──────────────────────────────── */}
        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-4 p-6 bg-white rounded-3xl shadow-lg w-full"
            >
              <h2 className="text-2xl font-bold text-gray-800">{t('difficulty')}</h2>

              {highScore > 0 && (
                <p className="text-sm text-gray-500">
                  {t('highScore')}: {highScore}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
                  const settings = DIFFICULTY_SETTINGS[diff];
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
                      <div className="text-xs opacity-80">
                        {t('startWith')} {settings.startSoldiers} {t('soldiersSuffix')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Game Canvas ─────────────────────────────── */}
        {phase !== 'menu' && (
          <div
            ref={containerRef}
            className="relative w-full touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* HUD Overlay */}
            <div className="absolute top-0 left-0 right-0 z-10 p-3 pointer-events-none">
              {/* Progress bar */}
              <div className="w-full h-3 bg-gray-300/50 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                  style={{ width: `${displayProgress * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>

              <div className="flex justify-between items-center text-white text-sm font-bold drop-shadow-md">
                <div className="bg-black/40 rounded-xl px-3 py-1">
                  🪖 {displaySoldierCount}
                </div>
                <div className="bg-black/40 rounded-xl px-3 py-1">
                  🪙 {displayCoins}
                </div>
                <div className="bg-black/40 rounded-xl px-3 py-1">
                  ⭐ {displayScore}
                </div>
              </div>
            </div>

            {/* 3D Canvas */}
            <R3FGameContainer
              camera={{ position: [0, 6, -8], fov: 60 }}
              className="rounded-xl overflow-hidden shadow-2xl"
            >
              <ArmyRunnerScene
                gameStateRef={gameStateRef}
                paused={phase === 'paused'}
                gameActive={phase === 'playing'}
                onFrame={onFrame}
                onEvents={onEvents}
                moveGroup={moveGroup}
              />
            </R3FGameContainer>

            {/* Pause overlay */}
            <AnimatePresence>
              {phase === 'paused' && (
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Over overlay */}
            <AnimatePresence>
              {phase === 'lost' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 rounded-xl z-20"
                >
                  <h2 className="text-4xl font-bold text-red-400">{t('gameOver')}</h2>
                  <p className="text-white text-xl">{t('finalScore')}: {displayScore}</p>
                  {displayScore >= highScore && displayScore > 0 && (
                    <p className="text-yellow-300 text-lg font-bold">🏆 {t('highScore')}!</p>
                  )}
                  <button
                    onClick={handlePlayAgain}
                    className="px-8 py-3 bg-blue-500 text-white text-xl font-bold rounded-2xl
                      shadow-lg hover:bg-blue-600 active:scale-95 transition-all min-h-[48px]"
                  >
                    {t('playAgain')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Touch hint */}
            {phase === 'playing' && displayProgress < 0.05 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-4 left-0 right-0 text-center pointer-events-none"
              >
                <span className="bg-black/40 text-white px-4 py-2 rounded-full text-sm font-medium">
                  👈 {t('tapToStart')} 👉
                </span>
              </motion.div>
            )}
          </div>
        )}

        {/* On-screen mobile left/right buttons (shown when playing on small screens) */}
        {phase === 'playing' && (
          <div className="flex md:hidden justify-between gap-4 mt-3 w-full px-2" dir="ltr">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onPointerDown={(e) => { e.preventDefault(); startMobileMove(-1); }}
              onPointerUp={stopMobileMove}
              onPointerLeave={stopMobileMove}
              onPointerCancel={stopMobileMove}
              className="flex-1 py-4 bg-gradient-to-br from-blue-400 to-blue-600 text-white text-3xl font-bold rounded-2xl shadow-lg select-none active:from-blue-500 active:to-blue-700"
              aria-label="Move Left"
            >
              ←
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onPointerDown={(e) => { e.preventDefault(); startMobileMove(1); }}
              onPointerUp={stopMobileMove}
              onPointerLeave={stopMobileMove}
              onPointerCancel={stopMobileMove}
              className="flex-1 py-4 bg-gradient-to-br from-blue-400 to-blue-600 text-white text-3xl font-bold rounded-2xl shadow-lg select-none active:from-blue-500 active:to-blue-700"
              aria-label="Move Right"
            >
              →
            </motion.button>
          </div>
        )}

        {/* Win modal */}
        <WinModal
          isOpen={phase === 'won'}
          onPlayAgain={handleNextLevel}
          onClose={handlePlayAgain}
          score={displayScore}
        />

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
          ]}
          tip={t('instructions.tip')}
          locale={locale}
        />
      </div>
    </GameWrapper>
  );
}
