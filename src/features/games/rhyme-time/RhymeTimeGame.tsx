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

interface RhymePair {
  word: string;
  emoji: string;
  rhyme: string;
  rhymeEmoji: string;
}

interface DifficultyConfig {
  totalLevels: number;
  pairsPerLevel: number;
  pool: RhymePair[];
  scoreMultiplier: number;
}

const EASY_PAIRS: RhymePair[] = [
  { word: 'Cat', emoji: '🐱', rhyme: 'Hat', rhymeEmoji: '🎩' },
  { word: 'Dog', emoji: '🐶', rhyme: 'Log', rhymeEmoji: '🪵' },
  { word: 'Sun', emoji: '☀️', rhyme: 'Fun', rhymeEmoji: '🎉' },
  { word: 'Bee', emoji: '🐝', rhyme: 'Tree', rhymeEmoji: '🌳' },
  { word: 'Star', emoji: '⭐', rhyme: 'Car', rhymeEmoji: '🚗' },
  { word: 'Moon', emoji: '🌙', rhyme: 'Spoon', rhymeEmoji: '🥄' },
];

const MEDIUM_PAIRS: RhymePair[] = [
  ...EASY_PAIRS,
  { word: 'Cake', emoji: '🎂', rhyme: 'Snake', rhymeEmoji: '🐍' },
  { word: 'Fish', emoji: '🐟', rhyme: 'Dish', rhymeEmoji: '🍽️' },
  { word: 'Bear', emoji: '🐻', rhyme: 'Chair', rhymeEmoji: '🪑' },
  { word: 'Ring', emoji: '💍', rhyme: 'King', rhymeEmoji: '🤴' },
  { word: 'Boat', emoji: '⛵', rhyme: 'Goat', rhymeEmoji: '🐐' },
  { word: 'Fox', emoji: '🦊', rhyme: 'Box', rhymeEmoji: '📦' },
];

const HARD_PAIRS: RhymePair[] = [
  ...MEDIUM_PAIRS,
  { word: 'Train', emoji: '🚂', rhyme: 'Rain', rhymeEmoji: '🌧️' },
  { word: 'Whale', emoji: '🐋', rhyme: 'Snail', rhymeEmoji: '🐌' },
  { word: 'Frog', emoji: '🐸', rhyme: 'Fog', rhymeEmoji: '🌫️' },
  { word: 'Crow', emoji: '🐦‍⬛', rhyme: 'Snow', rhymeEmoji: '❄️' },
  { word: 'Light', emoji: '💡', rhyme: 'Kite', rhymeEmoji: '🪁' },
  { word: 'Clock', emoji: '🕐', rhyme: 'Rock', rhymeEmoji: '🪨' },
];

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { totalLevels: 3, pairsPerLevel: 3, pool: EASY_PAIRS, scoreMultiplier: 1 },
  medium: { totalLevels: 4, pairsPerLevel: 4, pool: MEDIUM_PAIRS, scoreMultiplier: 1.5 },
  hard: { totalLevels: 5, pairsPerLevel: 5, pool: HARD_PAIRS, scoreMultiplier: 2 },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function RhymeTimeGame() {
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

  const { leftWords, rightWords, pairs } = useMemo(() => {
    const picked = shuffle(config.pool).slice(0, config.pairsPerLevel);
    const left = picked.map((p, i) => ({ idx: i, word: p.word, emoji: p.emoji }));
    const right = shuffle(picked.map((p, i) => ({ idx: i, word: p.rhyme, emoji: p.rhymeEmoji })));
    return { leftWords: left, rightWords: right, pairs: picked };
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
      // Correct match
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
    <GameWrapper title="Rhyme Time" onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`min-h-screen bg-gradient-to-br from-green-50 via-lime-50 to-emerald-50 p-3 sm:p-6 ${isRtl ? 'rtl' : 'ltr'}`}>

        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-lg mx-auto">
            <LevelDisplay level={level} isRtl={isRtl} locale={locale} />
            <div className="flex gap-2">
              {streak >= 2 && (
                <span className="bg-lime-100 text-lime-700 px-2 py-1 rounded-full text-xs font-bold">🔥 {streak}</span>
              )}
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-bold">⭐ {score}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-12">
              <span className="text-7xl">🎶</span>
              <h2 className="text-3xl font-bold text-green-800">Rhyme Time</h2>
              <p className="text-green-600 text-center max-w-xs">Match words that rhyme!</p>
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
              <p className="text-center text-sm text-green-600 mb-3">Tap a word on the left, then its rhyme on the right!</p>
              <div className="grid grid-cols-2 gap-4">
                {/* Left column */}
                <div className="flex flex-col gap-2">
                  {leftWords.map(({ idx, word, emoji }) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: matched.has(idx) ? 1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleLeftTap(idx)}
                      className={`py-3 px-3 rounded-xl font-bold text-lg shadow-sm transition-all ${
                        matched.has(idx) ? 'bg-green-200 text-green-500 opacity-60' :
                        selectedLeft === idx ? 'bg-green-400 text-white ring-2 ring-green-600' :
                        'bg-white text-green-800 hover:bg-green-50'
                      }`}
                    >
                      <span className="mr-1">{emoji}</span> {word}
                    </motion.button>
                  ))}
                </div>
                {/* Right column */}
                <div className="flex flex-col gap-2">
                  {rightWords.map(({ idx, word, emoji }) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: matched.has(idx) ? 1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRightTap(idx)}
                      className={`py-3 px-3 rounded-xl font-bold text-lg shadow-sm transition-all ${
                        matched.has(idx) ? 'bg-green-200 text-green-500 opacity-60' :
                        'bg-white text-emerald-800 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="mr-1">{emoji}</span> {word}
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
              <h2 className="text-2xl font-bold text-green-800">Level {level} Complete!</h2>
              <p className="text-green-600">Score: {score}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleNextLevel}
                className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold shadow-md">Next Level →</motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <WinModal isOpen={phase === 'won'} onPlayAgain={handlePlayAgain} score={score} />

        <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)}
          title="Rhyme Time"
          instructions={[
            { icon: '🎵', title: 'Listen for Rhymes', description: 'Words that sound alike at the end are rhymes!' },
            { icon: '👆', title: 'Make a Match', description: 'Tap a word on the left, then its rhyming partner on the right.' },
            { icon: '⭐', title: 'Match All Pairs', description: 'Find all rhyming pairs to complete the level!' },
          ]}
          controls={[
            { icon: '👈', description: 'Tap a word on the left to select it' },
            { icon: '👉', description: 'Then tap the rhyming word on the right' },
          ]}
          tip="Listen to the ending sounds — Cat and Hat both end in '-at'!"
          locale={locale} />
      </div>
    </GameWrapper>
  );
}
