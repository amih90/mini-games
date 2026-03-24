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

interface FractionChallenge {
  numerator: number;
  denominator: number;
  label: string;
}

interface DifficultyConfig {
  totalLevels: number;
  challengesPerLevel: number;
  fractions: FractionChallenge[];
  scoreMultiplier: number;
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    totalLevels: 3,
    challengesPerLevel: 5,
    fractions: [
      { numerator: 1, denominator: 2, label: '½' },
      { numerator: 1, denominator: 4, label: '¼' },
    ],
    scoreMultiplier: 1,
  },
  medium: {
    totalLevels: 4,
    challengesPerLevel: 6,
    fractions: [
      { numerator: 1, denominator: 2, label: '½' },
      { numerator: 1, denominator: 3, label: '⅓' },
      { numerator: 1, denominator: 4, label: '¼' },
      { numerator: 2, denominator: 3, label: '⅔' },
    ],
    scoreMultiplier: 1.5,
  },
  hard: {
    totalLevels: 5,
    challengesPerLevel: 7,
    fractions: [
      { numerator: 1, denominator: 2, label: '½' },
      { numerator: 1, denominator: 3, label: '⅓' },
      { numerator: 1, denominator: 4, label: '¼' },
      { numerator: 2, denominator: 3, label: '⅔' },
      { numerator: 3, denominator: 4, label: '¾' },
      { numerator: 1, denominator: 6, label: '⅙' },
      { numerator: 1, denominator: 8, label: '⅛' },
    ],
    scoreMultiplier: 2,
  },
};

function PizzaSVG({ totalSlices, filledSlices, size = 200 }: { totalSlices: number; filledSlices: number; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;

  const slices = [];
  for (let i = 0; i < totalSlices; i++) {
    const startAngle = (i * 360) / totalSlices - 90;
    const endAngle = ((i + 1) * 360) / totalSlices - 90;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    slices.push(
      <path
        key={i}
        d={d}
        fill={i < filledSlices ? '#F97316' : '#FED7AA'}
        stroke="#EA580C"
        strokeWidth="2"
      />
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r + 3} fill="#FDBA74" />
      {slices}
      {/* Pepperoni on filled slices */}
      {Array.from({ length: filledSlices }).map((_, i) => {
        const midAngle = ((i + 0.5) * 360) / totalSlices - 90;
        const midRad = (midAngle * Math.PI) / 180;
        const px = cx + r * 0.55 * Math.cos(midRad);
        const py = cy + r * 0.55 * Math.sin(midRad);
        return <circle key={`pep-${i}`} cx={px} cy={py} r={6} fill="#DC2626" />;
      })}
    </svg>
  );
}

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    title: 'Fraction Pizza',
    description: 'Slice the pizza to show the right fraction!',
    easy: '😊 Easy', medium: '🤔 Medium', hard: '🔥 Hard',
    showFraction: 'Show this fraction:',
    outOfSlices: '{x} out of {y} slices',
    howManySlices: 'How many slices?',
    check: '✅ Check!',
    levelComplete: 'Level {n} Complete!',
    score: 'Score:',
    nextLevel: 'Next Level →',
  },
  he: {
    title: 'פיצה שברים',
    description: 'חתכו את הפיצה כדי להראות את השבר הנכון!',
    easy: '😊 קל', medium: '🤔 בינוני', hard: '🔥 קשה',
    showFraction: 'הראו את השבר:',
    outOfSlices: '{x} מתוך {y} פרוסות',
    howManySlices: 'כמה פרוסות?',
    check: '✅ בדיקה!',
    levelComplete: 'שלב {n} הושלם!',
    score: 'ניקוד:',
    nextLevel: 'שלב הבא →',
  },
  zh: {
    title: '分数披萨',
    description: '切披萨来展示正确的分数！',
    easy: '😊 简单', medium: '🤔 中等', hard: '🔥 困难',
    showFraction: '展示这个分数：',
    outOfSlices: '{y}片中的{x}片',
    howManySlices: '几片？',
    check: '✅ 检查！',
    levelComplete: '第{n}关完成！',
    score: '分数：',
    nextLevel: '下一关 →',
  },
  es: {
    title: 'Pizza Fracciones',
    description: '¡Corta la pizza para mostrar la fracción correcta!',
    easy: '😊 Fácil', medium: '🤔 Medio', hard: '🔥 Difícil',
    showFraction: 'Muestra esta fracción:',
    outOfSlices: '{x} de {y} rebanadas',
    howManySlices: '¿Cuántas rebanadas?',
    check: '✅ ¡Revisar!',
    levelComplete: '¡Nivel {n} Completado!',
    score: 'Puntos:',
    nextLevel: 'Siguiente Nivel →',
  },
};

const INSTRUCTIONS_DATA: Record<string, { instructions: { icon: string; title: string; description: string }[]; controls: { icon: string; description: string }[]; tip: string }> = {
  en: {
    instructions: [
      { icon: '🍕', title: 'Read the Fraction', description: 'Look at the fraction shown — the bottom number tells you how many slices!' },
      { icon: '🔢', title: 'Pick Slices', description: 'Tap a number to set how many slices the pizza should have.' },
      { icon: '✅', title: 'Check It', description: 'Hit Check to see if your slicing matches the fraction!' },
    ],
    controls: [
      { icon: '🔢', description: 'Tap a number button to change the slice count' },
      { icon: '✅', description: 'Tap Check to submit your answer' },
    ],
    tip: 'If the fraction is ¼, you need 4 slices — the bottom number tells you how many pieces!',
  },
  he: {
    instructions: [
      { icon: '🍕', title: 'קראו את השבר', description: 'הסתכלו על השבר — המספר התחתון אומר כמה פרוסות!' },
      { icon: '🔢', title: 'בחרו פרוסות', description: 'הקישו על מספר כדי לקבוע כמה פרוסות לפיצה.' },
      { icon: '✅', title: 'בדקו', description: 'לחצו בדיקה כדי לראות אם החיתוך מתאים לשבר!' },
    ],
    controls: [
      { icon: '🔢', description: 'הקישו על כפתור מספר לשנות את מספר הפרוסות' },
      { icon: '✅', description: 'הקישו בדיקה לשלוח את התשובה' },
    ],
    tip: 'אם השבר הוא ¼, צריך 4 פרוסות — המספר התחתון אומר כמה חלקים!',
  },
  zh: {
    instructions: [
      { icon: '🍕', title: '读分数', description: '看显示的分数 — 下面的数字告诉你需要几片！' },
      { icon: '🔢', title: '选择片数', description: '点击数字设置披萨应该切几片。' },
      { icon: '✅', title: '检查', description: '点击检查看你的切法是否正确！' },
    ],
    controls: [
      { icon: '🔢', description: '点击数字按钮改变片数' },
      { icon: '✅', description: '点击检查提交答案' },
    ],
    tip: '如果分数是¼，你需要4片 — 下面的数字告诉你几片！',
  },
  es: {
    instructions: [
      { icon: '🍕', title: 'Lee la Fracción', description: '¡Mira la fracción — el número de abajo te dice cuántas rebanadas!' },
      { icon: '🔢', title: 'Elige Rebanadas', description: 'Toca un número para decidir cuántas rebanadas tendrá la pizza.' },
      { icon: '✅', title: 'Revisa', description: '¡Presiona Revisar para ver si cortaste bien!' },
    ],
    controls: [
      { icon: '🔢', description: 'Toca un botón numérico para cambiar las rebanadas' },
      { icon: '✅', description: 'Toca Revisar para enviar tu respuesta' },
    ],
    tip: '¡Si la fracción es ¼, necesitas 4 rebanadas — el número de abajo te dice cuántas!',
  },
};

export function FractionPizzaGame() {
  const t = useTranslations();
  const locale = useLocale();
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const strings = UI_STRINGS[locale] || UI_STRINGS.en;
  const { playClick, playSuccess, playDrop } = useRetroSounds();

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [streak, setStreak] = useState(0);
  const [sliceCount, setSliceCount] = useState(2);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const config = DIFFICULTY_CONFIG[difficulty];

  const challenge = useMemo(() => {
    const f = config.fractions[Math.floor(Math.random() * config.fractions.length)];
    return f;
  }, [config, level, challengeIndex, phase]);

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setPhase('playing');
    setLevel(1);
    setScore(0);
    setChallengeIndex(0);
    setStreak(0);
    setSliceCount(2);
    playClick();
  }, [playClick]);

  const handleSliceChange = useCallback((count: number) => {
    if (feedback) return;
    playClick();
    setSliceCount(count);
  }, [feedback, playClick]);

  const handleCheck = useCallback(() => {
    if (feedback) return;

    // The pizza is sliced into `sliceCount` pieces, and we show `challenge.numerator` filled
    // Correct if sliceCount === challenge.denominator
    const isCorrect = sliceCount === challenge.denominator;

    if (isCorrect) {
      setFeedback('correct');
      const streakBonus = streak >= 3 ? 50 : streak >= 2 ? 25 : 0;
      setScore(prev => prev + Math.round((100 + streakBonus) * config.scoreMultiplier));
      setStreak(prev => prev + 1);
      playSuccess();

      setTimeout(() => {
        setFeedback(null);
        setSliceCount(2);
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
    } else {
      setFeedback('wrong');
      setStreak(0);
      playDrop();
      setTimeout(() => setFeedback(null), 800);
    }
  }, [sliceCount, challenge, feedback, streak, config, challengeIndex, level, playSuccess, playDrop]);

  const handleNextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setChallengeIndex(0);
    setSliceCount(2);
    setPhase('playing');
    playClick();
  }, [playClick]);

  const handlePlayAgain = useCallback(() => {
    setPhase('menu');
    setScore(0);
    setLevel(1);
    setChallengeIndex(0);
    setSliceCount(2);
    setStreak(0);
  }, []);

  usePlayAgainKey(phase === 'won', handlePlayAgain);

  const sliceOptions = [2, 3, 4, 6, 8];

  return (
    <GameWrapper title={strings.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 p-4 sm:p-8" dir={direction}>

        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-2xl mx-auto">
            <LevelDisplay level={level} />
            <div className="flex gap-2">
              {streak >= 2 && (
                <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-bold">🔥 {streak}</span>
              )}
              <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-base font-bold">⭐ {score}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-12">
              <span className="text-7xl">🍕</span>
              <h2 className="text-3xl font-bold text-orange-800">{strings.title}</h2>
              <p className="text-orange-600 text-center max-w-xs">{strings.description}</p>
              <div className="flex flex-col gap-3 w-56">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <motion.button key={d} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleStart(d)}
                    className={`py-3 px-6 rounded-xl font-bold text-lg text-white shadow-md ${d === 'easy' ? 'bg-green-400 hover:bg-green-500' : d === 'medium' ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' : 'bg-red-400 hover:bg-red-500'}`}>
                    {strings[d]}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
              {/* Fraction display */}
              <div className="bg-white/80 rounded-2xl p-4 mb-4 text-center shadow-sm">
                <p className="text-base text-orange-600 mb-1">{strings.showFraction}</p>
                <div className="text-5xl font-bold text-orange-800">{challenge.label}</div>
                <p className="text-sm text-orange-500 mt-1">
                  {strings.outOfSlices.replace('{x}', String(challenge.numerator)).replace('{y}', String(challenge.denominator))}
                </p>
              </div>

              {/* Pizza canvas */}
              <div className="flex justify-center mb-4">
                <motion.div key={sliceCount} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                  <PizzaSVG
                    totalSlices={sliceCount}
                    filledSlices={challenge.numerator}
                    size={240}
                  />
                </motion.div>
              </div>

              {/* Slice selector */}
              <div className="bg-white/60 rounded-2xl p-3 mb-4">
                <p className="text-sm text-orange-500 mb-2 text-center">{strings.howManySlices}</p>
                <div className="flex justify-center gap-2">
                  {sliceOptions.map(n => (
                    <motion.button
                      key={n}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSliceChange(n)}
                      className={`w-14 h-14 rounded-xl font-bold text-lg shadow-sm transition-all ${
                        sliceCount === n
                          ? 'bg-orange-400 text-white ring-2 ring-orange-600'
                          : 'bg-white text-orange-700 hover:bg-orange-50'
                      }`}
                    >
                      {n}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCheck}
                  disabled={!!feedback}
                  className="px-8 py-3 rounded-xl bg-orange-500 text-white font-bold text-lg shadow-md disabled:opacity-50"
                >
                  {strings.check}
                </motion.button>
              </div>

              <AnimatePresence>
                {feedback && (
                  <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                    <span className="text-8xl">{feedback === 'correct' ? '🎉' : '❌'}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-center text-sm text-orange-400 mt-3">
                {challengeIndex + 1} / {config.challengesPerLevel}
              </p>
            </motion.div>
          )}

          {phase === 'levelComplete' && (
            <motion.div key="levelComplete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-16">
              <span className="text-7xl">🌟</span>
              <h2 className="text-2xl font-bold text-orange-800">{strings.levelComplete.replace('{n}', String(level))}</h2>
              <p className="text-orange-600">{strings.score} {score}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleNextLevel}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold shadow-md">{strings.nextLevel}</motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <WinModal isOpen={phase === 'won'} onPlayAgain={handlePlayAgain} score={score} />

        <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)}
          title={strings.title}
          {...(INSTRUCTIONS_DATA[locale] || INSTRUCTIONS_DATA.en)}
          locale={locale} />
      </div>
    </GameWrapper>
  );
}
