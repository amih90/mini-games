'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { TextDirection } from '@/i18n/routing';

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'menu' | 'playing' | 'levelComplete' | 'won';

interface Bubble {
  id: number;
  value: number;
  x: number;
  y: number;
}

interface DifficultyConfig {
  totalLevels: number;
  challengesPerLevel: number;
  maxTarget: number;
  bubbleCount: number;
  maxBubbleValue: number;
  scoreMultiplier: number;
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    totalLevels: 3,
    challengesPerLevel: 6,
    maxTarget: 10,
    bubbleCount: 6,
    maxBubbleValue: 9,
    scoreMultiplier: 1,
  },
  medium: {
    totalLevels: 4,
    challengesPerLevel: 7,
    maxTarget: 20,
    bubbleCount: 8,
    maxBubbleValue: 12,
    scoreMultiplier: 1.5,
  },
  hard: {
    totalLevels: 5,
    challengesPerLevel: 8,
    maxTarget: 30,
    bubbleCount: 10,
    maxBubbleValue: 15,
    scoreMultiplier: 2,
  },
};

const BUBBLE_COLORS = [
  'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400',
  'bg-purple-400', 'bg-pink-400', 'bg-teal-400', 'bg-orange-400',
  'bg-indigo-400', 'bg-emerald-400',
];

function generateChallenge(config: DifficultyConfig) {
  // Pick target
  const target = Math.floor(Math.random() * (config.maxTarget - 3)) + 3;

  // Generate bubbles ensuring at least one valid pair/set sums to target
  const bubbles: Bubble[] = [];
  // Guaranteed pair
  const a = Math.floor(Math.random() * (target - 1)) + 1;
  const b = target - a;

  for (let i = 0; i < config.bubbleCount; i++) {
    let value: number;
    if (i === 0) value = a;
    else if (i === 1) value = b;
    else value = Math.floor(Math.random() * config.maxBubbleValue) + 1;

    bubbles.push({
      id: i,
      value,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 70,
    });
  }

  return { target, bubbles };
}

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    title: 'Number Muncher',
    description: 'Tap number bubbles that add up to the target!',
    easy: '😊 Easy', medium: '🤔 Medium', hard: '🔥 Hard',
    makeNumber: 'Make this number:',
    yourSum: 'Your sum:',
    clearSelection: '🗑️ Clear Selection',
    levelComplete: 'Level {n} Complete!',
    score: 'Score', nextLevel: 'Next Level →',
  },
  he: {
    title: 'אוכל המספרים',
    description: 'הקישו על בועות מספרים שמסתכמות ביעד!',
    easy: '😊 קל', medium: '🤔 בינוני', hard: '🔥 קשה',
    makeNumber: 'הגיעו למספר הזה:',
    yourSum: 'הסכום שלך:',
    clearSelection: '🗑️ נקה בחירה',
    levelComplete: 'שלב {n} הושלם!',
    score: 'ניקוד', nextLevel: 'שלב הבא →',
  },
  zh: {
    title: '数字大嘴',
    description: '点击数字泡泡，使它们加起来等于目标！',
    easy: '😊 简单', medium: '🤔 中等', hard: '🔥 困难',
    makeNumber: '凑出这个数字：',
    yourSum: '你的总和：',
    clearSelection: '🗑️ 清除选择',
    levelComplete: '第{n}关完成！',
    score: '分数', nextLevel: '下一关 →',
  },
  es: {
    title: 'Traga Números',
    description: '¡Toca burbujas de números que sumen el objetivo!',
    easy: '😊 Fácil', medium: '🤔 Medio', hard: '🔥 Difícil',
    makeNumber: 'Forma este número:',
    yourSum: 'Tu suma:',
    clearSelection: '🗑️ Limpiar Selección',
    levelComplete: '¡Nivel {n} Completado!',
    score: 'Puntos', nextLevel: 'Siguiente Nivel →',
  },
};

const INSTRUCTIONS_DATA: Record<string, { instructions: { icon: string; title: string; description: string }[]; controls: { icon: string; description: string }[]; tip: string }> = {
  en: {
    instructions: [
      { icon: '🎯', title: 'See the Target', description: 'A target number appears at the top of the screen.' },
      { icon: '💧', title: 'Tap Bubbles', description: 'Tap number bubbles that add up to the target!' },
      { icon: '✅', title: 'Auto-Check', description: 'When your sum matches, it checks automatically!' },
    ],
    controls: [
      { icon: '👆', description: 'Tap a bubble to select it' },
      { icon: '👆', description: 'Tap again to deselect it' },
    ],
    tip: 'Start with the biggest number and look for a small one to complete the sum!',
  },
  he: {
    instructions: [
      { icon: '🎯', title: 'ראו את היעד', description: 'מספר יעד מופיע בראש המסך.' },
      { icon: '💧', title: 'הקישו על בועות', description: 'הקישו על בועות מספרים שמסתכמות ביעד!' },
      { icon: '✅', title: 'בדיקה אוטומטית', description: 'כשהסכום מתאים, הבדיקה מתבצעת אוטומטית!' },
    ],
    controls: [
      { icon: '👆', description: 'הקישו על בועה לבחירה' },
      { icon: '👆', description: 'הקישו שוב לביטול בחירה' },
    ],
    tip: 'התחילו מהמספר הגדול וחפשו מספר קטן להשלמת הסכום!',
  },
  zh: {
    instructions: [
      { icon: '🎯', title: '查看目标', description: '目标数字出现在屏幕顶部。' },
      { icon: '💧', title: '点击泡泡', description: '点击数字泡泡使它们的和等于目标！' },
      { icon: '✅', title: '自动检查', description: '当总和匹配时，会自动检查！' },
    ],
    controls: [
      { icon: '👆', description: '点击泡泡选择它' },
      { icon: '👆', description: '再次点击取消选择' },
    ],
    tip: '从最大的数字开始，寻找小数字来凑成总和！',
  },
  es: {
    instructions: [
      { icon: '🎯', title: 'Ve el Objetivo', description: 'Un número objetivo aparece en la parte superior.' },
      { icon: '💧', title: 'Toca Burbujas', description: '¡Toca burbujas de números que sumen el objetivo!' },
      { icon: '✅', title: 'Auto-Verificación', description: '¡Cuando tu suma coincide, se verifica automáticamente!' },
    ],
    controls: [
      { icon: '👆', description: 'Toca una burbuja para seleccionarla' },
      { icon: '👆', description: 'Toca de nuevo para deseleccionarla' },
    ],
    tip: '¡Empieza con el número más grande y busca uno pequeño para completar la suma!',
  },
};

export function NumberMuncherGame() {
  const t = useTranslations();
  const locale = useLocale();
  const strings = UI_STRINGS[locale] || UI_STRINGS.en;
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const { playClick, playSuccess, playDrop } = useRetroSounds();

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const config = DIFFICULTY_CONFIG[difficulty];

  const challenge = useMemo(
    () => generateChallenge(config),
    [config, level, challengeIndex, phase]
  );

  const currentSum = useMemo(() => {
    let sum = 0;
    selected.forEach(id => {
      const b = challenge.bubbles.find(bb => bb.id === id);
      if (b) sum += b.value;
    });
    return sum;
  }, [selected, challenge]);

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setPhase('playing');
    setLevel(1);
    setScore(0);
    setChallengeIndex(0);
    setStreak(0);
    setSelected(new Set());
    playClick();
  }, [playClick]);

  const handleBubbleTap = useCallback((id: number) => {
    if (feedback) return;
    playClick();
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [feedback, playClick]);

  // Auto-check when sum matches target
  const handleAutoCheck = useCallback(() => {
    if (feedback || currentSum !== challenge.target) return;

    setFeedback('correct');
    const streakBonus = streak >= 3 ? 50 : streak >= 2 ? 25 : 0;
    setScore(prev => prev + Math.round((100 + streakBonus) * config.scoreMultiplier));
    setStreak(prev => prev + 1);
    playSuccess();

    setTimeout(() => {
      setFeedback(null);
      setSelected(new Set());
      if (challengeIndex + 1 >= config.challengesPerLevel) {
        if (level >= config.totalLevels) {
          setPhase('won');
        } else {
          setPhase('levelComplete');
        }
      } else {
        setChallengeIndex(prev => prev + 1);
      }
    }, 1200);
  }, [currentSum, challenge.target, feedback, streak, config, challengeIndex, level, playSuccess]);

  // Check on every selection change
  useMemo(() => {
    if (currentSum === challenge.target && selected.size > 0 && !feedback) {
      // Small delay so user sees selection
      const timer = setTimeout(handleAutoCheck, 400);
      return () => clearTimeout(timer);
    }
  }, [currentSum, challenge.target, selected.size, feedback, handleAutoCheck]);

  const handleClear = useCallback(() => {
    setSelected(new Set());
    playDrop();
  }, [playDrop]);

  const handleNextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setChallengeIndex(0);
    setSelected(new Set());
    setPhase('playing');
    playClick();
  }, [playClick]);

  const handlePlayAgain = useCallback(() => {
    setPhase('menu');
    setScore(0);
    setLevel(1);
    setChallengeIndex(0);
    setSelected(new Set());
    setStreak(0);
  }, []);

  usePlayAgainKey(phase === 'won', handlePlayAgain);

  return (
    <GameWrapper title={strings.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 sm:p-8" dir={direction}>

        {/* HUD */}
        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-2xl mx-auto">
            <LevelDisplay level={level} />
            <div className="flex gap-2">
              {streak >= 2 && (
                <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full text-xs font-bold">
                  🔥 {streak}
                </span>
              )}
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-bold">
                ⭐ {score}
              </span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Menu */}
          {phase === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 pt-12"
            >
              <span className="text-7xl">🔢</span>
              <h2 className="text-3xl font-bold text-blue-800">{strings.title}</h2>
              <p className="text-blue-600 text-center max-w-xs">
                {strings.description}
              </p>
              <div className="flex flex-col gap-3 w-56">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <motion.button
                    key={d}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStart(d)}
                    className={`py-3 px-6 rounded-xl font-bold text-lg text-white shadow-md ${
                      d === 'easy' ? 'bg-green-400 hover:bg-green-500' :
                      d === 'medium' ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' :
                      'bg-red-400 hover:bg-red-500'
                    }`}
                  >
                    {strings[d]}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Playing */}
          {phase === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              {/* Target display */}
              <div className="bg-white/80 rounded-2xl p-4 mb-4 text-center shadow-sm">
                <p className="text-base text-blue-600 mb-1">{strings.makeNumber}</p>
                <span className="text-5xl font-bold text-blue-800">{challenge.target}</span>
                <div className="mt-2 flex justify-center gap-2 items-center">
                  <span className="text-base text-blue-500">{strings.yourSum}</span>
                  <span className={`text-xl font-bold ${
                    currentSum === challenge.target ? 'text-green-600' :
                    currentSum > challenge.target ? 'text-red-500' : 'text-blue-700'
                  }`}>
                    {currentSum}
                  </span>
                </div>
              </div>

              {/* Bubble field */}
              <div className="bg-white/60 rounded-2xl p-3 mb-4 relative" style={{ height: '320px' }}>
                {challenge.bubbles.map((bubble, idx) => (
                  <motion.button
                    key={bubble.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleBubbleTap(bubble.id)}
                    className={`absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md transition-all ${
                      BUBBLE_COLORS[idx % BUBBLE_COLORS.length]
                    } ${selected.has(bubble.id) ? 'ring-4 ring-yellow-400 scale-110' : ''}`}
                    style={{
                      left: `${bubble.x}%`,
                      top: `${bubble.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {bubble.value}
                  </motion.button>
                ))}
              </div>

              {/* Clear button */}
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClear}
                  className="px-5 py-2.5 rounded-xl bg-gray-200 text-gray-600 font-bold text-base"
                >
                  {strings.clearSelection}
                </motion.button>
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
                  >
                    <span className="text-8xl">🎉</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-center text-sm text-blue-400 mt-3">
                {challengeIndex + 1} / {config.challengesPerLevel}
              </p>
            </motion.div>
          )}

          {/* Level Complete */}
          {phase === 'levelComplete' && (
            <motion.div
              key="levelComplete"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 pt-16"
            >
              <span className="text-7xl">🌟</span>
              <h2 className="text-2xl font-bold text-blue-800">{strings.levelComplete.replace('{n}', String(level))}</h2>
              <p className="text-blue-600">{strings.score}: {score}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextLevel}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold shadow-md"
              >
                {strings.nextLevel}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <WinModal isOpen={phase === 'won'} onPlayAgain={handlePlayAgain} score={score} />

        <InstructionsModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          title={strings.title}
          {...(INSTRUCTIONS_DATA[locale] || INSTRUCTIONS_DATA.en)}
          locale={locale}
        />
      </div>
    </GameWrapper>
  );
}
