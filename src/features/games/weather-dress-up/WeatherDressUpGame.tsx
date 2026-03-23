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

interface Weather {
  type: string;
  emoji: string;
  label: string;
}

interface ClothingItem {
  id: string;
  emoji: string;
  label: string;
  weathers: string[]; // which weather types this is good for
}

interface DifficultyConfig {
  totalLevels: number;
  challengesPerLevel: number;
  itemsToChoose: number;
  scoreMultiplier: number;
}

const WEATHERS: Weather[] = [
  { type: 'sunny', emoji: '☀️', label: 'Sunny & Hot' },
  { type: 'rainy', emoji: '🌧️', label: 'Rainy' },
  { type: 'snowy', emoji: '❄️', label: 'Snowy & Cold' },
  { type: 'windy', emoji: '💨', label: 'Windy' },
];

const CLOTHING: ClothingItem[] = [
  { id: 'sunglasses', emoji: '🕶️', label: 'Sunglasses', weathers: ['sunny'] },
  { id: 'sunhat', emoji: '👒', label: 'Sun Hat', weathers: ['sunny'] },
  { id: 'shorts', emoji: '🩳', label: 'Shorts', weathers: ['sunny'] },
  { id: 'tshirt', emoji: '👕', label: 'T-Shirt', weathers: ['sunny'] },
  { id: 'umbrella', emoji: '☂️', label: 'Umbrella', weathers: ['rainy'] },
  { id: 'rainboots', emoji: '🥾', label: 'Rain Boots', weathers: ['rainy'] },
  { id: 'raincoat', emoji: '🧥', label: 'Raincoat', weathers: ['rainy'] },
  { id: 'scarf', emoji: '🧣', label: 'Scarf', weathers: ['snowy', 'windy'] },
  { id: 'gloves', emoji: '🧤', label: 'Gloves', weathers: ['snowy'] },
  { id: 'winterhat', emoji: '🎩', label: 'Warm Hat', weathers: ['snowy', 'windy'] },
  { id: 'wintercoat', emoji: '🧥', label: 'Winter Coat', weathers: ['snowy'] },
  { id: 'jacket', emoji: '🧥', label: 'Jacket', weathers: ['windy', 'rainy'] },
  { id: 'sandals', emoji: '🩴', label: 'Sandals', weathers: ['sunny'] },
  { id: 'boots', emoji: '👢', label: 'Boots', weathers: ['snowy', 'rainy'] },
];

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { totalLevels: 3, challengesPerLevel: 5, itemsToChoose: 2, scoreMultiplier: 1 },
  medium: { totalLevels: 4, challengesPerLevel: 6, itemsToChoose: 3, scoreMultiplier: 1.5 },
  hard: { totalLevels: 5, challengesPerLevel: 7, itemsToChoose: 3, scoreMultiplier: 2 },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function WeatherDressUpGame() {
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
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const config = DIFFICULTY_CONFIG[difficulty];

  // Pick a weather and generate clothing options
  const { weather, options, correctIds } = useMemo(() => {
    const w = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
    const correct = CLOTHING.filter(c => c.weathers.includes(w.type));
    const wrong = CLOTHING.filter(c => !c.weathers.includes(w.type));
    const picked = shuffle(correct).slice(0, config.itemsToChoose);
    const distractors = shuffle(wrong).slice(0, Math.max(2, 6 - config.itemsToChoose));
    const all = shuffle([...picked, ...distractors]);
    return {
      weather: w,
      options: all,
      correctIds: new Set(picked.map(c => c.id)),
    };
  }, [config, level, challengeIndex, phase]);

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setPhase('playing');
    setLevel(1);
    setScore(0);
    setChallengeIndex(0);
    setStreak(0);
    setSelectedItems(new Set());
    playClick();
  }, [playClick]);

  const handleItemTap = useCallback((id: string) => {
    if (feedback) return;
    playClick();
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [feedback, playClick]);

  const handleCheck = useCallback(() => {
    if (feedback || selectedItems.size === 0) return;

    // Check: selected must be exactly correctIds
    const isCorrect =
      selectedItems.size === correctIds.size &&
      [...selectedItems].every(id => correctIds.has(id));

    if (isCorrect) {
      setFeedback('correct');
      const streakBonus = streak >= 3 ? 50 : streak >= 2 ? 25 : 0;
      setScore(prev => prev + Math.round((100 + streakBonus) * config.scoreMultiplier));
      setStreak(prev => prev + 1);
      playSuccess();

      setTimeout(() => {
        setFeedback(null);
        setSelectedItems(new Set());
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
        setSelectedItems(new Set());
      }, 800);
    }
  }, [selectedItems, correctIds, feedback, streak, config, challengeIndex, level, playSuccess, playDrop]);

  const handleNextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setChallengeIndex(0);
    setSelectedItems(new Set());
    setPhase('playing');
    playClick();
  }, [playClick]);

  const handlePlayAgain = useCallback(() => {
    setPhase('menu');
    setScore(0);
    setLevel(1);
    setChallengeIndex(0);
    setSelectedItems(new Set());
    setStreak(0);
  }, []);

  usePlayAgainKey(phase === 'won', handlePlayAgain);

  return (
    <GameWrapper title="Weather Dress-Up" onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 p-3 sm:p-6 ${isRtl ? 'rtl' : 'ltr'}`}>

        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-lg mx-auto">
            <LevelDisplay level={level} isRtl={isRtl} locale={locale} />
            <div className="flex gap-2">
              {streak >= 2 && (
                <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full text-xs font-bold">🔥 {streak}</span>
              )}
              <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded-full text-sm font-bold">⭐ {score}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-12">
              <span className="text-7xl">👗</span>
              <h2 className="text-3xl font-bold text-sky-800">Weather Dress-Up</h2>
              <p className="text-sky-600 text-center max-w-xs">Pick the right clothes for the weather!</p>
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
              {/* Weather display */}
              <div className="bg-white/80 rounded-2xl p-4 mb-4 text-center shadow-sm">
                <span className="text-6xl">{weather.emoji}</span>
                <p className="text-lg font-bold text-sky-800 mt-2">Today is {weather.label}!</p>
                <p className="text-sm text-sky-500">Pick {config.itemsToChoose} items to wear</p>
              </div>

              {/* Character */}
              <div className="bg-white/60 rounded-2xl p-3 mb-4 text-center">
                <div className="text-5xl mb-1">🧒</div>
                <div className="flex justify-center gap-1 flex-wrap">
                  {[...selectedItems].map(id => {
                    const item = CLOTHING.find(c => c.id === id);
                    return item ? <span key={id} className="text-2xl">{item.emoji}</span> : null;
                  })}
                </div>
              </div>

              {/* Clothing options */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {options.map(item => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleItemTap(item.id)}
                    className={`py-3 rounded-xl flex flex-col items-center shadow-sm transition-all ${
                      selectedItems.has(item.id)
                        ? 'bg-sky-200 ring-2 ring-sky-400'
                        : 'bg-white hover:bg-sky-50'
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-[10px] text-sky-600 mt-1">{item.label}</span>
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCheck}
                  disabled={selectedItems.size !== config.itemsToChoose || !!feedback}
                  className="px-6 py-2 rounded-xl bg-sky-500 text-white font-bold shadow-md disabled:opacity-50"
                >
                  ✅ Dress Up!
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
          title="Weather Dress-Up"
          instructions={[
            { icon: '🌤️', title: 'Check the Weather', description: 'Look at the weather shown on screen.' },
            { icon: '👕', title: 'Pick Clothes', description: 'Tap the clothing items that match the weather!' },
            { icon: '✅', title: 'Dress Up', description: 'Select all the right items and hit Check!' },
          ]}
          controls={[
            { icon: '👆', description: 'Tap clothing items to select or deselect' },
            { icon: '✅', description: 'Hit Dress Up when ready' },
          ]}
          tip="Think about what you'd wear in real life for this weather!"
          locale={locale} />
      </div>
    </GameWrapper>
  );
}
