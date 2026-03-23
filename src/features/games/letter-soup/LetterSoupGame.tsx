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

interface WordChallenge {
  word: string;
  emoji: string;
  letters: string[];
}

interface DifficultyConfig {
  totalLevels: number;
  wordsPerLevel: number;
  pool: WordChallenge[];
  scoreMultiplier: number;
}

const EASY_WORDS: WordChallenge[] = [
  { word: 'CAT', emoji: '🐱', letters: ['C', 'A', 'T'] },
  { word: 'DOG', emoji: '🐶', letters: ['D', 'O', 'G'] },
  { word: 'SUN', emoji: '☀️', letters: ['S', 'U', 'N'] },
  { word: 'BEE', emoji: '🐝', letters: ['B', 'E', 'E'] },
  { word: 'HAT', emoji: '🎩', letters: ['H', 'A', 'T'] },
  { word: 'CUP', emoji: '☕', letters: ['C', 'U', 'P'] },
  { word: 'BUS', emoji: '🚌', letters: ['B', 'U', 'S'] },
  { word: 'PIG', emoji: '🐷', letters: ['P', 'I', 'G'] },
];

const MEDIUM_WORDS: WordChallenge[] = [
  ...EASY_WORDS,
  { word: 'FISH', emoji: '🐟', letters: ['F', 'I', 'S', 'H'] },
  { word: 'FROG', emoji: '🐸', letters: ['F', 'R', 'O', 'G'] },
  { word: 'STAR', emoji: '⭐', letters: ['S', 'T', 'A', 'R'] },
  { word: 'CAKE', emoji: '🎂', letters: ['C', 'A', 'K', 'E'] },
  { word: 'BIRD', emoji: '🐦', letters: ['B', 'I', 'R', 'D'] },
  { word: 'MOON', emoji: '🌙', letters: ['M', 'O', 'O', 'N'] },
  { word: 'TREE', emoji: '🌳', letters: ['T', 'R', 'E', 'E'] },
  { word: 'DUCK', emoji: '🦆', letters: ['D', 'U', 'C', 'K'] },
];

const HARD_WORDS: WordChallenge[] = [
  ...MEDIUM_WORDS,
  { word: 'APPLE', emoji: '🍎', letters: ['A', 'P', 'P', 'L', 'E'] },
  { word: 'HOUSE', emoji: '🏠', letters: ['H', 'O', 'U', 'S', 'E'] },
  { word: 'SNAKE', emoji: '🐍', letters: ['S', 'N', 'A', 'K', 'E'] },
  { word: 'PLANE', emoji: '✈️', letters: ['P', 'L', 'A', 'N', 'E'] },
  { word: 'TIGER', emoji: '🐯', letters: ['T', 'I', 'G', 'E', 'R'] },
  { word: 'WHALE', emoji: '🐋', letters: ['W', 'H', 'A', 'L', 'E'] },
  { word: 'CLOUD', emoji: '☁️', letters: ['C', 'L', 'O', 'U', 'D'] },
  { word: 'HEART', emoji: '❤️', letters: ['H', 'E', 'A', 'R', 'T'] },
];

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { totalLevels: 3, wordsPerLevel: 5, pool: EASY_WORDS, scoreMultiplier: 1 },
  medium: { totalLevels: 4, wordsPerLevel: 6, pool: MEDIUM_WORDS, scoreMultiplier: 1.5 },
  hard: { totalLevels: 5, wordsPerLevel: 7, pool: HARD_WORDS, scoreMultiplier: 2 },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function LetterSoupGame() {
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
  const [typedLetters, setTypedLetters] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const config = DIFFICULTY_CONFIG[difficulty];

  const challenges = useMemo(() => {
    return shuffle(config.pool).slice(0, config.wordsPerLevel);
  }, [config, level, phase]);

  const current = challenges[challengeIndex];

  // Scrambled letters (the word letters + some distractors, shuffled)
  const availableLetters = useMemo(() => {
    if (!current) return [];
    const distractors = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      .filter(l => !current.letters.includes(l));
    const extra = shuffle(distractors).slice(0, Math.min(3, distractors.length));
    return shuffle([...current.letters, ...extra]);
  }, [current]);

  // Track which available letters have been used (by index)
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setPhase('playing');
    setLevel(1);
    setScore(0);
    setChallengeIndex(0);
    setStreak(0);
    setTypedLetters([]);
    setUsedIndices(new Set());
    playClick();
  }, [playClick]);

  const handleLetterTap = useCallback((letter: string, idx: number) => {
    if (feedback || usedIndices.has(idx)) return;
    const nextIdx = typedLetters.length;
    if (!current) return;

    // Only allow correct next letter
    if (letter === current.letters[nextIdx]) {
      playClick();
      const newTyped = [...typedLetters, letter];
      setTypedLetters(newTyped);
      setUsedIndices(prev => { const n = new Set(prev); n.add(idx); return n; });

      if (newTyped.length === current.letters.length) {
        // Word complete!
        setFeedback('correct');
        const streakBonus = streak >= 3 ? 50 : streak >= 2 ? 25 : 0;
        setScore(prev => prev + Math.round((100 + streakBonus) * config.scoreMultiplier));
        setStreak(prev => prev + 1);
        playSuccess();

        setTimeout(() => {
          setFeedback(null);
          setTypedLetters([]);
          setUsedIndices(new Set());
          if (challengeIndex + 1 >= config.wordsPerLevel) {
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
      // Wrong letter
      setFeedback('wrong');
      setStreak(0);
      playDrop();
      setTimeout(() => {
        setFeedback(null);
        setTypedLetters([]);
        setUsedIndices(new Set());
      }, 600);
    }
  }, [feedback, usedIndices, typedLetters, current, streak, config, challengeIndex, level, playClick, playSuccess, playDrop]);

  const handleNextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setChallengeIndex(0);
    setTypedLetters([]);
    setUsedIndices(new Set());
    setPhase('playing');
    playClick();
  }, [playClick]);

  const handlePlayAgain = useCallback(() => {
    setPhase('menu');
    setScore(0);
    setLevel(1);
    setChallengeIndex(0);
    setTypedLetters([]);
    setUsedIndices(new Set());
    setStreak(0);
  }, []);

  usePlayAgainKey(phase === 'won', handlePlayAgain);

  return (
    <GameWrapper title="Letter Soup" onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 p-3 sm:p-6 ${isRtl ? 'rtl' : 'ltr'}`}>

        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-lg mx-auto">
            <LevelDisplay level={level} isRtl={isRtl} locale={locale} />
            <div className="flex gap-2">
              {streak >= 2 && (
                <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-bold">🔥 {streak}</span>
              )}
              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-sm font-bold">⭐ {score}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-12">
              <span className="text-7xl">🔤</span>
              <h2 className="text-3xl font-bold text-rose-800">Letter Soup</h2>
              <p className="text-rose-600 text-center max-w-xs">Spell the word by tapping letters in order!</p>
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

          {phase === 'playing' && current && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
              {/* Picture hint */}
              <div className="bg-white/80 rounded-2xl p-4 mb-4 text-center shadow-sm">
                <span className="text-6xl">{current.emoji}</span>
                <p className="text-sm text-rose-600 mt-2">Spell this word!</p>
              </div>

              {/* Letter slots */}
              <div className="flex justify-center gap-2 mb-4">
                {current.letters.map((l, i) => (
                  <div
                    key={i}
                    className={`w-10 h-12 sm:w-12 sm:h-14 rounded-lg border-2 flex items-center justify-center text-xl font-bold ${
                      typedLetters[i]
                        ? 'bg-rose-100 border-rose-400 text-rose-800'
                        : i === typedLetters.length
                          ? 'bg-white border-dashed border-rose-300 animate-pulse'
                          : 'bg-gray-50 border-gray-200 text-gray-300'
                    }`}
                  >
                    {typedLetters[i] || '_'}
                  </div>
                ))}
              </div>

              {/* Available letters */}
              <div className="bg-white/60 rounded-2xl p-3 mb-4">
                <p className="text-xs text-rose-500 mb-2 text-center">Tap the letters in order:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {availableLetters.map((letter, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: usedIndices.has(idx) ? 1 : 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleLetterTap(letter, idx)}
                      disabled={usedIndices.has(idx)}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl font-bold text-lg shadow-sm transition-all ${
                        usedIndices.has(idx)
                          ? 'bg-gray-200 text-gray-400 opacity-50'
                          : 'bg-white text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      {letter}
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

              <p className="text-center text-xs text-rose-400 mt-3">
                {challengeIndex + 1} / {config.wordsPerLevel}
              </p>
            </motion.div>
          )}

          {phase === 'levelComplete' && (
            <motion.div key="levelComplete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-16">
              <span className="text-7xl">🌟</span>
              <h2 className="text-2xl font-bold text-rose-800">Level {level} Complete!</h2>
              <p className="text-rose-600">Score: {score}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleNextLevel}
                className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-md">Next Level →</motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <WinModal isOpen={phase === 'won'} onPlayAgain={handlePlayAgain} score={score} />

        <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)}
          title="Letter Soup"
          instructions={[
            { icon: '🖼️', title: 'See the Picture', description: 'An emoji shows the word you need to spell.' },
            { icon: '🔤', title: 'Find Letters', description: 'Tap letters from the soup in the correct spelling order.' },
            { icon: '⭐', title: 'Spell It Right', description: 'Get all letters in order to complete each word!' },
          ]}
          controls={[
            { icon: '👆', description: 'Tap letters in order to spell the word' },
            { icon: '↩️', description: 'Tap a placed letter to undo it' },
          ]}
          tip="Say the word out loud and tap the first letter you hear!"
          locale={locale} />
      </div>
    </GameWrapper>
  );
}
