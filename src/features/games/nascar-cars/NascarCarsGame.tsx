'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { TextDirection } from '@/i18n/routing';
import { R3FGameContainer } from '../shared/r3f/R3FGameContainer';
import { NascarScene } from './NascarScene';
import {
  useNascarGame,
  Difficulty,
  DIFFICULTY_SETTINGS,
  CAREER_LEVELS,
} from './useNascarGame';

// ─── 4-locale translations ──────────────────────────────────
const translations: Record<string, Record<string, string>> = {
  en: {
    title: 'NASCAR Cars 3D',
    position: 'Position',
    lap: 'Lap',
    speed: 'Speed',
    gameOver: 'Race Over!',
    youWin: 'Podium Finish!',
    champion: 'Champion!',
    playAgain: 'Race Again',
    nextRace: 'Next Race',
    backToCareer: 'Back to Career',
    paused: 'Paused',
    resume: 'Resume',
    difficulty: 'Choose Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    career: 'Career Mode',
    locked: 'Locked',
    selectRace: 'Select Race',
    tapToStart: 'Tap to Start',
    steer: '← / → = Steer',
    accelerate: '↑ / W = Accelerate',
    brake: '↓ / S = Brake',
    escPause: 'P / Esc = Pause',
    touchSteer: 'Buttons = Steer',
    autoAccel: 'Auto-accelerate on Easy!',
    place1: '1st',
    place2: '2nd',
    place3: '3rd',
    finished: 'Finished',
    countdown3: '3',
    countdown2: '2',
    countdown1: '1',
    go: 'GO!',
    tires: 'Tires',
    pit: 'PIT',
    inPit: 'IN PIT',
    pitStop: 'Press Space to Pit',
  },
  he: {
    title: 'מכוניות נסקאר 3D',
    position: 'מקום',
    lap: 'הקפה',
    speed: 'מהירות',
    gameOver: '!המירוץ נגמר',
    youWin: '!סיום על הפודיום',
    champion: '!אלוף',
    playAgain: 'מירוץ חוזר',
    nextRace: 'מירוץ הבא',
    backToCareer: 'חזרה לקריירה',
    paused: 'מושהה',
    resume: 'המשך',
    difficulty: 'בחר רמת קושי',
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
    career: 'מצב קריירה',
    locked: 'נעול',
    selectRace: 'בחר מירוץ',
    tapToStart: 'לחצו להתחיל',
    steer: '← / → = היגוי',
    accelerate: '↑ / W = האצה',
    brake: '↓ / S = בלימה',
    escPause: 'P / Esc = השהה',
    touchSteer: 'כפתורים = היגוי',
    autoAccel: '!האצה אוטומטית בקל',
    place1: '1',
    place2: '2',
    place3: '3',
    finished: 'סיים',
    countdown3: '3',
    countdown2: '2',
    countdown1: '1',
    go: '!צא',
    tires: 'צמיגים',
    pit: 'פיט',
    inPit: 'בפיט',
    pitStop: 'לחצו רווח לפיט',
  },
  zh: {
    title: '3D纳斯卡赛车',
    position: '名次',
    lap: '圈',
    speed: '速度',
    gameOver: '比赛结束！',
    youWin: '登上领奖台！',
    champion: '冠军！',
    playAgain: '再次比赛',
    nextRace: '下一场',
    backToCareer: '返回职业模式',
    paused: '已暂停',
    resume: '继续',
    difficulty: '选择难度',
    easy: '简单',
    medium: '中等',
    hard: '困难',
    career: '职业模式',
    locked: '锁定',
    selectRace: '选择比赛',
    tapToStart: '点击开始',
    steer: '← / → = 转向',
    accelerate: '↑ / W = 加速',
    brake: '↓ / S = 刹车',
    escPause: 'P / Esc = 暂停',
    touchSteer: '按钮 = 转向',
    autoAccel: '简单模式自动加速！',
    place1: '第1',
    place2: '第2',
    place3: '第3',
    finished: '完成',
    countdown3: '3',
    countdown2: '2',
    countdown1: '1',
    go: '出发！',
    tires: '轮胎',
    pit: '进站',
    inPit: '进站中',
    pitStop: '按空格键进站',
  },
  es: {
    title: 'NASCAR Cars 3D',
    position: 'Posición',
    lap: 'Vuelta',
    speed: 'Velocidad',
    gameOver: '¡Carrera terminada!',
    youWin: '¡Podio!',
    champion: '¡Campeón!',
    playAgain: 'Correr de nuevo',
    nextRace: 'Siguiente carrera',
    backToCareer: 'Volver a carrera',
    paused: 'Pausado',
    resume: 'Continuar',
    difficulty: 'Elige Dificultad',
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
    career: 'Modo Carrera',
    locked: 'Bloqueado',
    selectRace: 'Elige Carrera',
    tapToStart: 'Toca para empezar',
    steer: '← / → = Girar',
    accelerate: '↑ / W = Acelerar',
    brake: '↓ / S = Frenar',
    escPause: 'P / Esc = Pausa',
    touchSteer: 'Botones = Girar',
    autoAccel: '¡Aceleración automática en Fácil!',
    place1: '1°',
    place2: '2°',
    place3: '3°',
    finished: 'Terminado',
    countdown3: '3',
    countdown2: '2',
    countdown1: '1',
    go: '¡YA!',
    tires: 'Neumáticos',
    pit: 'PIT',
    inPit: 'EN PIT',
    pitStop: 'Espacio para Pit Stop',
  },
};

// ─── Instructions ────────────────────────────────────────────
function getInstructions(locale: string) {
  const t = translations[locale] || translations.en;
  return {
    instructions: [
      { icon: '🏎️', title: locale === 'he' ? 'נהגו במכונית' : locale === 'zh' ? '驾驶你的赛车' : locale === 'es' ? 'Conduce tu auto' : 'Drive Your Car', description: locale === 'he' ? 'השתמשו בחצים או בכפתורים כדי להגות ולהאיץ' : locale === 'zh' ? '使用方向键或按钮转向和加速' : locale === 'es' ? 'Usa las flechas o botones para girar y acelerar' : 'Use arrow keys or buttons to steer and accelerate' },
      { icon: '🏁', title: locale === 'he' ? 'סיימו הקפות' : locale === 'zh' ? '完成圈数' : locale === 'es' ? 'Completa las vueltas' : 'Complete Laps', description: locale === 'he' ? 'סיימו את מספר ההקפות הנדרש כדי לסיים את המירוץ' : locale === 'zh' ? '完成所需圈数来结束比赛' : locale === 'es' ? 'Completa las vueltas requeridas para terminar' : 'Complete the required number of laps to finish the race' },
      { icon: '🏆', title: locale === 'he' ? 'סיימו על הפודיום' : locale === 'zh' ? '登上领奖台' : locale === 'es' ? 'Llega al podio' : 'Finish on Podium', description: locale === 'he' ? 'סיימו במקום 1-3 כדי לפתוח את המירוץ הבא' : locale === 'zh' ? '在前3名完成以解锁下一场比赛' : locale === 'es' ? '¡Termina en el top 3 para desbloquear la siguiente!' : 'Finish in the top 3 to unlock the next race!' },
      { icon: '⚡', title: locale === 'he' ? 'רמות קריירה' : locale === 'zh' ? '职业等级' : locale === 'es' ? 'Niveles de carrera' : 'Career Levels', description: locale === 'he' ? '5 רמות מאימון ועד אליפות - כל רמה קשה יותר!' : locale === 'zh' ? '从训练到锦标赛的5个级别 - 每级更难！' : locale === 'es' ? '5 niveles de entrenamiento a campeonato - ¡cada uno más difícil!' : '5 levels from training to championship — each one harder!' },
      { icon: '🔧', title: locale === 'he' ? 'עצירת פיט' : locale === 'zh' ? '进站' : locale === 'es' ? 'Pit Stop' : 'Pit Stop', description: locale === 'he' ? 'לחצו רווח כדי לבקש עצירת פיט. הצמיגים נשחקים - החליפו אותם בזמן!' : locale === 'zh' ? '按空格键请求进站。轮胎会磨损——及时更换！' : locale === 'es' ? '¡Presiona Espacio para pedir pit stop. Los neumáticos se desgastan — cámbialos a tiempo!' : 'Press Space to request a pit stop. Tires wear out — change them in time!' },
    ],
    controls: [
      { icon: '⬅️➡️', description: t.steer },
      { icon: '⬆️', description: t.accelerate },
      { icon: '⬇️', description: t.brake },
      { icon: '⏸️', description: t.escPause },
      { icon: '�', description: t.pitStop },
      { icon: '�👆', description: t.touchSteer },
    ],
    tip: locale === 'he' ? 'ברמה קלה, המכונית מאיצה אוטומטית - רק תגיהו!' : locale === 'zh' ? '在简单模式下，汽车自动加速——只需转向！' : locale === 'es' ? '¡En fácil el auto acelera solo — solo gira!' : 'On Easy, the car auto-accelerates — just steer!',
  };
}

// ─── Props ───────────────────────────────────────────────────
interface NascarCarsGameProps {
  locale?: string;
}

type GamePhase = 'menu' | 'career-select' | 'racing' | 'paused' | 'race-complete';

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
export default function NascarCarsGame({ locale = 'en' }: NascarCarsGameProps) {
  const t = translations[locale] || translations.en;
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const instData = getInstructions(locale);
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

  const { playHit, playSuccess, playGameOver, playWin, playClick, playLevelUp } = useRetroSounds();

  const {
    raceState: raceStateRef,
    settings,
    levelConfig,
    initRace,
    update,
  } = useNascarGame(difficulty, levelIndex, locale);

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
  const startRace = useCallback((diff: Difficulty, level: number) => {
    setDifficulty(diff);
    setLevelIndex(level);
    setRaceFinished(false);
    setFinishPosition(1);
    setPlayerLap(0);
    setCountdown(3);
    setPhase('racing');
    playClick();
  }, [playClick]);

  useEffect(() => {
    if (phase === 'racing') {
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
  }, [update, levelIndex, unlockedLevel, careerLevels.length, playLevelUp, playWin, playGameOver]);

  // ── Difficulty options ──
  const difficultyOptions: { key: Difficulty; emoji: string; color: string }[] = [
    { key: 'easy', emoji: '🟢', color: 'from-green-400 to-green-500' },
    { key: 'medium', emoji: '🟡', color: 'from-yellow-400 to-orange-400' },
    { key: 'hard', emoji: '🔴', color: 'from-red-400 to-red-600' },
  ];

  const positionEmoji = playerPosition <= 3 ? ['🥇', '🥈', '🥉'][playerPosition - 1] : `#${playerPosition}`;

  return (
    <GameWrapper
      title={t.title}
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
                {t.title}
              </h2>

              <p className="text-lg text-slate-500">{t.difficulty}</p>

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
                    <span>{t[key]}</span>
                    {key === 'easy' && (
                      <span className="text-xs opacity-80">{t.autoAccel}</span>
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
              <h2 className="text-2xl font-bold text-slate-700">{t.career}</h2>
              <p className="text-sm text-slate-400">{t.selectRace}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl px-4">
                {careerLevels.map((level, i) => {
                  const unlocked = i <= unlockedLevel;
                  return (
                    <motion.button
                      key={i}
                      whileHover={unlocked ? { scale: 1.05 } : {}}
                      whileTap={unlocked ? { scale: 0.95 } : {}}
                      onClick={() => unlocked && startRace(difficulty, i)}
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
                        {level.laps} {t.lap}s • {level.opponents} {locale === 'he' ? 'מתחרים' : locale === 'zh' ? '对手' : locale === 'es' ? 'rivales' : 'opponents'}
                      </div>
                      {!unlocked && (
                        <div className="text-xs mt-1">🔒 {t.locked}</div>
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

        {/* ── RACING ── */}
        {(phase === 'racing' || phase === 'paused') && (
          <div className="relative">
            {/* HUD */}
            <div className="flex justify-between items-center px-4 py-2 mb-2">
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold">
                  {positionEmoji} {t.position}: {playerPosition}
                </span>
                <span className="text-sm text-slate-500">
                  {t.lap}: {Math.min(playerLap + 1, levelConfig.laps)}/{levelConfig.laps}
                </span>
                {/* Speed bar */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">{t.speed}</span>
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
                  <span className="text-xs font-bold text-slate-500">{t.tires}</span>
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
                    <span className="text-xs font-bold text-amber-500 animate-pulse">{t.pit}!</span>
                  )}
                </div>
                {/* In-pit indicator */}
                {inPit && (
                  <span className="text-xs font-bold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full animate-pulse">
                    🔧 {t.inPit}
                  </span>
                )}
              </div>
              <LevelDisplay level={levelIndex + 1} />
            </div>

            {/* 3D Canvas */}
            <R3FGameContainer
              camera={{ position: [0, 10, 25], fov: 55 }}
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
                numAiCars={levelConfig.opponents}
                countdown={countdown}
                locale={locale}
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
                🔧 {t.pit}
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
                    <p className="text-4xl font-bold text-white mb-4">{t.paused}</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPhase('racing')}
                      className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-red-500 text-white rounded-full font-bold text-lg"
                    >
                      {t.resume}
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
          title={t.title}
          instructions={instData.instructions}
          controls={instData.controls}
          tip={instData.tip}
          locale={locale}
        />
      </div>
    </GameWrapper>
  );
}
