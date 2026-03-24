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
import { PingPongScene } from './PingPongScene';
import { usePingPongGame, Difficulty, DIFFICULTY_SETTINGS } from './usePingPongGame';

// ─── 4-locale translations ──────────────────────────────────
const translations: Record<string, Record<string, string>> = {
  en: {
    title: 'Ping Pong 3D',
    score: 'Score',
    highScore: 'Best',
    gameOver: 'Game Over!',
    youWin: 'You Win!',
    playAgain: 'Play Again',
    paused: 'Paused',
    resume: 'Resume',
    difficulty: 'Choose Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    firstTo: 'First to',
    points: 'points',
    tapToStart: 'Click or Tap to Start',
    mouseMove: 'Mouse = Move Paddle',
    arrowMove: '←/→ or A/D = Move',
    escPause: 'P / Esc = Pause',
    touchMove: 'Touch & Drag = Move',
  },
  he: {
    title: 'פינג פונג 3D',
    score: 'ניקוד',
    highScore: 'שיא',
    gameOver: '!המשחק נגמר',
    youWin: '!ניצחת',
    playAgain: 'שחק שוב',
    paused: 'מושהה',
    resume: 'המשך',
    difficulty: 'בחר רמת קושי',
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
    firstTo: 'ראשון ל',
    points: 'נקודות',
    tapToStart: 'לחצו כדי להתחיל',
    mouseMove: 'עכבר = הזז מחבט',
    arrowMove: '←/→ או A/D = הזז',
    escPause: 'P / Esc = השהה',
    touchMove: 'גרירה = הזז',
  },
  zh: {
    title: '3D乒乓球',
    score: '得分',
    highScore: '最高',
    gameOver: '游戏结束！',
    youWin: '你赢了！',
    playAgain: '再玩一次',
    paused: '已暂停',
    resume: '继续',
    difficulty: '选择难度',
    easy: '简单',
    medium: '中等',
    hard: '困难',
    firstTo: '先到',
    points: '分',
    tapToStart: '点击开始',
    mouseMove: '鼠标 = 移动球拍',
    arrowMove: '←/→ 或 A/D = 移动',
    escPause: 'P / Esc = 暂停',
    touchMove: '触摸拖动 = 移动',
  },
  es: {
    title: 'Ping Pong 3D',
    score: 'Puntos',
    highScore: 'Récord',
    gameOver: '¡Fin del Juego!',
    youWin: '¡Ganaste!',
    playAgain: 'Jugar de Nuevo',
    paused: 'Pausado',
    resume: 'Continuar',
    difficulty: 'Elige Dificultad',
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
    firstTo: 'Primero a',
    points: 'puntos',
    tapToStart: 'Clic para empezar',
    mouseMove: 'Ratón = Mover paleta',
    arrowMove: '←/→ o A/D = Mover',
    escPause: 'P / Esc = Pausa',
    touchMove: 'Toque y arrastre = Mover',
  },
};

// ─── Instructions data ───────────────────────────────────────
function getInstructions(locale: string) {
  const t = translations[locale] || translations.en;
  return {
    instructions: [
      { icon: '🏓', title: locale === 'he' ? 'הזיזו את המחבט' : locale === 'zh' ? '移动你的球拍' : locale === 'es' ? 'Mueve tu paleta' : 'Move Your Paddle', description: locale === 'he' ? 'הזיזו את העכבר או גררו כדי לשלוט במחבט שלכם בתחתית השולחן' : locale === 'zh' ? '移动鼠标或拖动来控制你底部的球拍' : locale === 'es' ? 'Mueve el ratón o arrastra para controlar tu paleta' : 'Move your mouse or drag to control your paddle at the bottom of the table' },
      { icon: '🎯', title: locale === 'he' ? 'כוונו ליריב' : locale === 'zh' ? '瞄准对手' : locale === 'es' ? 'Apunta al oponente' : 'Aim at Opponent', description: locale === 'he' ? 'הכדור ינתז בזווית שונה לפי איפה שפגע במחבט' : locale === 'zh' ? '球会根据击中球拍的位置以不同角度反弹' : locale === 'es' ? 'La pelota rebotará en diferente ángulo según dónde golpee' : 'The ball bounces at different angles based on where it hits the paddle' },
      { icon: '⭐', title: locale === 'he' ? 'הבקיעו נקודות' : locale === 'zh' ? '得分' : locale === 'es' ? 'Anota puntos' : 'Score Points', description: locale === 'he' ? `הגיעו ראשונים למספר הנקודות הנדרש כדי לנצח!` : locale === 'zh' ? '先达到所需分数即可获胜！' : locale === 'es' ? '¡Llega primero a la puntuación requerida para ganar!' : 'Be the first to reach the required score to win!' },
      { icon: '🚀', title: locale === 'he' ? 'הכדור מאיץ' : locale === 'zh' ? '球会加速' : locale === 'es' ? 'La pelota acelera' : 'Ball Speeds Up', description: locale === 'he' ? 'ככל שהראלי ארוך יותר, הכדור מאיץ!' : locale === 'zh' ? '回合越长，球越快！' : locale === 'es' ? '¡Cuanto más largo el rally, más rápida la pelota!' : 'The longer the rally, the faster the ball gets!' },
    ],
    controls: [
      { icon: '🖱️', description: t.mouseMove },
      { icon: '⌨️', description: t.arrowMove },
      { icon: '⏸️', description: t.escPause },
      { icon: '👆', description: t.touchMove },
    ],
    tip: locale === 'he' ? 'נסו לפגוע בכדור עם קצה המחבט כדי ליצור זוויות חדות!' : locale === 'zh' ? '尝试用球拍边缘击球来创造锐角！' : locale === 'es' ? '¡Intenta golpear la pelota con el borde para crear ángulos agudos!' : 'Try hitting the ball with the edge of the paddle to create sharp angles!',
  };
}

// ─── Props ───────────────────────────────────────────────────
interface PingPongGameProps {
  locale?: string;
}

type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover';

// ─── High score helpers ──────────────────────────────────────
const HS_KEY = 'ping-pong-highscore';
function loadHighScore(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(HS_KEY) || '0', 10);
}
function saveHighScore(wins: number) {
  if (typeof window === 'undefined') return;
  const prev = loadHighScore();
  if (wins > prev) localStorage.setItem(HS_KEY, String(wins));
}

// ─── Component ───────────────────────────────────────────────
export default function PingPongGame({ locale = 'en' }: PingPongGameProps) {
  const t = translations[locale] || translations.en;
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const instData = getInstructions(locale);

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [wins, setWins] = useState(loadHighScore);
  const [showInstructions, setShowInstructions] = useState(false);
  const [level, setLevel] = useState(1);

  const { playHit, playSuccess, playGameOver, playWin, playClick } = useRetroSounds();

  const {
    gameState: gameStateRef,
    settings,
    resetGame,
    update,
    isGameOver,
    getWinner,
  } = usePingPongGame(difficulty);

  const playerTargetX = useRef(0);

  // ── Start game ──
  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setPhase('playing');
    setPlayerScore(0);
    setAiScore(0);
    setLevel(1);
    playClick();
    // Reset will happen via the effect
  }, [playClick]);

  useEffect(() => {
    if (phase === 'playing') {
      resetGame();
    }
  }, [phase, difficulty, resetGame]);

  // ── Pause / Resume ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (phase === 'playing') setPhase('paused');
        else if (phase === 'paused') setPhase('playing');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase]);

  // ── Frame update ──
  const onFrame = useCallback((delta: number) => {
    const clampedDelta = Math.min(delta, 0.05);
    const state = update(
      clampedDelta,
      playerTargetX.current,
      () => {
        setPlayerScore((s) => s + 1);
        playSuccess();
      },
      () => {
        setAiScore((s) => s + 1);
      },
      () => {
        playHit();
      },
    );

    // Check game over
    if (isGameOver()) {
      const winner = getWinner();
      if (winner === 'player') {
        const newWins = wins + 1;
        setWins(newWins);
        saveHighScore(newWins);
        playWin();
      } else {
        playGameOver();
      }
      setPhase('gameover');
    }
  }, [update, isGameOver, getWinner, wins, playSuccess, playHit, playWin, playGameOver]);

  const onPlayerMove = useCallback((x: number) => {
    playerTargetX.current = x;
  }, []);

  const handlePlayAgain = useCallback(() => {
    setPhase('menu');
  }, []);

  // ── Difficulty options ──
  const difficultyOptions: { key: Difficulty; emoji: string; color: string }[] = [
    { key: 'easy', emoji: '🟢', color: 'from-green-400 to-green-500' },
    { key: 'medium', emoji: '🟡', color: 'from-yellow-400 to-orange-400' },
    { key: 'hard', emoji: '🔴', color: 'from-red-400 to-red-600' },
  ];

  const winner = getWinner();

  return (
    <GameWrapper
      title={t.title}
      showBackButton
      onInstructionsClick={() => setShowInstructions(true)}
    >
      <div className={`relative`} dir={direction}>
        {/* ── MENU SCREEN ── */}
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
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-7xl"
              >
                🏓
              </motion.div>

              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                {t.title}
              </h2>

              <p className="text-lg text-slate-500">{t.difficulty}</p>

              <div className="flex gap-4 flex-wrap justify-center">
                {difficultyOptions.map(({ key, emoji, color }) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startGame(key)}
                    className={`px-6 py-4 rounded-2xl bg-gradient-to-br ${color} text-white font-bold text-lg shadow-lg flex flex-col items-center gap-1 min-w-[120px]`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span>{t[key]}</span>
                    <span className="text-xs opacity-80">
                      {t.firstTo} {DIFFICULTY_SETTINGS[key].winScore} {t.points}
                    </span>
                  </motion.button>
                ))}
              </div>

              {wins > 0 && (
                <p className="text-sm text-slate-400">
                  🏆 {t.highScore}: {wins} {locale === 'en' ? 'wins' : locale === 'he' ? 'ניצחונות' : locale === 'zh' ? '次胜利' : 'victorias'}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── GAME SCREEN ── */}
        {(phase === 'playing' || phase === 'paused') && (
          <div className="relative">
            {/* HUD */}
            <div className="flex justify-between items-center px-4 py-2 mb-2">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-cyan-500">🏓 {playerScore}</span>
                <span className="text-slate-400">vs</span>
                <span className="text-lg font-bold text-red-400">🤖 {aiScore}</span>
              </div>
              <LevelDisplay level={level} />
            </div>

            {/* 3D Canvas */}
            <R3FGameContainer
              camera={{ position: [0, 7, 9], fov: 45 }}
              className="rounded-xl overflow-hidden shadow-2xl"
            >
              <PingPongScene
                gameStateRef={gameStateRef}
                paddleWidth={settings.paddleWidth}
                paused={phase === 'paused'}
                gameActive={phase === 'playing'}
                onPlayerMove={onPlayerMove}
                onFrame={onFrame}
                playerScoreDisplay={playerScore}
                aiScoreDisplay={aiScore}
                locale={locale}
              />
            </R3FGameContainer>

            {/* Mobile touch controls */}
            <div className="flex justify-center gap-4 mt-3 md:hidden">
              <button
                className="px-8 py-3 bg-gradient-to-br from-cyan-400 to-blue-500 text-white rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition-transform select-none"
                onTouchStart={() => {
                  const interval = setInterval(() => {
                    playerTargetX.current -= 0.3;
                    onPlayerMove(playerTargetX.current);
                  }, 16);
                  const stop = () => clearInterval(interval);
                  window.addEventListener('touchend', stop, { once: true });
                }}
              >
                ←
              </button>
              <button
                className="px-8 py-3 bg-gradient-to-br from-cyan-400 to-blue-500 text-white rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition-transform select-none"
                onTouchStart={() => {
                  const interval = setInterval(() => {
                    playerTargetX.current += 0.3;
                    onPlayerMove(playerTargetX.current);
                  }, 16);
                  const stop = () => clearInterval(interval);
                  window.addEventListener('touchend', stop, { once: true });
                }}
              >
                →
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
                      onClick={() => setPhase('playing')}
                      className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-purple-500 text-white rounded-full font-bold text-lg"
                    >
                      {t.resume}
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── WIN / GAME OVER ── */}
        <WinModal
          isOpen={phase === 'gameover'}
          onPlayAgain={handlePlayAgain}
          score={playerScore}
        />

        {/* ── INSTRUCTIONS MODAL ── */}
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
