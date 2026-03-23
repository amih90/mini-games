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

interface PairDef {
  item: string;
  itemEmoji: string;
  match: string;
  matchEmoji: string;
  category: string;
}

interface DifficultyConfig {
  totalLevels: number;
  pairsPerLevel: number;
  pool: PairDef[];
  scoreMultiplier: number;
}

const ANIMAL_PAIRS: PairDef[] = [
  { item: 'Dog', itemEmoji: '🐶', match: 'Bone', matchEmoji: '🦴', category: 'food' },
  { item: 'Cat', itemEmoji: '🐱', match: 'Fish', matchEmoji: '🐟', category: 'food' },
  { item: 'Rabbit', itemEmoji: '🐰', match: 'Carrot', matchEmoji: '🥕', category: 'food' },
  { item: 'Monkey', itemEmoji: '🐵', match: 'Banana', matchEmoji: '🍌', category: 'food' },
  { item: 'Bear', itemEmoji: '🐻', match: 'Honey', matchEmoji: '🍯', category: 'food' },
  { item: 'Mouse', itemEmoji: '🐭', match: 'Cheese', matchEmoji: '🧀', category: 'food' },
];

const HOME_PAIRS: PairDef[] = [
  { item: 'Bird', itemEmoji: '🐦', match: 'Nest', matchEmoji: '🪺', category: 'home' },
  { item: 'Fish', itemEmoji: '🐟', match: 'Water', matchEmoji: '🌊', category: 'home' },
  { item: 'Spider', itemEmoji: '🕷️', match: 'Web', matchEmoji: '🕸️', category: 'home' },
  { item: 'Bee', itemEmoji: '🐝', match: 'Hive', matchEmoji: '🐝', category: 'home' },
  { item: 'Penguin', itemEmoji: '🐧', match: 'Ice', matchEmoji: '🧊', category: 'home' },
  { item: 'Snail', itemEmoji: '🐌', match: 'Shell', matchEmoji: '🐚', category: 'home' },
];

const TOOL_PAIRS: PairDef[] = [
  { item: 'Chef', itemEmoji: '👨‍🍳', match: 'Pan', matchEmoji: '🍳', category: 'tool' },
  { item: 'Doctor', itemEmoji: '👩‍⚕️', match: 'Stethoscope', matchEmoji: '🩺', category: 'tool' },
  { item: 'Artist', itemEmoji: '🧑‍🎨', match: 'Palette', matchEmoji: '🎨', category: 'tool' },
  { item: 'Farmer', itemEmoji: '🧑‍🌾', match: 'Tractor', matchEmoji: '🚜', category: 'tool' },
  { item: 'Astronaut', itemEmoji: '🧑‍🚀', match: 'Rocket', matchEmoji: '🚀', category: 'tool' },
  { item: 'Firefighter', itemEmoji: '🧑‍🚒', match: 'Truck', matchEmoji: '🚒', category: 'tool' },
];

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { totalLevels: 3, pairsPerLevel: 3, pool: ANIMAL_PAIRS, scoreMultiplier: 1 },
  medium: { totalLevels: 4, pairsPerLevel: 4, pool: [...ANIMAL_PAIRS, ...HOME_PAIRS], scoreMultiplier: 1.5 },
  hard: { totalLevels: 5, pairsPerLevel: 5, pool: [...ANIMAL_PAIRS, ...HOME_PAIRS, ...TOOL_PAIRS], scoreMultiplier: 2 },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MatchPairsGame() {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === 'he';
  const { playClick, playSuccess, playDrop } = useRetroSounds();

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [streak, setStreak] = useState(0);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const config = DIFFICULTY_CONFIG[difficulty];

  const { leftItems, rightItems, pairs } = useMemo(() => {
    const picked = shuffle(config.pool).slice(0, config.pairsPerLevel);
    const left = picked.map((p, i) => ({ idx: i, label: p.item, emoji: p.itemEmoji }));
    const right = shuffle(picked.map((p, i) => ({ idx: i, label: p.match, emoji: p.matchEmoji })));
    return { leftItems: left, rightItems: right, pairs: picked };
  }, [config, level, phase]);

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setPhase('playing');
    setLevel(1);
    setScore(0);
    setStreak(0);
    setMatched(new Set());
    setSelectedLeft(null);
    playClick();
  }, [playClick]);

  const handleLeftTap = useCallback((idx: number) => {
    if (feedback || matched.has(idx)) return;
    playClick();
    setSelectedLeft(idx);
  }, [feedback, matched, playClick]);

  const handleRightTap = useCallback((pairIdx: number) => {
    if (feedback || selectedLeft === null || matched.has(pairIdx)) return;

    if (selectedLeft === pairIdx) {
      setFeedback('correct');
      const streakBonus = streak >= 3 ? 50 : streak >= 2 ? 25 : 0;
      setScore(prev => prev + Math.round((100 + streakBonus) * config.scoreMultiplier));
      setStreak(prev => prev + 1);
      playSuccess();

      const newMatched = new Set(matched);
      newMatched.add(pairIdx);
      setMatched(newMatched);

      setTimeout(() => {
        setFeedback(null);
        setSelectedLeft(null);
        if (newMatched.size >= config.pairsPerLevel) {
          if (level >= config.totalLevels) {
            setPhase('won');
          } else {
            setPhase('levelComplete');
          }
        }
      }, 800);
    } else {
      setFeedback('wrong');
      setStreak(0);
      playDrop();
      setTimeout(() => {
        setFeedback(null);
        setSelectedLeft(null);
      }, 600);
    }
  }, [selectedLeft, matched, streak, config, level, feedback, playSuccess, playDrop]);

  const handleNextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setMatched(new Set());
    setSelectedLeft(null);
    setPhase('playing');
    playClick();
  }, [playClick]);

  const handlePlayAgain = useCallback(() => {
    setPhase('menu');
    setScore(0);
    setLevel(1);
    setMatched(new Set());
    setSelectedLeft(null);
    setStreak(0);
  }, []);

  usePlayAgainKey(phase === 'won', handlePlayAgain);

  return (
    <GameWrapper title="Match Pairs" onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 p-3 sm:p-6 ${isRtl ? 'rtl' : 'ltr'}`}>

        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-lg mx-auto">
            <LevelDisplay level={level} isRtl={isRtl} locale={locale} />
            <div className="flex gap-2">
              {streak >= 2 && (
                <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full text-xs font-bold">🔥 {streak}</span>
              )}
              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-sm font-bold">⭐ {score}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-12">
              <span className="text-7xl">🔗</span>
              <h2 className="text-3xl font-bold text-teal-800">Match Pairs</h2>
              <p className="text-teal-600 text-center max-w-xs">Match animals to their food, homes, or tools!</p>
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
              <p className="text-center text-sm text-teal-600 mb-3">
                Tap an item on the left, then its match on the right!
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Left column */}
                <div className="flex flex-col gap-2">
                  {leftItems.map(({ idx, label, emoji }) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: matched.has(idx) ? 1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleLeftTap(idx)}
                      className={`py-3 px-3 rounded-xl font-bold text-lg shadow-sm transition-all ${
                        matched.has(idx) ? 'bg-emerald-200 text-emerald-500 opacity-60' :
                        selectedLeft === idx ? 'bg-teal-400 text-white ring-2 ring-teal-600' :
                        'bg-white text-teal-800 hover:bg-teal-50'
                      }`}
                    >
                      <span className="mr-1">{emoji}</span> {label}
                    </motion.button>
                  ))}
                </div>
                {/* Right column */}
                <div className="flex flex-col gap-2">
                  {rightItems.map(({ idx, label, emoji }) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: matched.has(idx) ? 1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRightTap(idx)}
                      className={`py-3 px-3 rounded-xl font-bold text-lg shadow-sm transition-all ${
                        matched.has(idx) ? 'bg-emerald-200 text-emerald-500 opacity-60' :
                        'bg-white text-cyan-800 hover:bg-cyan-50'
                      }`}
                    >
                      <span className="mr-1">{emoji}</span> {label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {feedback && (
                  <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                    <span className="text-8xl">{feedback === 'correct' ? '🎉' : '❌'}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {phase === 'levelComplete' && (
            <motion.div key="levelComplete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-16">
              <span className="text-7xl">🌟</span>
              <h2 className="text-2xl font-bold text-teal-800">Level {level} Complete!</h2>
              <p className="text-teal-600">Score: {score}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleNextLevel}
                className="px-6 py-3 bg-teal-500 text-white rounded-xl font-bold shadow-md">Next Level →</motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <WinModal isOpen={phase === 'won'} onPlayAgain={handlePlayAgain} score={score} />

        <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)}
          title="Match Pairs"
          instructions={[
            { icon: '🔗', title: 'Find the Match', description: 'Each item on the left has a partner on the right!' },
            { icon: '🐶', title: 'Think About It', description: 'Dogs eat bones, cats eat fish — match what belongs together.' },
            { icon: '⭐', title: 'Score Points', description: 'Match all pairs to complete the level. Build streaks for bonus points!' },
          ]}
          controls={[
            { icon: '👈', description: 'Tap an item on the left to select it' },
            { icon: '👉', description: 'Then tap the matching item on the right' },
          ]}
          tip="Think about what each animal eats or where it lives!"
          locale={locale} />
      </div>
    </GameWrapper>
  );
}
