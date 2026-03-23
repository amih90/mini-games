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

interface SortItem {
  id: number;
  emoji: string;
  size: number; // 1=smallest ... N=largest
  label: string;
}

interface DifficultyConfig {
  totalLevels: number;
  challengesPerLevel: number;
  itemCount: number;
  pools: SortItem[][];
  scoreMultiplier: number;
}

const ANIMAL_SETS: SortItem[][] = [
  [
    { id: 0, emoji: '🐜', size: 1, label: 'Ant' },
    { id: 1, emoji: '🐸', size: 2, label: 'Frog' },
    { id: 2, emoji: '🐶', size: 3, label: 'Dog' },
    { id: 3, emoji: '🐻', size: 4, label: 'Bear' },
    { id: 4, emoji: '🐘', size: 5, label: 'Elephant' },
  ],
  [
    { id: 0, emoji: '🐝', size: 1, label: 'Bee' },
    { id: 1, emoji: '🐱', size: 2, label: 'Cat' },
    { id: 2, emoji: '🦁', size: 3, label: 'Lion' },
    { id: 3, emoji: '🐴', size: 4, label: 'Horse' },
    { id: 4, emoji: '🐋', size: 5, label: 'Whale' },
  ],
  [
    { id: 0, emoji: '🐛', size: 1, label: 'Bug' },
    { id: 1, emoji: '🐰', size: 2, label: 'Bunny' },
    { id: 2, emoji: '🦊', size: 3, label: 'Fox' },
    { id: 3, emoji: '🐄', size: 4, label: 'Cow' },
    { id: 4, emoji: '🦒', size: 5, label: 'Giraffe' },
  ],
  [
    { id: 0, emoji: '🐌', size: 1, label: 'Snail' },
    { id: 1, emoji: '🐿️', size: 2, label: 'Squirrel' },
    { id: 2, emoji: '🐕', size: 3, label: 'Dog' },
    { id: 3, emoji: '🦌', size: 4, label: 'Deer' },
    { id: 4, emoji: '🐊', size: 5, label: 'Croc' },
  ],
];

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { totalLevels: 3, challengesPerLevel: 5, itemCount: 3, pools: ANIMAL_SETS, scoreMultiplier: 1 },
  medium: { totalLevels: 4, challengesPerLevel: 6, itemCount: 4, pools: ANIMAL_SETS, scoreMultiplier: 1.5 },
  hard: { totalLevels: 5, challengesPerLevel: 7, itemCount: 5, pools: ANIMAL_SETS, scoreMultiplier: 2 },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SizeSorterGame() {
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
  const [streak, setStreak] = useState(0);
  const [tappedOrder, setTappedOrder] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const config = DIFFICULTY_CONFIG[difficulty];

  const items = useMemo(() => {
    const setIdx = Math.floor(Math.random() * ANIMAL_SETS.length);
    const set = ANIMAL_SETS[setIdx];
    return shuffle(set.slice(0, config.itemCount));
  }, [config, level, challengeIndex, phase]);

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setPhase('playing');
    setLevel(1);
    setScore(0);
    setChallengeIndex(0);
    setStreak(0);
    setTappedOrder([]);
    playClick();
  }, [playClick]);

  const handleItemTap = useCallback((itemId: number) => {
    if (feedback || tappedOrder.includes(itemId)) return;

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Expected next size: tappedOrder.length + 1 (smallest first)
    const expectedSize = tappedOrder.length + 1;

    if (item.size === expectedSize) {
      playClick();
      const newOrder = [...tappedOrder, itemId];
      setTappedOrder(newOrder);

      if (newOrder.length === items.length) {
        // All sorted!
        setFeedback('correct');
        const streakBonus = streak >= 3 ? 50 : streak >= 2 ? 25 : 0;
        setScore(prev => prev + Math.round((100 + streakBonus) * config.scoreMultiplier));
        setStreak(prev => prev + 1);
        playSuccess();

        setTimeout(() => {
          setFeedback(null);
          setTappedOrder([]);
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
      }
    } else {
      // Wrong order
      setFeedback('wrong');
      setStreak(0);
      playDrop();
      setTimeout(() => {
        setFeedback(null);
        setTappedOrder([]);
      }, 600);
    }
  }, [feedback, tappedOrder, items, streak, config, challengeIndex, level, playClick, playSuccess, playDrop]);

  const handleNextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setChallengeIndex(0);
    setTappedOrder([]);
    setPhase('playing');
    playClick();
  }, [playClick]);

  const handlePlayAgain = useCallback(() => {
    setPhase('menu');
    setScore(0);
    setLevel(1);
    setChallengeIndex(0);
    setTappedOrder([]);
    setStreak(0);
  }, []);

  usePlayAgainKey(phase === 'won', handlePlayAgain);

  return (
    <GameWrapper title="Size Sorter" onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-3 sm:p-6 ${isRtl ? 'rtl' : 'ltr'}`}>

        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-lg mx-auto">
            <LevelDisplay level={level} isRtl={isRtl} locale={locale} />
            <div className="flex gap-2">
              {streak >= 2 && (
                <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded-full text-xs font-bold">🔥 {streak}</span>
              )}
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-bold">⭐ {score}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-12">
              <span className="text-7xl">📏</span>
              <h2 className="text-3xl font-bold text-sky-800">Size Sorter</h2>
              <p className="text-sky-600 text-center max-w-xs">Tap the animals from smallest to biggest!</p>
              <div className="flex flex-col gap-2 w-48">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <motion.button key={d} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleStart(d)}
                    className={`py-2 px-4 rounded-xl font-bold text-white shadow-md ${d === 'easy' ? 'bg-green-400 hover:bg-green-500' : d === 'medium' ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' : 'bg-red-400 hover:bg-red-500'}`}>
                    {d === 'easy' ? '😊 Easy' : d === 'medium' ? '🤔 Medium' : '🔥 Hard'}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
              <p className="text-center text-sm text-sky-600 mb-3">Tap smallest → biggest:</p>

              {/* Sorted area */}
              <div className="bg-white/80 rounded-2xl p-3 mb-4 min-h-[60px]">
                <div className="flex justify-center gap-3">
                  {tappedOrder.map((id, idx) => {
                    const item = items.find(i => i.id === id);
                    return (
                      <motion.div
                        key={id}
                        initial={{ scale: 0, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="flex flex-col items-center"
                      >
                        <span className="text-3xl" style={{ fontSize: `${1.5 + idx * 0.4}rem` }}>{item?.emoji}</span>
                        <span className="text-[10px] text-sky-500">{idx + 1}</span>
                      </motion.div>
                    );
                  })}
                  {tappedOrder.length === 0 && (
                    <p className="text-sky-300 text-sm py-2">Tap the smallest first!</p>
                  )}
                </div>
              </div>

              {/* Items to sort */}
              <div className="flex flex-wrap justify-center gap-3">
                {items.map(item => {
                  const isTapped = tappedOrder.includes(item.id);
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: isTapped ? 1 : 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleItemTap(item.id)}
                      disabled={isTapped}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center shadow-sm transition-all ${
                        isTapped ? 'bg-gray-100 opacity-40' : 'bg-white hover:bg-sky-50'
                      }`}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <span className="text-[10px] text-sky-600">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {feedback && (
                  <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                    <span className="text-8xl">{feedback === 'correct' ? '🎉' : '❌'}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-center text-xs text-sky-400 mt-3">
                {challengeIndex + 1} / {config.challengesPerLevel}
              </p>
            </motion.div>
          )}

          {phase === 'levelComplete' && (
            <motion.div key="levelComplete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-16">
              <span className="text-7xl">🌟</span>
              <h2 className="text-2xl font-bold text-sky-800">Level {level} Complete!</h2>
              <p className="text-sky-600">Score: {score}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleNextLevel}
                className="px-6 py-3 bg-sky-500 text-white rounded-xl font-bold shadow-md">Next Level →</motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <WinModal isOpen={phase === 'won'} onPlayAgain={handlePlayAgain} score={score} />

        <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)}
          title="Size Sorter"
          instructions={[
            { icon: '🔍', title: 'Look at the Animals', description: 'See a group of animals of different sizes.' },
            { icon: '📏', title: 'Sort by Size', description: 'Tap them in order from smallest to biggest!' },
            { icon: '⭐', title: 'Get It Right', description: 'Put them all in the correct order to score!' },
          ]}
          controls={[
            { icon: '👆', description: 'Tap animals in order from smallest to largest' },
          ]}
          tip="Think about real life — which animal is the smallest?"
          locale={locale} />
      </div>
    </GameWrapper>
  );
}
