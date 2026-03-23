'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'menu' | 'playing' | 'won';
type GrowthStage = 'seed' | 'sprout' | 'stem' | 'bud' | 'flower';

interface DifficultyConfig {
  waterNeeded: number;
  sunNeeded: number;
  overflowThreshold: number; // if water or sun exceeds this, plant wilts
  scoreMultiplier: number;
  stages: number; // how many flowers to grow
}

const GROWTH_STAGES: { stage: GrowthStage; emoji: string; label: string }[] = [
  { stage: 'seed', emoji: '🫘', label: 'Seed' },
  { stage: 'sprout', emoji: '🌱', label: 'Sprout' },
  { stage: 'stem', emoji: '🌿', label: 'Growing' },
  { stage: 'bud', emoji: '🌷', label: 'Budding' },
  { stage: 'flower', emoji: '🌻', label: 'Flower!' },
];

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { waterNeeded: 3, sunNeeded: 3, overflowThreshold: 6, scoreMultiplier: 1, stages: 3 },
  medium: { waterNeeded: 4, sunNeeded: 4, overflowThreshold: 7, scoreMultiplier: 1.5, stages: 4 },
  hard: { waterNeeded: 5, sunNeeded: 5, overflowThreshold: 8, scoreMultiplier: 2, stages: 5 },
};

export function PlantGrowerGame() {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === 'he';
  const { playClick, playSuccess, playDrop } = useRetroSounds();

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [score, setScore] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [water, setWater] = useState(0);
  const [sun, setSun] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [flowersGrown, setFlowersGrown] = useState(0);
  const [wilted, setWilted] = useState(false);
  const [celebration, setCelebration] = useState(false);

  const config = DIFFICULTY_CONFIG[difficulty];

  // Check growth progress
  useEffect(() => {
    if (phase !== 'playing' || wilted) return;

    // Check for overflow (too much water or sun)
    if (water > config.overflowThreshold || sun > config.overflowThreshold) {
      setWilted(true);
      playDrop();
      setTimeout(() => {
        setWilted(false);
        setWater(0);
        setSun(0);
        setStageIndex(0);
      }, 1500);
      return;
    }

    // Check if we should advance stage
    const progress = Math.min(water, sun);
    const perStage = Math.ceil(config.waterNeeded / 4);
    const expectedStage = Math.min(Math.floor(progress / perStage), 4);

    if (expectedStage > stageIndex) {
      setStageIndex(expectedStage);
      playClick();

      if (expectedStage === 4) {
        // Flower complete!
        setCelebration(true);
        playSuccess();
        const newCount = flowersGrown + 1;
        setFlowersGrown(newCount);
        setScore(prev => prev + Math.round(100 * config.scoreMultiplier));

        setTimeout(() => {
          setCelebration(false);
          if (newCount >= config.stages) {
            setPhase('won');
          } else {
            // Reset for next flower
            setWater(0);
            setSun(0);
            setStageIndex(0);
          }
        }, 1500);
      }
    }
  }, [water, sun, phase, wilted, stageIndex, config, flowersGrown, playClick, playSuccess, playDrop]);

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setPhase('playing');
    setScore(0);
    setWater(0);
    setSun(0);
    setStageIndex(0);
    setFlowersGrown(0);
    setWilted(false);
    playClick();
  }, [playClick]);

  const handleWater = useCallback(() => {
    if (phase !== 'playing' || wilted || celebration) return;
    playClick();
    setWater(prev => prev + 1);
  }, [phase, wilted, celebration, playClick]);

  const handleSun = useCallback(() => {
    if (phase !== 'playing' || wilted || celebration) return;
    playClick();
    setSun(prev => prev + 1);
  }, [phase, wilted, celebration, playClick]);

  const handlePlayAgain = useCallback(() => {
    setPhase('menu');
    setScore(0);
    setWater(0);
    setSun(0);
    setStageIndex(0);
    setFlowersGrown(0);
    setWilted(false);
  }, []);

  usePlayAgainKey(phase === 'won', handlePlayAgain);

  const currentStage = GROWTH_STAGES[stageIndex];
  const waterPercent = Math.min((water / config.waterNeeded) * 100, 100);
  const sunPercent = Math.min((sun / config.sunNeeded) * 100, 100);
  const waterDanger = water > config.overflowThreshold - 2;
  const sunDanger = sun > config.overflowThreshold - 2;

  return (
    <GameWrapper title="Plant Grower" onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 p-3 sm:p-6 ${isRtl ? 'rtl' : 'ltr'}`}>

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-12">
              <span className="text-7xl">🌱</span>
              <h2 className="text-3xl font-bold text-green-800">Plant Grower</h2>
              <p className="text-green-600 text-center max-w-xs">Give water and sunshine to grow beautiful flowers!</p>
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
              {/* Progress indicator */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex gap-1">
                  {Array.from({ length: config.stages }).map((_, i) => (
                    <span key={i} className="text-lg">{i < flowersGrown ? '🌻' : '⚪'}</span>
                  ))}
                </div>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-bold">⭐ {score}</span>
              </div>

              {/* Plant display */}
              <div className="bg-white/80 rounded-2xl p-6 mb-4 text-center shadow-sm relative">
                {wilted ? (
                  <motion.div initial={{ rotateZ: 0 }} animate={{ rotateZ: 30 }}>
                    <span className="text-7xl">🥀</span>
                    <p className="text-red-500 font-bold mt-2">Too much! Plant wilted!</p>
                  </motion.div>
                ) : celebration ? (
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
                    <span className="text-7xl">🌻</span>
                    <p className="text-green-600 font-bold mt-2">Beautiful flower! 🎉</p>
                  </motion.div>
                ) : (
                  <motion.div key={stageIndex} initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                    <span className="text-7xl">{currentStage.emoji}</span>
                    <p className="text-green-700 font-bold mt-2">{currentStage.label}</p>
                  </motion.div>
                )}

                {/* Soil */}
                <div className="mt-3 h-3 bg-amber-700 rounded-full mx-12" />
              </div>

              {/* Status bars */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/60 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">💧 Water</span>
                    <span className={`text-xs font-bold ${waterDanger ? 'text-red-500' : 'text-blue-600'}`}>{water}/{config.waterNeeded}</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${waterDanger ? 'bg-red-400' : 'bg-blue-400'}`}
                      animate={{ width: `${waterPercent}%` }}
                    />
                  </div>
                </div>
                <div className="bg-white/60 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">☀️ Sun</span>
                    <span className={`text-xs font-bold ${sunDanger ? 'text-red-500' : 'text-yellow-600'}`}>{sun}/{config.sunNeeded}</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${sunDanger ? 'bg-red-400' : 'bg-yellow-400'}`}
                      animate={{ width: `${sunPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleWater}
                  disabled={wilted || celebration}
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-400 hover:bg-blue-500 text-white rounded-2xl shadow-lg flex flex-col items-center justify-center disabled:opacity-50"
                >
                  <span className="text-3xl">💧</span>
                  <span className="text-xs font-bold">Water</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSun}
                  disabled={wilted || celebration}
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-2xl shadow-lg flex flex-col items-center justify-center disabled:opacity-50"
                >
                  <span className="text-3xl">☀️</span>
                  <span className="text-xs font-bold">Sunshine</span>
                </motion.button>
              </div>

              <p className="text-center text-xs text-green-500 mt-4">
                ⚠️ Don&apos;t give too much — balance is key!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <WinModal isOpen={phase === 'won'} onPlayAgain={handlePlayAgain} score={score} />

        <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)}
          title="Plant Grower"
          instructions={[
            { icon: '🌱', title: 'Grow Your Plant', description: 'Help the seed grow into a beautiful flower!' },
            { icon: '💧', title: 'Water & Sun', description: 'Tap water and sun buttons to nourish your plant.' },
            { icon: '⚠️', title: 'Balance It', description: 'Too much water or sun will hurt the plant — keep it balanced!' },
          ]}
          controls={[
            { icon: '💧', description: 'Tap for water' },
            { icon: '☀️', description: 'Tap for sunlight' },
          ]}
          tip="Keep water and sunshine balanced — give roughly equal amounts of each!"
          locale={locale} />
      </div>
    </GameWrapper>
  );
}
