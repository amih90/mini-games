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

export function PatternMakerGame() {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === 'he';
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
    <GameWrapper title="Pattern Maker" onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-3 sm:p-6 ${isRtl ? 'rtl' : 'ltr'}`}>

        {/* HUD */}
        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-lg mx-auto">
            <LevelDisplay level={level} isRtl={isRtl} locale={locale} />
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
              <h2 className="text-3xl font-bold text-purple-800">Pattern Maker</h2>
              <p className="text-purple-600 text-center max-w-xs">
                Complete the repeating patterns!
              </p>
              <div className="flex flex-col gap-2 w-48">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <motion.button
                    key={d}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStart(d)}
                    className={`py-2 px-4 rounded-xl font-bold text-white shadow-md ${
                      d === 'easy' ? 'bg-green-400 hover:bg-green-500' :
                      d === 'medium' ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' :
                      'bg-red-400 hover:bg-red-500'
                    }`}
                  >
                    {d === 'easy' ? '😊 Easy' : d === 'medium' ? '🤔 Medium' : '🔥 Hard'}
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
              className="max-w-lg mx-auto"
            >
              {/* Pattern display */}
              <div className="bg-white/80 rounded-2xl p-4 mb-4">
                <p className="text-sm text-purple-600 mb-3 text-center">Complete the pattern:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {currentPattern.pattern.map((symbolIdx, pos) => {
                    const isBlank = blankPositions.includes(pos);
                    const answer = answers.get(pos);
                    return (
                      <div
                        key={pos}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl ${
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
                    <p className="text-xs text-purple-500 mb-2 text-center">
                      Pick the next symbol (slot {blankPositions.indexOf(firstEmpty) + 1} of {blankPositions.length}):
                    </p>
                    <div className="flex justify-center gap-3">
                      {currentPattern.symbols.map((sym, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleSymbolTap(firstEmpty, idx)}
                          className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl sm:text-3xl hover:bg-purple-50 transition-colors"
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
                  className="px-4 py-2 rounded-xl bg-gray-200 text-gray-600 font-bold text-sm"
                >
                  🗑️ Clear
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCheck}
                  disabled={!blankPositions.every(pos => answers.has(pos)) || !!feedback}
                  className="px-6 py-2 rounded-xl bg-purple-500 text-white font-bold shadow-md disabled:opacity-50"
                >
                  ✅ Check!
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

              <p className="text-center text-xs text-purple-400 mt-3">
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
              <h2 className="text-2xl font-bold text-purple-800">Level {level} Complete!</h2>
              <p className="text-purple-600">Score: {score}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextLevel}
                className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold shadow-md"
              >
                Next Level →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <WinModal isOpen={phase === 'won'} onPlayAgain={handlePlayAgain} score={score} />

        <InstructionsModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          title="Pattern Maker"
          instructions={[
            { icon: '🔍', title: 'Study the Pattern', description: 'Look at the sequence and find the repeating rule.' },
            { icon: '🧩', title: 'Pick the Next', description: 'Tap the item that continues the pattern correctly.' },
            { icon: '⭐', title: 'Keep Going', description: 'Fill all the blanks to complete the level!' },
          ]}
          controls={[
            { icon: '👆', description: 'Tap the correct emoji to fill the blank spot' },
          ]}
          tip="Say the pattern out loud — AB, AB, AB — to hear the rhythm!"
          locale={locale}
        />
      </div>
    </GameWrapper>
  );
}
