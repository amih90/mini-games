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

interface PatternDef {
  symbols: string[];
  pattern: number[]; // indexes into symbols
  blanks: number;    // how many to hide
}

interface DifficultyConfig {
  totalLevels: number;
  challengesPerLevel: number;
  patterns: PatternDef[];
  scoreMultiplier: number;
}

const EMOJI_SETS = [
  ['🔴', '🔵'], ['🌟', '🌙'], ['🎈', '🎁'], ['🍎', '🍌'],
  ['🐱', '🐶'], ['🌸', '🌺'], ['⚡', '💧'], ['🎵', '🎶'],
];

const TRIPLE_EMOJI_SETS = [
  ['🔴', '🔵', '🟢'], ['🌟', '🌙', '☀️'], ['🍎', '🍌', '🍇'],
  ['🐱', '🐶', '🐰'], ['❤️', '💙', '💛'], ['🎈', '🎁', '🎀'],
];

function generateABpattern(): PatternDef {
  const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];
  return { symbols: set, pattern: [0, 1, 0, 1, 0, 1, 0, 1], blanks: 2 };
}

function generateABBpattern(): PatternDef {
  const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];
  return { symbols: set, pattern: [0, 1, 1, 0, 1, 1, 0, 1, 1], blanks: 3 };
}

function generateAABpattern(): PatternDef {
  const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];
  return { symbols: set, pattern: [0, 0, 1, 0, 0, 1, 0, 0, 1], blanks: 3 };
}

function generateABCpattern(): PatternDef {
  const set = TRIPLE_EMOJI_SETS[Math.floor(Math.random() * TRIPLE_EMOJI_SETS.length)];
  return { symbols: set, pattern: [0, 1, 2, 0, 1, 2, 0, 1, 2], blanks: 3 };
}

function generateAABBpattern(): PatternDef {
  const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];
  return { symbols: set, pattern: [0, 0, 1, 1, 0, 0, 1, 1], blanks: 3 };
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    totalLevels: 3,
    challengesPerLevel: 6,
    patterns: Array.from({ length: 10 }, generateABpattern),
    scoreMultiplier: 1,
  },
  medium: {
    totalLevels: 4,
    challengesPerLevel: 7,
    patterns: [
      ...Array.from({ length: 5 }, generateABBpattern),
      ...Array.from({ length: 5 }, generateAABpattern),
    ],
    scoreMultiplier: 1.5,
  },
  hard: {
    totalLevels: 5,
    challengesPerLevel: 8,
    patterns: [
      ...Array.from({ length: 4 }, generateABCpattern),
      ...Array.from({ length: 3 }, generateAABBpattern),
      ...Array.from({ length: 3 }, generateABBpattern),
    ],
    scoreMultiplier: 2,
  },
};

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    title: 'Pattern Maker',
    description: 'Complete the repeating patterns!',
    easy: '😊 Easy', medium: '🤔 Medium', hard: '🔥 Hard',
    completePattern: 'Complete the pattern:',
    pickNext: 'Pick the next symbol (slot {x} of {y}):',
    clear: '🗑️ Clear', check: '✅ Check!',
    levelComplete: 'Level {n} Complete!',
    score: 'Score', nextLevel: 'Next Level →',
  },
  he: {
    title: 'יוצר דפוסים',
    description: 'השלימו את הדפוסים החוזרים!',
    easy: '😊 קל', medium: '🤔 בינוני', hard: '🔥 קשה',
    completePattern: 'השלימו את הדפוס:',
    pickNext: 'בחרו את הסמל הבא (משבצת {x} מתוך {y}):',
    clear: '🗑️ נקה', check: '✅ בדיקה!',
    levelComplete: 'שלב {n} הושלם!',
    score: 'ניקוד', nextLevel: 'שלב הבא →',
  },
  zh: {
    title: '图案制作',
    description: '完成重复的图案！',
    easy: '😊 简单', medium: '🤔 中等', hard: '🔥 困难',
    completePattern: '完成图案：',
    pickNext: '选择下一个符号（第{x}个，共{y}个）：',
    clear: '🗑️ 清除', check: '✅ 检查！',
    levelComplete: '第{n}关完成！',
    score: '分数', nextLevel: '下一关 →',
  },
  es: {
    title: 'Creador de Patrones',
    description: '¡Completa los patrones repetitivos!',
    easy: '😊 Fácil', medium: '🤔 Medio', hard: '🔥 Difícil',
    completePattern: 'Completa el patrón:',
    pickNext: 'Elige el siguiente símbolo (casilla {x} de {y}):',
    clear: '🗑️ Limpiar', check: '✅ ¡Revisar!',
    levelComplete: '¡Nivel {n} Completado!',
    score: 'Puntos', nextLevel: 'Siguiente Nivel →',
  },
};

const INSTRUCTIONS_DATA: Record<string, { instructions: { icon: string; title: string; description: string }[]; controls: { icon: string; description: string }[]; tip: string }> = {
  en: {
    instructions: [
      { icon: '🔍', title: 'Study the Pattern', description: 'Look at the sequence and find the repeating rule.' },
      { icon: '🧩', title: 'Pick the Next', description: 'Tap the item that continues the pattern correctly.' },
      { icon: '⭐', title: 'Keep Going', description: 'Fill all the blanks to complete the level!' },
    ],
    controls: [{ icon: '👆', description: 'Tap the correct emoji to fill the blank spot' }],
    tip: 'Say the pattern out loud — AB, AB, AB — to hear the rhythm!',
  },
  he: {
    instructions: [
      { icon: '🔍', title: 'חקרו את הדפוס', description: 'הסתכלו על הרצף ומצאו את החוק החוזר.' },
      { icon: '🧩', title: 'בחרו את הבא', description: 'הקישו על הפריט שממשיך את הדפוס נכון.' },
      { icon: '⭐', title: 'המשיכו', description: 'מלאו את כל החסר כדי להשלים את השלב!' },
    ],
    controls: [{ icon: '👆', description: 'הקישו על האמוג׳י הנכון למילוי המשבצת' }],
    tip: 'אמרו את הדפוס בקול — AB, AB, AB — כדי לשמוע את הקצב!',
  },
  zh: {
    instructions: [
      { icon: '🔍', title: '研究图案', description: '观察序列，找到重复的规律。' },
      { icon: '🧩', title: '选择下一个', description: '点击正确的图案继续序列。' },
      { icon: '⭐', title: '继续前进', description: '填满所有空白完成关卡！' },
    ],
    controls: [{ icon: '👆', description: '点击正确的表情填入空白处' }],
    tip: '大声说出图案 — AB, AB, AB — 感受节奏！',
  },
  es: {
    instructions: [
      { icon: '🔍', title: 'Estudia el Patrón', description: 'Mira la secuencia y encuentra la regla repetitiva.' },
      { icon: '🧩', title: 'Elige el Siguiente', description: 'Toca el elemento que continúa el patrón correctamente.' },
      { icon: '⭐', title: 'Sigue Adelante', description: '¡Llena todos los espacios para completar el nivel!' },
    ],
    controls: [{ icon: '👆', description: 'Toca el emoji correcto para llenar el espacio' }],
    tip: 'Di el patrón en voz alta — AB, AB, AB — ¡para sentir el ritmo!',
  },
};

export function PatternMakerGame() {
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
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());

  const config = DIFFICULTY_CONFIG[difficulty];

  // Generate challenge
  const currentPattern = useMemo(() => {
    const generators = difficulty === 'easy'
      ? [generateABpattern]
      : difficulty === 'medium'
        ? [generateABBpattern, generateAABpattern]
        : [generateABCpattern, generateAABBpattern, generateABBpattern];
    const gen = generators[Math.floor(Math.random() * generators.length)];
    return gen();
  }, [difficulty, level, challengeIndex, phase]);

  // Determine which positions are blanks
  const blankPositions = useMemo(() => {
    const positions = currentPattern.pattern.map((_, i) => i);
    // Hide last N positions
    return positions.slice(positions.length - currentPattern.blanks);
  }, [currentPattern]);

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setPhase('playing');
    setLevel(1);
    setScore(0);
    setChallengeIndex(0);
    setStreak(0);
    setAnswers(new Map());
    playClick();
  }, [playClick]);

  const handleSymbolTap = useCallback((blankIdx: number, symbolIdx: number) => {
    if (feedback) return;
    playClick();
    setAnswers(prev => {
      const next = new Map(prev);
      next.set(blankIdx, symbolIdx);
      return next;
    });
  }, [feedback, playClick]);

  const handleCheck = useCallback(() => {
    if (feedback) return;
    // Check if all blanks filled
    const allFilled = blankPositions.every(pos => answers.has(pos));
    if (!allFilled) return;

    const isCorrect = blankPositions.every(pos =>
      answers.get(pos) === currentPattern.pattern[pos]
    );

    if (isCorrect) {
      setFeedback('correct');
      const streakBonus = streak >= 3 ? 50 : streak >= 2 ? 25 : 0;
      setScore(prev => prev + Math.round((100 + streakBonus) * config.scoreMultiplier));
      setStreak(prev => prev + 1);
      playSuccess();

      setTimeout(() => {
        setFeedback(null);
        setAnswers(new Map());
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
      setTimeout(() => {
        setFeedback(null);
        setAnswers(new Map());
      }, 1000);
    }
  }, [answers, blankPositions, currentPattern, streak, config, challengeIndex, level, playSuccess, playDrop, feedback]);

  const handleNextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setChallengeIndex(0);
    setAnswers(new Map());
    setPhase('playing');
    playClick();
  }, [playClick]);

  const handlePlayAgain = useCallback(() => {
    setPhase('menu');
    setScore(0);
    setLevel(1);
    setChallengeIndex(0);
    setAnswers(new Map());
    setStreak(0);
  }, []);

  usePlayAgainKey(phase === 'won', handlePlayAgain);

  return (
    <GameWrapper title={strings.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4 sm:p-8" dir={direction}>

        {/* HUD */}
        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-2xl mx-auto">
            <LevelDisplay level={level} />
            <div className="flex gap-2">
              {streak >= 2 && (
                <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-bold">
                  🔥 {streak}
                </span>
              )}
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-sm font-bold">
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
              <span className="text-7xl">🔮</span>
              <h2 className="text-3xl font-bold text-purple-800">{strings.title}</h2>
              <p className="text-purple-600 text-center max-w-xs">
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
              {/* Pattern display */}
              <div className="bg-white/80 rounded-2xl p-4 mb-4">
                <p className="text-base text-purple-600 mb-3 text-center">{strings.completePattern}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {currentPattern.pattern.map((symbolIdx, pos) => {
                    const isBlank = blankPositions.includes(pos);
                    const answer = answers.get(pos);
                    return (
                      <div
                        key={pos}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center text-2xl sm:text-3xl ${
                          isBlank
                            ? answer !== undefined
                              ? 'bg-purple-100 border-2 border-purple-300'
                              : 'bg-gray-100 border-2 border-dashed border-gray-300'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        {isBlank
                          ? answer !== undefined
                            ? currentPattern.symbols[answer]
                            : '❓'
                          : currentPattern.symbols[symbolIdx]}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active blank selector */}
              {(() => {
                const firstEmpty = blankPositions.find(pos => !answers.has(pos)) ?? blankPositions[blankPositions.length - 1];
                return (
                  <div className="bg-white/60 rounded-2xl p-3 mb-4">
                    <p className="text-sm text-purple-500 mb-2 text-center">
                      {strings.pickNext.replace('{x}', String(blankPositions.indexOf(firstEmpty) + 1)).replace('{y}', String(blankPositions.length))}
                    </p>
                    <div className="flex justify-center gap-3">
                      {currentPattern.symbols.map((sym, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleSymbolTap(firstEmpty, idx)}
                          className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl shadow-sm flex items-center justify-center text-3xl sm:text-4xl hover:bg-purple-50 transition-colors"
                        >
                          {sym}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAnswers(new Map())}
                  className="px-5 py-2.5 rounded-xl bg-gray-200 text-gray-600 font-bold text-base"
                >
                  {strings.clear}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCheck}
                  disabled={!blankPositions.every(pos => answers.has(pos)) || !!feedback}
                  className="px-8 py-3 rounded-xl bg-purple-500 text-white font-bold text-lg shadow-md disabled:opacity-50"
                >
                  {strings.check}
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
                    <span className="text-8xl">{feedback === 'correct' ? '🎉' : '❌'}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-center text-sm text-purple-400 mt-3">
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
              <h2 className="text-2xl font-bold text-purple-800">{strings.levelComplete.replace('{n}', String(level))}</h2>
              <p className="text-purple-600">{strings.score}: {score}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextLevel}
                className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold shadow-md"
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
