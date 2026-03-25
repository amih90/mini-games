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

// ─── 4-locale translations ──────────────────────────────────
const translations: Record<string, Record<string, string>> = {
  en: {
    title: 'Army Runner 3D',
    soldiers: 'Soldiers',
    coins: 'Coins',
    score: 'Score',
    highScore: 'Best',
    level: 'Level',
    gameOver: 'Game Over!',
    youWin: 'Level Complete!',
    playAgain: 'Play Again',
    nextLevel: 'Next Level',
    paused: 'Paused',
    resume: 'Resume',
    difficulty: 'Choose Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    startWith: 'Start with',
    soldiersSuffix: 'soldiers',
    tapToStart: 'Swipe left/right to move!',
    finalScore: 'Final Score',
  },
  he: {
    title: 'מרוץ הצבא 3D',
    soldiers: 'חיילים',
    coins: 'מטבעות',
    score: 'ניקוד',
    highScore: 'שיא',
    level: 'שלב',
    gameOver: '!המשחק נגמר',
    youWin: '!השלב הושלם',
    playAgain: 'שחק שוב',
    nextLevel: 'שלב הבא',
    paused: 'מושהה',
    resume: 'המשך',
    difficulty: 'בחר רמת קושי',
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
    startWith: 'התחל עם',
    soldiersSuffix: 'חיילים',
    tapToStart: '!החליקו שמאלה/ימינה כדי לזוז',
    finalScore: 'ניקוד סופי',
  },
  zh: {
    title: '军队跑酷3D',
    soldiers: '士兵',
    coins: '金币',
    score: '得分',
    highScore: '最高',
    level: '关卡',
    gameOver: '游戏结束！',
    youWin: '关卡完成！',
    playAgain: '再玩一次',
    nextLevel: '下一关',
    paused: '已暂停',
    resume: '继续',
    difficulty: '选择难度',
    easy: '简单',
    medium: '中等',
    hard: '困难',
    startWith: '初始',
    soldiersSuffix: '名士兵',
    tapToStart: '左右滑动移动！',
    finalScore: '最终得分',
  },
  es: {
    title: 'Carrera del Ejército 3D',
    soldiers: 'Soldados',
    coins: 'Monedas',
    score: 'Puntos',
    highScore: 'Récord',
    level: 'Nivel',
    gameOver: '¡Juego terminado!',
    youWin: '¡Nivel completado!',
    playAgain: 'Jugar de nuevo',
    nextLevel: 'Siguiente nivel',
    paused: 'Pausado',
    resume: 'Continuar',
    difficulty: 'Elige dificultad',
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
    startWith: 'Empieza con',
    soldiersSuffix: 'soldados',
    tapToStart: '¡Desliza izquierda/derecha para moverte!',
    finalScore: 'Puntuación final',
  },
};

const instructionsData: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      { icon: '🏃', title: 'Run Forward!', description: 'Your army runs forward automatically. Just steer left and right!' },
      { icon: '🚪', title: 'Choose Gates', description: 'Pass through math gates like +5 or ×2 to grow your army bigger.' },
      { icon: '⚠️', title: 'Dodge Obstacles', description: 'Avoid spinning bars, moving walls, and saw blades — they shrink your army!' },
      { icon: '⚔️', title: 'Battle Enemies', description: 'Crash into red enemy groups. The bigger army wins the fight!' },
    ],
    controls: [
      { icon: '👆', description: 'Swipe or drag left/right to move' },
      { icon: '⌨️', description: 'Arrow keys or A/D to steer' },
      { icon: '⏸️', description: 'P or Esc to pause' },
    ],
    tip: 'Multiply gates (×2, ×3) are more powerful than add gates when your army is big!',
  },
  he: {
    instructions: [
      { icon: '🏃', title: '!רוצו קדימה', description: 'הצבא רץ אוטומטית. פשוט כוונו שמאלה וימינה!' },
      { icon: '🚪', title: 'בחרו שערים', description: 'עברו דרך שערים מתמטיים כמו 5+ או 2× כדי להגדיל את הצבא.' },
      { icon: '⚠️', title: 'התחמקו ממכשולים', description: 'הימנעו ממוטות מסתובבים, קירות נעים ולהבי מסור — הם מקטינים את הצבא!' },
      { icon: '⚔️', title: 'הילחמו באויבים', description: 'התנגשו בקבוצות אויבים אדומות. הצבא הגדול יותר מנצח!' },
    ],
    controls: [
      { icon: '👆', description: 'החליקו או גררו שמאלה/ימינה' },
      { icon: '⌨️', description: 'מקשי חצים או A/D לכיוון' },
      { icon: '⏸️', description: 'P או Esc להשהיה' },
    ],
    tip: 'שערי כפל (2×, 3×) חזקים יותר משערי חיבור כשהצבא גדול!',
  },
  zh: {
    instructions: [
      { icon: '🏃', title: '向前跑！', description: '你的军队自动前进。只需左右控制方向！' },
      { icon: '🚪', title: '选择大门', description: '通过数学大门如+5或×2来壮大你的军队。' },
      { icon: '⚠️', title: '躲避障碍', description: '避开旋转杆、移动墙和锯片——它们会减少你的军队！' },
      { icon: '⚔️', title: '战斗敌人', description: '冲向红色敌军。人数多的一方获胜！' },
    ],
    controls: [
      { icon: '👆', description: '滑动或拖动左右移动' },
      { icon: '⌨️', description: '方向键或A/D控制方向' },
      { icon: '⏸️', description: 'P或Esc暂停' },
    ],
    tip: '当军队人数多时，乘法门（×2、×3）比加法门更强大！',
  },
  es: {
    instructions: [
      { icon: '🏃', title: '¡Corre!', description: 'Tu ejército avanza automáticamente. ¡Solo muévete a izquierda y derecha!' },
      { icon: '🚪', title: 'Elige puertas', description: 'Pasa por puertas matemáticas como +5 o ×2 para hacer crecer tu ejército.' },
      { icon: '⚠️', title: 'Esquiva obstáculos', description: '¡Evita barras giratorias, paredes móviles y sierras — reducen tu ejército!' },
      { icon: '⚔️', title: 'Lucha contra enemigos', description: '¡Choca contra grupos enemigos rojos. El ejército más grande gana!' },
    ],
    controls: [
      { icon: '👆', description: 'Desliza o arrastra izquierda/derecha' },
      { icon: '⌨️', description: 'Flechas o A/D para dirigir' },
      { icon: '⏸️', description: 'P o Esc para pausar' },
    ],
    tip: '¡Las puertas de multiplicar (×2, ×3) son más poderosas que las de sumar cuando tu ejército es grande!',
  },
};

// ─── Component ──────────────────────────────────────────────
interface ArmyRunnerGameProps {
  locale?: string;
}

export default function ArmyRunnerGame({ locale = 'en' }: ArmyRunnerGameProps) {
  const t = translations[locale] || translations.en;
  const instData = instructionsData[locale] || instructionsData.en;
  const sounds = useRetroSounds();
  const [showInstructions, setShowInstructions] = useState(true);
  const pointerRef = useRef<{ active: boolean }>({ active: false });
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <GameWrapper
      title={t.title}
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
              <h2 className="text-2xl font-bold text-gray-800">{t.difficulty}</h2>

              {highScore > 0 && (
                <p className="text-sm text-gray-500">
                  {t.highScore}: {highScore}
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
                      <div>{t[diff]}</div>
                      <div className="text-xs opacity-80">
                        {t.startWith} {settings.startSoldiers} {t.soldiersSuffix}
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
                  <h2 className="text-4xl font-bold text-white">{t.paused}</h2>
                  <button
                    onClick={() => { sounds.playClick(); resume(); }}
                    className="px-8 py-3 bg-green-500 text-white text-xl font-bold rounded-2xl
                      shadow-lg hover:bg-green-600 active:scale-95 transition-all min-h-[48px]"
                  >
                    {t.resume}
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
                  <h2 className="text-4xl font-bold text-red-400">{t.gameOver}</h2>
                  <p className="text-white text-xl">{t.finalScore}: {displayScore}</p>
                  {displayScore >= highScore && displayScore > 0 && (
                    <p className="text-yellow-300 text-lg font-bold">🏆 {t.highScore}!</p>
                  )}
                  <button
                    onClick={handlePlayAgain}
                    className="px-8 py-3 bg-blue-500 text-white text-xl font-bold rounded-2xl
                      shadow-lg hover:bg-blue-600 active:scale-95 transition-all min-h-[48px]"
                  >
                    {t.playAgain}
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
                  👈 {t.tapToStart} 👉
                </span>
              </motion.div>
            )}
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
