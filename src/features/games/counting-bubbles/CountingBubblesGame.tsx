'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { useRetroSounds } from '@/hooks/useRetroSounds';

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'menu' | 'playing' | 'checking' | 'correct' | 'wrong' | 'levelComplete' | 'won';

interface Bubble {
  id: number;
  emoji: string;
  x: number; // percentage position
  y: number;
  size: number; // scale multiplier
  color: string;
  popped: boolean;
  animDelay: number;
}

interface DifficultyConfig {
  totalLevels: number;
  roundsPerLevel: number;
  maxTarget: number;
  totalBubbles: number;
  scoreMultiplier: number;
  hasBonusRound: boolean;
}

// ────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { totalLevels: 3, roundsPerLevel: 4, maxTarget: 3, totalBubbles: 5, scoreMultiplier: 1, hasBonusRound: false },
  medium: { totalLevels: 4, roundsPerLevel: 5, maxTarget: 5, totalBubbles: 8, scoreMultiplier: 2, hasBonusRound: false },
  hard: { totalLevels: 5, roundsPerLevel: 5, maxTarget: 8, totalBubbles: 12, scoreMultiplier: 3, hasBonusRound: true },
};

const DIFFICULTY_EMOJI: Record<Difficulty, string> = { easy: '🟢', medium: '🟡', hard: '🔴' };

const BUBBLE_COLORS = [
  'bg-pink-300', 'bg-blue-300', 'bg-green-300', 'bg-purple-300',
  'bg-yellow-300', 'bg-red-300', 'bg-cyan-300', 'bg-orange-300',
];

const BUBBLE_EMOJIS = [
  '🫧', '🔵', '🟣', '🟢', '🟡', '🔴', '🩷', '🩵',
  '⭐', '🌟', '💎', '🎈', '🎀', '🍬', '🦋', '🌸',
];

// ────────────────────────────────────────────────────────────────────
// Translations
// ────────────────────────────────────────────────────────────────────

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: { title: 'Counting Bubbles', popCount: 'Pop exactly', bubbles: 'bubbles!', bubble: 'bubble!', selectDifficulty: 'Choose your level', easy: 'Easy', medium: 'Medium', hard: 'Hard', easyDesc: 'Count 1–3, 5 bubbles', mediumDesc: 'Count 1–5, 8 bubbles', hardDesc: 'Count 1–8, 12 bubbles', score: 'Score', level: 'Level', round: 'Round', done: 'Done! ✓', correct: 'Perfect! 🎉', wrong: 'Oops! You popped {n}!', tooMany: 'Too many!', tooFew: 'Not enough!', tryAgain: 'Try again!', levelComplete: 'Level Complete! ⭐', streak: 'streak', popped: 'Popped', reset: 'Reset ↺', playAgain: 'Play Again' },
  he: { title: 'ספירת בועות', popCount: 'פוצצו בדיוק', bubbles: 'בועות!', bubble: 'בועה!', selectDifficulty: 'בחרו רמת קושי', easy: 'קל', medium: 'בינוני', hard: 'קשה', easyDesc: 'ספרו 1–3, 5 בועות', mediumDesc: 'ספרו 1–5, 8 בועות', hardDesc: 'ספרו 1–8, 12 בועות', score: 'ניקוד', level: 'שלב', round: 'סיבוב', done: '!סיימתי ✓', correct: '!מושלם 🎉', wrong: '!אופס! פוצצתם {n}', tooMany: '!יותר מדי', tooFew: '!לא מספיק', tryAgain: '!נסו שוב', levelComplete: '!שלב הושלם ⭐', streak: 'רצף', popped: 'פוצצו', reset: 'איפוס ↺', playAgain: 'שחקו שוב' },
  zh: { title: '数泡泡', popCount: '恰好戳破', bubbles: '个泡泡！', bubble: '个泡泡！', selectDifficulty: '选择难度', easy: '简单', medium: '中等', hard: '困难', easyDesc: '数1-3，5个泡泡', mediumDesc: '数1-5，8个泡泡', hardDesc: '数1-8，12个泡泡', score: '分数', level: '关卡', round: '回合', done: '完成！✓', correct: '完美！🎉', wrong: '哎呀！你戳了{n}个！', tooMany: '太多了！', tooFew: '不够！', tryAgain: '再试一次！', levelComplete: '关卡完成！⭐', streak: '连击', popped: '已戳破', reset: '重置 ↺', playAgain: '再玩一次' },
  es: { title: 'Contar Burbujas', popCount: 'Revienta exactamente', bubbles: '¡burbujas!', bubble: '¡burbuja!', selectDifficulty: 'Elige tu nivel', easy: 'Fácil', medium: 'Medio', hard: 'Difícil', easyDesc: 'Cuenta 1–3, 5 burbujas', mediumDesc: 'Cuenta 1–5, 8 burbujas', hardDesc: 'Cuenta 1–8, 12 burbujas', score: 'Puntos', level: 'Nivel', round: 'Ronda', done: '¡Listo! ✓', correct: '¡Perfecto! 🎉', wrong: '¡Ups! ¡Reventaste {n}!', tooMany: '¡Demasiadas!', tooFew: '¡No suficientes!', tryAgain: '¡Inténtalo de nuevo!', levelComplete: '¡Nivel completo! ⭐', streak: 'racha', popped: 'Reventadas', reset: 'Reiniciar ↺', playAgain: 'Jugar de nuevo' },
};

const NUMBER_WORDS: Record<string, string[]> = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'],
  he: ['אפס', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה'],
  zh: ['零', '一', '二', '三', '四', '五', '六', '七', '八'],
  es: ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho'],
};

const INSTRUCTIONS_DATA: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      { icon: '🫧', title: 'Goal', description: 'Bubbles are floating around! You need to pop exactly the right number — no more, no less!' },
      { icon: '🔢', title: 'Count First', description: 'The screen shows a number like "Pop 3 bubbles!" Count carefully in your head: 1... 2... 3... then stop!' },
      { icon: '👆', title: 'Pop & Check', description: 'Tap bubbles to pop them, then press the Done button. If you got the right number — you win points!' },
    ],
    controls: [
      { icon: '👆', description: 'Tap or click bubbles to pop them' },
      { icon: '✓', description: 'Press Done when you\'ve popped the right number' },
      { icon: '↺', description: 'Press Reset to un-pop all bubbles and try again' },
      { icon: '⌨️', description: 'Space to check, R to reset' },
    ],
    tip: 'Count out loud as you pop each bubble — it helps you keep track! "One... two... three... done!"',
  },
  he: {
    instructions: [
      { icon: '🫧', title: 'מטרה', description: 'בועות מרחפות! צריכים לפוצץ בדיוק את המספר הנכון — לא יותר, לא פחות!' },
      { icon: '🔢', title: 'ספרו קודם', description: 'המסך מראה מספר כמו "פוצצו 3 בועות!" ספרו בראש: 1... 2... 3... ואז עצרו!' },
      { icon: '👆', title: 'פוצצו ובדקו', description: 'הקישו על בועות כדי לפוצץ, ואז לחצו סיימתי. אם פוצצתם נכון — תרוויחו נקודות!' },
    ],
    controls: [
      { icon: '👆', description: 'הקישו על בועות כדי לפוצץ אותן' },
      { icon: '✓', description: 'לחצו סיימתי כשפוצצתם את המספר הנכון' },
      { icon: '↺', description: 'לחצו איפוס כדי להתחיל מחדש' },
      { icon: '⌨️', description: 'רווח לבדיקה, R לאיפוס' },
    ],
    tip: 'ספרו בקול רם כשאתם מפוצצים כל בועה — זה עוזר לעקוב! "אחת... שתיים... שלוש... סיימתי!"',
  },
  zh: {
    instructions: [
      { icon: '🫧', title: '目标', description: '泡泡在飘！你需要恰好戳破正确的数量——不多也不少！' },
      { icon: '🔢', title: '先数数', description: '屏幕会显示"戳破3个泡泡！"在心里数：1...2...3...然后停下！' },
      { icon: '👆', title: '戳破并检查', description: '点击泡泡来戳破，然后按完成按钮。如果数对了——你就赢得分数！' },
    ],
    controls: [
      { icon: '👆', description: '点击泡泡来戳破它们' },
      { icon: '✓', description: '戳破正确数量后按完成' },
      { icon: '↺', description: '按重置可以恢复所有泡泡' },
      { icon: '⌨️', description: '空格检查，R重置' },
    ],
    tip: '每戳破一个泡泡就大声数出来——这样可以帮你记住！"一...二...三...完成！"',
  },
  es: {
    instructions: [
      { icon: '🫧', title: 'Objetivo', description: '¡Las burbujas están flotando! ¡Debes reventar el número exacto — ni más, ni menos!' },
      { icon: '🔢', title: 'Cuenta primero', description: 'La pantalla muestra "¡Revienta 3 burbujas!" Cuenta en tu cabeza: 1... 2... 3... ¡y para!' },
      { icon: '👆', title: 'Revienta y comprueba', description: 'Toca las burbujas, luego presiona Listo. ¡Si acertaste el número, ganas puntos!' },
    ],
    controls: [
      { icon: '👆', description: 'Toca las burbujas para reventarlas' },
      { icon: '✓', description: 'Presiona Listo cuando hayas reventado el número correcto' },
      { icon: '↺', description: 'Presiona Reiniciar para restaurar las burbujas' },
      { icon: '⌨️', description: 'Espacio para comprobar, R para reiniciar' },
    ],
    tip: '¡Cuenta en voz alta mientras revientas cada burbuja! "Uno... dos... tres... ¡listo!"',
  },
};

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function generateBubbles(count: number): Bubble[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: BUBBLE_EMOJIS[Math.floor(Math.random() * BUBBLE_EMOJIS.length)],
    x: 10 + Math.random() * 75, // Keep within bounds (10%-85%)
    y: 10 + Math.random() * 70,
    size: 0.8 + Math.random() * 0.5,
    color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
    popped: false,
    animDelay: Math.random() * 2,
  }));
}

// ────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────

export function CountingBubblesGame() {
  const locale = useLocale();
  const t = UI_STRINGS[locale] || UI_STRINGS.en;
  const numWords = NUMBER_WORDS[locale] || NUMBER_WORDS.en;
  const isRtl = locale === 'he';

  const { playClick, playSuccess, playLevelUp, playHit, playWin, playMatch, playBeep } = useRetroSounds();

  // State
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('counting-bubbles-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [targetCount, setTargetCount] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showWin, setShowWin] = useState(false);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = DIFFICULTY_CONFIG[difficulty];
  const instrData = INSTRUCTIONS_DATA[locale] || INSTRUCTIONS_DATA.en;

  const poppedCount = bubbles.filter((b) => b.popped).length;

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  const startNewRound = useCallback((diff: Difficulty) => {
    const cfg = DIFFICULTY_CONFIG[diff];
    const target = 1 + Math.floor(Math.random() * cfg.maxTarget);
    setTargetCount(target);
    setBubbles(generateBubbles(cfg.totalBubbles));
    setPhase('playing');
  }, []);

  const advanceRound = useCallback(() => {
    const newRound = round + 1;
    if (newRound > config.roundsPerLevel) {
      const newLevel = level + 1;
      if (newLevel > config.totalLevels) {
        playWin();
        setShowWin(true);
        setPhase('won');
      } else {
        playLevelUp();
        setLevel(newLevel);
        setRound(1);
        setPhase('levelComplete');
        feedbackTimeoutRef.current = setTimeout(() => startNewRound(difficulty), 1500);
      }
    } else {
      setRound(newRound);
      startNewRound(difficulty);
    }
  }, [round, level, config, difficulty, startNewRound, playLevelUp, playWin]);

  const startGame = useCallback((diff: Difficulty) => {
    playClick();
    setDifficulty(diff);
    setLevel(1);
    setRound(1);
    setScore(0);
    setStreak(0);
    setShowWin(false);
    startNewRound(diff);
  }, [playClick, startNewRound]);

  // Pop a bubble
  const handleBubbleTap = useCallback((id: number) => {
    if (phase !== 'playing') return;
    setBubbles((prev) => {
      const bubble = prev.find((b) => b.id === id);
      if (!bubble || bubble.popped) return prev;
      playBeep(600 + Math.random() * 400, 0.08);
      return prev.map((b) => b.id === id ? { ...b, popped: true } : b);
    });
  }, [phase, playBeep]);

  // Un-pop a bubble (tap again)
  const handleBubbleUnpop = useCallback((id: number) => {
    if (phase !== 'playing') return;
    setBubbles((prev) => prev.map((b) => b.id === id ? { ...b, popped: false } : b));
    playClick();
  }, [phase, playClick]);

  // Reset all bubbles
  const handleReset = useCallback(() => {
    if (phase !== 'playing') return;
    playClick();
    setBubbles((prev) => prev.map((b) => ({ ...b, popped: false })));
  }, [phase, playClick]);

  // Check answer
  const handleCheck = useCallback(() => {
    if (phase !== 'playing') return;
    playClick();
    setPhase('checking');

    if (poppedCount === targetCount) {
      playMatch();
      const points = (10 + streak * 3) * config.scoreMultiplier;
      const newScore = score + points;
      setScore(newScore);
      setStreak((s) => s + 1);

      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('counting-bubbles-highscore', String(newScore));
      }

      setPhase('correct');
      feedbackTimeoutRef.current = setTimeout(() => advanceRound(), 1500);
    } else {
      playHit();
      setStreak(0);
      setPhase('wrong');
      feedbackTimeoutRef.current = setTimeout(() => {
        setBubbles((prev) => prev.map((b) => ({ ...b, popped: false })));
        setPhase('playing');
      }, 2000);
    }
  }, [phase, poppedCount, targetCount, score, streak, config, highScore, advanceRound, playClick, playMatch, playHit]);

  // Keyboard support
  useEffect(() => {
    if (phase !== 'playing') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleCheck();
      } else if (e.key.toLowerCase() === 'r') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, handleCheck, handleReset]);

  const handlePlayAgain = useCallback(() => {
    playClick();
    setPhase('menu');
    setShowWin(false);
  }, [playClick]);

  // ────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────

  return (
    <GameWrapper title={t.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`container mx-auto px-4 py-6 max-w-3xl ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>

        {/* Difficulty Menu */}
        {phase === 'menu' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-white drop-shadow-md">{t.selectDifficulty}</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                <motion.button
                  key={diff}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startGame(diff)}
                  className="px-8 py-4 rounded-2xl text-xl font-bold text-white shadow-lg min-h-[48px] min-w-[48px]
                    bg-gradient-to-b from-white/30 to-white/10 border-2 border-white/40 hover:border-white/60 transition-all"
                >
                  <span className="text-2xl">{DIFFICULTY_EMOJI[diff]}</span>
                  <div>{t[diff]}</div>
                  <div className="text-sm opacity-80">{t[`${diff}Desc` as keyof typeof t]}</div>
                </motion.button>
              ))}
            </div>
            {highScore > 0 && (
              <p className="text-white/80 text-lg">🏆 {t.score}: {highScore}</p>
            )}
          </motion.div>
        )}

        {/* Playing / Checking / Correct / Wrong */}
        {(phase === 'playing' || phase === 'checking' || phase === 'correct' || phase === 'wrong') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Header stats */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <LevelDisplay level={level} />
              <div className="flex gap-4 text-white font-bold text-lg">
                <span>⭐ {score}</span>
                {streak > 1 && <span className="text-yellow-200">🔥 {streak} {t.streak}</span>}
                <span>{t.round} {round}/{config.roundsPerLevel}</span>
              </div>
            </div>

            {/* Target prompt */}
            <motion.div
              key={`target-${round}-${level}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-3"
            >
              <p className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                {t.popCount}{' '}
                <span className="text-4xl sm:text-5xl text-yellow-200 drop-shadow-md">
                  {targetCount}
                </span>
                {' '}{targetCount === 1 ? t.bubble : t.bubbles}
              </p>
              <p className="text-lg text-white/70 mt-1">
                ({numWords[targetCount] || targetCount})
              </p>
            </motion.div>

            {/* Counter */}
            <div className="text-center">
              <span className={`text-xl font-bold px-4 py-1 rounded-full ${
                poppedCount === targetCount ? 'bg-green-400/80 text-white' :
                poppedCount > targetCount ? 'bg-red-400/80 text-white' :
                'bg-white/30 text-white'
              }`}>
                {t.popped}: {poppedCount} / {targetCount}
              </span>
            </div>

            {/* Bubble field */}
            <div className="relative bg-gradient-to-b from-blue-200/30 to-purple-200/30 rounded-3xl border-2 border-white/20 overflow-hidden"
              style={{ height: '340px' }}
            >
              {bubbles.map((bubble) => (
                <motion.button
                  key={bubble.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: bubble.popped ? 0.4 : 1,
                    scale: bubble.popped ? 0.5 : bubble.size,
                    y: bubble.popped ? 0 : [0, -8, 0, 6, 0],
                  }}
                  transition={{
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 },
                    y: { repeat: Infinity, duration: 2 + bubble.animDelay, ease: 'easeInOut' },
                  }}
                  whileHover={!bubble.popped ? { scale: bubble.size * 1.15 } : {}}
                  whileTap={!bubble.popped ? { scale: bubble.size * 0.85 } : {}}
                  onClick={() => bubble.popped ? handleBubbleUnpop(bubble.id) : handleBubbleTap(bubble.id)}
                  disabled={phase !== 'playing'}
                  className={`
                    absolute flex items-center justify-center rounded-full
                    min-h-[48px] min-w-[48px] transition-colors cursor-pointer
                    ${bubble.popped
                      ? 'bg-slate-400/30 ring-2 ring-slate-400/40'
                      : `${bubble.color} ring-2 ring-white/60 shadow-lg hover:shadow-xl`
                    }
                  `}
                  style={{
                    left: `${bubble.x}%`,
                    top: `${bubble.y}%`,
                    width: `${50 * bubble.size}px`,
                    height: `${50 * bubble.size}px`,
                  }}
                  aria-label={`Bubble ${bubble.id + 1}${bubble.popped ? ' (popped)' : ''}`}
                >
                  <span className={`text-2xl ${bubble.popped ? 'opacity-30' : ''}`}>
                    {bubble.popped ? '💨' : bubble.emoji}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                disabled={phase !== 'playing'}
                className="px-6 py-3 rounded-2xl font-bold text-white bg-white/20 border-2 border-white/30 min-h-[48px] min-w-[48px] hover:bg-white/30 disabled:opacity-50 transition-all"
              >
                {t.reset}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCheck}
                disabled={phase !== 'playing' || poppedCount === 0}
                className={`px-8 py-3 rounded-2xl font-bold text-white min-h-[48px] min-w-[48px] border-2 transition-all
                  ${poppedCount === targetCount
                    ? 'bg-green-500/80 border-green-400 hover:bg-green-500 shadow-lg shadow-green-500/30'
                    : 'bg-white/20 border-white/30 hover:bg-white/30'}
                  disabled:opacity-50
                `}
              >
                {t.done}
              </motion.button>
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {phase === 'correct' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-2"
                >
                  <p className="text-3xl font-bold text-white drop-shadow-lg">{t.correct}</p>
                </motion.div>
              )}
              {phase === 'wrong' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-2"
                >
                  <p className="text-2xl font-bold text-white drop-shadow-lg">
                    {t.wrong.replace('{n}', String(poppedCount))}
                  </p>
                  <p className="text-lg text-white/80">
                    {poppedCount > targetCount ? t.tooMany : t.tooFew} {t.tryAgain}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Level Complete */}
        {phase === 'levelComplete' && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-12">
            <p className="text-5xl">⭐</p>
            <p className="text-3xl font-bold text-white drop-shadow-lg">{t.levelComplete}</p>
            <p className="text-xl text-white/80">{t.score}: {score}</p>
          </motion.div>
        )}
      </div>

      {/* Win Modal */}
      <WinModal isOpen={showWin} onPlayAgain={handlePlayAgain} score={score} />

      {/* Instructions Modal */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={t.title}
        instructions={instrData.instructions}
        controls={instrData.controls}
        tip={instrData.tip}
        locale={locale}
      />
    </GameWrapper>
  );
}
