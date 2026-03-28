'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { TextDirection } from '@/i18n/routing';
import { R3FGameContainer } from '../shared/r3f/R3FGameContainer';
import { NascarScene, CameraMode } from './NascarScene';
import { CarType, PLAYER_COLORS, CAR_TYPE_LABELS } from './Car';
import {
  useNascarGame,
  Difficulty,
  DIFFICULTY_SETTINGS,
  CAREER_LEVELS,
} from './useNascarGame';

// ─── 4-locale translations ──────────────────────────────────


// ─── Props ───────────────────────────────────────────────────

type GamePhase = 'menu' | 'career-select' | 'car-select' | 'intro' | 'racing' | 'paused' | 'race-complete';

// ─── Career progress persistence ─────────────────────────────
const CAREER_KEY = 'nascar-career-progress';
function loadCareerProgress(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(CAREER_KEY) || '0', 10);
}
function saveCareerProgress(level: number) {
  if (typeof window === 'undefined') return;
  const prev = loadCareerProgress();
  if (level > prev) localStorage.setItem(CAREER_KEY, String(level));
}

// ─── Component ───────────────────────────────────────────────
export default function NascarCarsGame() {
  const t = useTranslations('nascarCars');
  const locale = useLocale();
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const careerLevels = CAREER_LEVELS[locale] || CAREER_LEVELS.en;

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [levelIndex, setLevelIndex] = useState(0);
  const [unlockedLevel, setUnlockedLevel] = useState(loadCareerProgress);
  const [showInstructions, setShowInstructions] = useState(false);
  const [playerPosition, setPlayerPosition] = useState(1);
  const [playerLap, setPlayerLap] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [raceFinished, setRaceFinished] = useState(false);
  const [finishPosition, setFinishPosition] = useState(1);
  const [speedPct, setSpeedPct] = useState(0);
  const [tireWear, setTireWear] = useState(0);
  const [inPit, setInPit] = useState(false);
  const [playerColor, setPlayerColor] = useState(PLAYER_COLORS[0].hex);
  const [playerCarType, setPlayerCarType] = useState<CarType>('stock');
  const [cameraMode, setCameraMode] = useState<CameraMode>('tv');
  const [numOpponents, setNumOpponents] = useState(4);
  const [currentSteer, setCurrentSteer] = useState(0);

  const { playHit, playSuccess, playGameOver, playWin, playClick, playLevelUp } = useRetroSounds();

  const {
    raceState: raceStateRef,
    settings,
    levelConfig,
    initRace,
    update,
  } = useNascarGame(difficulty, levelIndex, locale, numOpponents);

  // ── Input state ──
  const keysRef = useRef<Set<string>>(new Set());
  const steerInput = useRef(0);
  const accelInput = useRef(false);
  const brakeInput = useRef(false);
  const pitInput = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (phase === 'racing') setPhase('paused');
        else if (phase === 'paused') setPhase('racing');
      }
      if (e.key === 'c' || e.key === 'C') {
        if (phase === 'racing' || phase === 'paused') {
          setCameraMode(prev => prev === 'tv' ? 'cockpit' : 'tv');
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [phase]);

  // ── Start race ──
  const startRace = useCallback(() => {
    setRaceFinished(false);
    setFinishPosition(1);
    setPlayerLap(0);
    setCountdown(5); // Longer countdown for cinematic intro
    setPhase('intro');
    playClick();
  }, [playClick]);

  // ── Select level (goes to car-select first) ──
  const selectLevel = useCallback((diff: Difficulty, level: number) => {
    setDifficulty(diff);
    setLevelIndex(level);
    setPhase('car-select');
    playClick();
  }, [playClick]);

  useEffect(() => {
    if (phase === 'racing' || phase === 'intro') {
      initRace();
    }
  }, [phase, difficulty, levelIndex, initRace]);

  // ── Frame update ──
  const onFrame = useCallback((delta: number) => {
    // Read keyboard
    const keys = keysRef.current;
    let steer = 0;
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) steer -= 1;
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) steer += 1;
    steer += steerInput.current;
    setCurrentSteer(steer);

    const accel = keys.has('ArrowUp') || keys.has('w') || keys.has('W') || accelInput.current;
    const brake = keys.has('ArrowDown') || keys.has('s') || keys.has('S') || brakeInput.current;
    const pitReq = keys.has(' ') || pitInput.current;

    const state = update(
      delta,
      steer,
      accel,
      brake,
      (lap) => {
        setPlayerLap(lap);
        playLevelUp();
      },
      (position) => {
        setRaceFinished(true);
        setFinishPosition(position);
        if (position <= 3) {
          playWin();
          // Unlock next level
          const nextLevel = levelIndex + 1;
          if (nextLevel > unlockedLevel && nextLevel < careerLevels.length) {
            setUnlockedLevel(nextLevel);
            saveCareerProgress(nextLevel);
          }
        } else {
          playGameOver();
        }
        setPhase('race-complete');
      },
      pitReq,
    );

    setPlayerPosition(state.playerPosition);
    setCountdown(state.countdown);
    setSpeedPct(state.playerSpeedPct);
    setTireWear(state.playerTireWear);
    setInPit(state.playerInPit);

    // Sound effects on collision
    if (state.collisionEvents && state.collisionEvents.length > 0) {
      playHit();
    }
  }, [update, levelIndex, unlockedLevel, careerLevels.length, playLevelUp, playWin, playGameOver, playHit]);

  // ── Difficulty options ──
  const difficultyOptions: { key: Difficulty; emoji: string; color: string }[] = [
    { key: 'easy', emoji: '🟢', color: 'from-green-400 to-green-500' },
    { key: 'medium', emoji: '🟡', color: 'from-yellow-400 to-orange-400' },
    { key: 'hard', emoji: '🔴', color: 'from-red-400 to-red-600' },
  ];

  const positionEmoji = playerPosition <= 3 ? ['🥇', '🥈', '🥉'][playerPosition - 1] : `#${playerPosition}`;

  return (
    <GameWrapper
      title={t('title')}
      showBackButton
      onInstructionsClick={() => setShowInstructions(true)}
    >
      <div className={`relative`} dir={direction}>
        {/* ── MENU ── */}
        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-8 gap-6"
            >
              <motion.div
                animate={{ x: [-10, 10, -10] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="text-7xl"
              >
                🏎️
              </motion.div>

              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">
                {t('title')}
              </h2>

              <p className="text-lg text-slate-500">{t('difficulty')}</p>

              <div className="flex gap-4 flex-wrap justify-center">
                {difficultyOptions.map(({ key, emoji, color }) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setDifficulty(key);
                      setPhase('career-select');
                      playClick();
                    }}
                    className={`px-6 py-4 rounded-2xl bg-gradient-to-br ${color} text-white font-bold text-lg shadow-lg flex flex-col items-center gap-1 min-w-[120px]`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span>{(t as any)(key)}</span>
                    {key === 'easy' && (
                      <span className="text-xs opacity-80">{t('autoAccel')}</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CAREER SELECT ── */}
        <AnimatePresence mode="wait">
          {phase === 'career-select' && (
            <motion.div
              key="career"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center py-6 gap-4"
            >
              <h2 className="text-2xl font-bold text-slate-700">{t('career')}</h2>
              <p className="text-sm text-slate-400">{t('selectRace')}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl px-4">
                {careerLevels.map((level, i) => {
                  const unlocked = i <= unlockedLevel;
                  return (
                    <motion.button
                      key={i}
                      whileHover={unlocked ? { scale: 1.05 } : {}}
                      whileTap={unlocked ? { scale: 0.95 } : {}}
                      onClick={() => unlocked && selectLevel(difficulty, i)}
                      disabled={!unlocked}
                      className={`p-4 rounded-xl text-left transition-all ${
                        unlocked
                          ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{unlocked ? ['🏁', '🏆', '⭐', '🔥', '👑'][i] : '🔒'}</span>
                        <span className="font-bold">{level.name}</span>
                      </div>
                      <div className="text-xs opacity-80">
                        {level.laps} {t('lap')}s • {level.opponents} {t('opponents')}
                      </div>
                      {!unlocked && (
                        <div className="text-xs mt-1">🔒 {t('locked')}</div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPhase('menu')}
                className="mt-2 px-6 py-2 bg-slate-200 text-slate-600 rounded-full font-bold"
              >
                ← {locale === 'he' ? 'חזרה' : locale === 'zh' ? '返回' : locale === 'es' ? 'Volver' : 'Back'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CAR SELECT ── */}
        <AnimatePresence mode="wait">
          {phase === 'car-select' && (
            <motion.div
              key="car-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center py-6 gap-5 max-w-xl mx-auto"
            >
              <h2 className="text-2xl font-bold text-slate-700">{t('chooseCar')}</h2>

              {/* Car type selector */}
              <div>
                <p className="text-sm font-bold text-slate-500 mb-2 text-center">{t('pickType')}</p>
                <div className="flex gap-3 justify-center">
                  {(['stock', 'formula', 'muscle'] as CarType[]).map((type) => {
                    const typeLabels = CAR_TYPE_LABELS[locale] || CAR_TYPE_LABELS.en;
                    const emojis: Record<CarType, string> = { stock: '🏎️', formula: '🏁', muscle: '💪' };
                    return (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPlayerCarType(type)}
                        className={`px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex flex-col items-center gap-1 min-w-[100px] ${
                          playerCarType === type
                            ? 'bg-gradient-to-br from-yellow-400 to-red-500 text-white ring-2 ring-yellow-300 scale-105'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <span className="text-2xl">{emojis[type]}</span>
                        <span>{typeLabels[type]}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <p className="text-sm font-bold text-slate-500 mb-2 text-center">{t('pickColor')}</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {PLAYER_COLORS.map(({ hex }) => (
                    <motion.button
                      key={hex}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setPlayerColor(hex)}
                      className={`w-10 h-10 rounded-full border-2 transition-all shadow-md ${
                        playerColor === hex ? 'ring-3 ring-yellow-400 border-white scale-110' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Camera mode toggle */}
              <div>
                <p className="text-sm font-bold text-slate-500 mb-2 text-center">{t('camera')}</p>
                <div className="flex gap-3 justify-center">
                  {([
                    { mode: 'tv' as CameraMode, emoji: '📺', label: t('cameraTv') },
                    { mode: 'cockpit' as CameraMode, emoji: '🪖', label: t('cameraCockpit') },
                  ]).map(({ mode, emoji, label }) => (
                    <motion.button
                      key={mode}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCameraMode(mode)}
                      className={`px-5 py-2 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
                        cameraMode === mode
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white ring-2 ring-blue-300'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <span className="text-lg">{emoji}</span>
                      <span>{label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Opponent count picker */}
              <div>
                <p className="text-sm font-bold text-slate-500 mb-2 text-center">{t('opponents')}: {numOpponents}</p>
                <div className="flex items-center gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setNumOpponents(Math.max(1, numOpponents - 1))}
                    className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center hover:bg-slate-300"
                  >
                    −
                  </motion.button>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setNumOpponents(i + 1)}
                        className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                          numOpponents === i + 1
                            ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white ring-2 ring-orange-300 scale-110'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {i + 1}
                      </motion.button>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setNumOpponents(Math.min(10, numOpponents + 1))}
                    className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center hover:bg-slate-300"
                  >
                    +
                  </motion.button>
                </div>
              </div>

              {/* Start race button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRace}
                className="mt-2 px-10 py-4 bg-gradient-to-r from-green-400 to-green-600 text-white font-bold text-xl rounded-2xl shadow-xl"
              >
                🏁 {t('startRace')}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPhase('career-select')}
                className="px-6 py-2 bg-slate-200 text-slate-600 rounded-full font-bold text-sm"
              >
                ← {locale === 'he' ? 'חזרה' : locale === 'zh' ? '返回' : locale === 'es' ? 'Volver' : 'Back'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PRE-RACE CINEMATIC INTRO ── */}
        {phase === 'intro' && (
          <div className="relative">
            <R3FGameContainer
              camera={{ position: [0, 25, 110], fov: 60 }}
              className="rounded-xl overflow-hidden shadow-2xl"
            >
              <NascarScene
                raceStateRef={raceStateRef}
                paused={true}
                gameActive={false}
                introActive={true}
                onIntroComplete={() => {
                  setCountdown(3);
                  setPhase('racing');
                }}
                onFrame={() => {}}
                playerPosition={1}
                playerLap={0}
                totalLaps={levelConfig.laps}
                numAiCars={numOpponents}
                countdown={5}
                locale={locale}
                cameraMode="tv"
                playerColor={playerColor}
                playerCarType={playerCarType}
                steerAngle={0}
              />
            </R3FGameContainer>
            {/* Cinematic overlay — dark bars + text */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
              {/* Top letterbox bar */}
              <div className="h-16 bg-black/70" />
              {/* Center text */}
              <div className="flex-1 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                  className="text-center"
                >
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-white text-sm font-bold tracking-widest uppercase opacity-60"
                  >
                    {careerLevels[levelIndex]?.name ?? 'Race'}
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, scale: 2 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [2, 1, 1, 0.8] }}
                    transition={{ duration: 6, times: [0, 0.15, 0.7, 1] }}
                    className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-orange-500 drop-shadow-lg"
                  >
                    🏁 RACE DAY 🏁
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0, 1] }}
                    transition={{ duration: 4, times: [0, 0.5, 1] }}
                    className="text-white text-lg mt-2 font-bold"
                  >
                    {numOpponents} {t('opponents')} • {levelConfig.laps} {t('lap')}s
                  </motion.p>
                </motion.div>
              </div>
              {/* Bottom letterbox bar + skip button */}
              <div className="h-16 bg-black/70 flex items-center justify-end px-6">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 2 }}
                  onClick={() => { setCountdown(3); setPhase('racing'); }}
                  className="text-white/60 text-sm font-bold hover:text-white transition-colors pointer-events-auto"
                >
                  {locale === 'he' ? 'דלגו ←' : locale === 'zh' ? '跳过 →' : locale === 'es' ? 'Saltar →' : 'Skip →'}
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* ── RACING ── */}
        {(phase === 'racing' || phase === 'paused') && (
          <div className="relative">
            {/* HUD */}
            <div className="flex justify-between items-center px-4 py-2 mb-2">
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold">
                  {positionEmoji} {t('position')}: {playerPosition}
                </span>
                <span className="text-sm text-slate-500">
                  {t('lap')}: {Math.min(playerLap + 1, levelConfig.laps)}/{levelConfig.laps}
                </span>
                {/* Speed bar */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">{t('speed')}</span>
                  <div className="w-24 h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-100"
                      style={{
                        width: `${speedPct}%`,
                        background: speedPct > 80 ? '#ef4444' : speedPct > 50 ? '#f59e0b' : '#22c55e',
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-500 w-8">{speedPct}%</span>
                </div>
                {/* Tire wear bar */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">{t('tires')}</span>
                  <div className="w-20 h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-100"
                      style={{
                        width: `${100 - tireWear}%`,
                        background: tireWear > 70 ? '#ef4444' : tireWear > 40 ? '#f59e0b' : '#22c55e',
                      }}
                    />
                  </div>
                  {tireWear > 50 && (
                    <span className="text-xs font-bold text-amber-500 animate-pulse">{t('pit')}!</span>
                  )}
                </div>
                {/* In-pit indicator */}
                {inPit && (
                  <span className="text-xs font-bold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full animate-pulse">
                    🔧 {t('inPit')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCameraMode(cameraMode === 'tv' ? 'cockpit' : 'tv')}
                  className="px-3 py-1 bg-slate-700 text-white rounded-lg text-xs font-bold hover:bg-slate-600 transition-colors"
                >
                  {cameraMode === 'tv' ? '📺 TV' : '🪖 1P'}
                </button>
                <LevelDisplay level={levelIndex + 1} />
              </div>
            </div>

            {/* 3D Canvas */}
            <R3FGameContainer
              camera={{ position: [0, 25, 110], fov: 60 }}
              className="rounded-xl overflow-hidden shadow-2xl"
            >
              <NascarScene
                raceStateRef={raceStateRef}
                paused={phase === 'paused'}
                gameActive={phase === 'racing'}
                onFrame={onFrame}
                playerPosition={playerPosition}
                playerLap={playerLap}
                totalLaps={levelConfig.laps}
                numAiCars={numOpponents}
                countdown={countdown}
                locale={locale}
                cameraMode={cameraMode}
                playerColor={playerColor}
                playerCarType={playerCarType}
                steerAngle={currentSteer}
              />
            </R3FGameContainer>

            {/* Mobile touch controls */}
            <div className="flex justify-center gap-3 mt-3 md:hidden">
              <button
                className="px-6 py-3 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition-transform select-none"
                onTouchStart={() => { steerInput.current = -1; }}
                onTouchEnd={() => { steerInput.current = 0; }}
              >
                ←
              </button>
              {!settings.autoAccelerate && (
                <button
                  className="px-6 py-3 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition-transform select-none"
                  onTouchStart={() => { accelInput.current = true; }}
                  onTouchEnd={() => { accelInput.current = false; }}
                >
                  ⬆️
                </button>
              )}
              <button
                className="px-6 py-3 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition-transform select-none"
                onTouchStart={() => { steerInput.current = 1; }}
                onTouchEnd={() => { steerInput.current = 0; }}
              >
                →
              </button>
              <button
                className="px-4 py-3 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-transform select-none"
                onTouchStart={() => { pitInput.current = true; }}
                onTouchEnd={() => { pitInput.current = false; }}
              >
                🔧 {t('pit')}
              </button>
            </div>

            {/* Pause overlay */}
            <AnimatePresence>
              {phase === 'paused' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl z-10"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-center"
                  >
                    <p className="text-4xl font-bold text-white mb-4">{t('paused')}</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPhase('racing')}
                      className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-red-500 text-white rounded-full font-bold text-lg"
                    >
                      {t('resume')}
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── RACE COMPLETE ── */}
        <WinModal
          isOpen={phase === 'race-complete'}
          onPlayAgain={() => setPhase('career-select')}
          score={finishPosition}
        />

        {/* ── INSTRUCTIONS ── */}
        <InstructionsModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          title={t('title')}
          instructions={[
            { icon: t('instructions.step0Icon'), title: t('instructions.step0Title'), description: t('instructions.step0Desc') },
            { icon: t('instructions.step1Icon'), title: t('instructions.step1Title'), description: t('instructions.step1Desc') },
            { icon: t('instructions.step2Icon'), title: t('instructions.step2Title'), description: t('instructions.step2Desc') },
            { icon: t('instructions.step3Icon'), title: t('instructions.step3Title'), description: t('instructions.step3Desc') },
            { icon: t('instructions.step4Icon'), title: t('instructions.step4Title'), description: t('instructions.step4Desc') },
          ]}
          controls={[
            { icon: t('instructions.ctrl0Icon'), description: t('instructions.ctrl0Desc') },
            { icon: t('instructions.ctrl1Icon'), description: t('instructions.ctrl1Desc') },
            { icon: t('instructions.ctrl2Icon'), description: t('instructions.ctrl2Desc') },
            { icon: t('instructions.ctrl3Icon'), description: t('instructions.ctrl3Desc') },
            { icon: t('instructions.ctrl4Icon'), description: t('instructions.ctrl4Desc') },
            { icon: t('instructions.ctrl5Icon'), description: t('instructions.ctrl5Desc') },
          ]}
          tip={t('instructions.tip')}
          locale={locale}
        />
      </div>
    </GameWrapper>
  );
}
