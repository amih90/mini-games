'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { TextDirection } from '@/i18n/routing';

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

const STAGE_LABELS: Record<string, Record<string, string>> = {
  en: { seed: 'Seed', sprout: 'Sprout', stem: 'Growing', bud: 'Budding', flower: 'Flower!' },
  he: { seed: 'זרע', sprout: 'נבט', stem: 'גדל', bud: 'מלבלב', flower: 'פרח!' },
  zh: { seed: '种子', sprout: '发芽', stem: '生长中', bud: '含苞', flower: '开花！' },
  es: { seed: 'Semilla', sprout: 'Brote', stem: 'Creciendo', bud: 'Capullo', flower: '¡Flor!' },
};

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    title: 'Plant Grower',
    description: 'Give water and sunshine to grow beautiful flowers!',
    easy: '😊 Easy', medium: '🤔 Medium', hard: '🔥 Hard',
    wilted: 'Too much! Plant wilted!',
    flowerDone: 'Beautiful flower! 🎉',
    water: 'Water', sunshine: 'Sunshine',
    warning: "⚠️ Don't give too much — balance is key!",
  },
  he: {
    title: 'מגדל צמחים',
    description: 'תנו מים ושמש כדי לגדל פרחים יפים!',
    easy: '😊 קל', medium: '🤔 בינוני', hard: '🔥 קשה',
    wilted: 'יותר מדי! הצמח נבל!',
    flowerDone: 'פרח יפהפה! 🎉',
    water: 'מים', sunshine: 'שמש',
    warning: '⚠️ אל תתנו יותר מדי — איזון הוא המפתח!',
  },
  zh: {
    title: '种植花朵',
    description: '给水和阳光来种出美丽的花朵！',
    easy: '😊 简单', medium: '🤔 中等', hard: '🔥 困难',
    wilted: '太多了！植物枯萎了！',
    flowerDone: '美丽的花朵！🎉',
    water: '浇水', sunshine: '阳光',
    warning: '⚠️ 不要给太多 — 平衡是关键！',
  },
  es: {
    title: 'Cultivar Plantas',
    description: '¡Da agua y sol para cultivar hermosas flores!',
    easy: '😊 Fácil', medium: '🤔 Medio', hard: '🔥 Difícil',
    wilted: '¡Demasiado! ¡La planta se marchitó!',
    flowerDone: '¡Hermosa flor! 🎉',
    water: 'Agua', sunshine: 'Sol',
    warning: '⚠️ ¡No des demasiado — el equilibrio es la clave!',
  },
};

const INSTRUCTIONS_DATA: Record<string, { instructions: { icon: string; title: string; description: string }[]; controls: { icon: string; description: string }[]; tip: string }> = {
  en: {
    instructions: [
      { icon: '🌱', title: 'Grow Your Plant', description: 'Help the seed grow into a beautiful flower!' },
      { icon: '💧', title: 'Water & Sun', description: 'Tap water and sun buttons to nourish your plant.' },
      { icon: '⚠️', title: 'Balance It', description: 'Too much water or sun will hurt the plant — keep it balanced!' },
    ],
    controls: [
      { icon: '💧', description: 'Tap for water' },
      { icon: '☀️', description: 'Tap for sunlight' },
    ],
    tip: 'Keep water and sunshine balanced — give roughly equal amounts of each!',
  },
  he: {
    instructions: [
      { icon: '🌱', title: 'גדלו את הצמח', description: 'עזרו לזרע לגדול לפרח יפהפה!' },
      { icon: '💧', title: 'מים ושמש', description: 'הקישו על כפתורי מים ושמש להזנת הצמח.' },
      { icon: '⚠️', title: 'שמרו על איזון', description: 'יותר מדי מים או שמש יפגעו בצמח — שמרו על איזון!' },
    ],
    controls: [
      { icon: '💧', description: 'הקישו למים' },
      { icon: '☀️', description: 'הקישו לשמש' },
    ],
    tip: 'שמרו על איזון בין מים לשמש — תנו כמויות שוות בערך!',
  },
  zh: {
    instructions: [
      { icon: '🌱', title: '种植植物', description: '帮助种子长成美丽的花朵！' },
      { icon: '💧', title: '水和阳光', description: '点击水和阳光按钮来滋养植物。' },
      { icon: '⚠️', title: '保持平衡', description: '太多水或阳光会伤害植物 — 保持平衡！' },
    ],
    controls: [
      { icon: '💧', description: '点击浇水' },
      { icon: '☀️', description: '点击给阳光' },
    ],
    tip: '保持水和阳光的平衡 — 给大致相等的量！',
  },
  es: {
    instructions: [
      { icon: '🌱', title: 'Cultiva tu Planta', description: '¡Ayuda a la semilla a crecer en una hermosa flor!' },
      { icon: '💧', title: 'Agua y Sol', description: 'Toca los botones de agua y sol para nutrir tu planta.' },
      { icon: '⚠️', title: 'Equilibra', description: '¡Demasiada agua o sol dañará la planta — mantén el equilibrio!' },
    ],
    controls: [
      { icon: '💧', description: 'Toca para agua' },
      { icon: '☀️', description: 'Toca para sol' },
    ],
    tip: '¡Mantén el agua y el sol equilibrados — da cantidades aproximadamente iguales!',
  },
};

export function PlantGrowerGame() {
  const t = useTranslations();
  const locale = useLocale();
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const strings = UI_STRINGS[locale] || UI_STRINGS.en;
  const stageLabels = STAGE_LABELS[locale] || STAGE_LABELS.en;
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
    <GameWrapper title={strings.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 p-4 sm:p-8" dir={direction}>

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-12">
              <span className="text-7xl">🌱</span>
              <h2 className="text-3xl font-bold text-green-800">{strings.title}</h2>
              <p className="text-green-600 text-center max-w-xs">{strings.description}</p>
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
              {/* Progress indicator */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex gap-1">
                  {Array.from({ length: config.stages }).map((_, i) => (
                    <span key={i} className="text-lg">{i < flowersGrown ? '🌻' : '⚪'}</span>
                  ))}
                </div>
                <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-base font-bold">⭐ {score}</span>
              </div>

              {/* Plant display */}
              <div className="bg-white/80 rounded-2xl p-6 mb-4 text-center shadow-sm relative">
                {wilted ? (
                  <motion.div initial={{ rotateZ: 0 }} animate={{ rotateZ: 30 }}>
                    <span className="text-7xl">🥀</span>
                    <p className="text-red-500 font-bold mt-2">{strings.wilted}</p>
                  </motion.div>
                ) : celebration ? (
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
                    <span className="text-7xl">🌻</span>
                    <p className="text-green-600 font-bold mt-2">{strings.flowerDone}</p>
                  </motion.div>
                ) : (
                  <motion.div key={stageIndex} initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                    <span className="text-7xl">{currentStage.emoji}</span>
                    <p className="text-green-700 font-bold mt-2">{stageLabels[currentStage.stage] || currentStage.label}</p>
                  </motion.div>
                )}

                {/* Soil */}
                <div className="mt-3 h-3 bg-amber-700 rounded-full mx-12" />
              </div>

              {/* Status bars */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/60 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">💧 {strings.water}</span>
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
                    <span className="text-sm">☀️ {strings.sunshine}</span>
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
                  <span className="text-4xl">💧</span>
                  <span className="text-sm font-bold">{strings.water}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSun}
                  disabled={wilted || celebration}
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-2xl shadow-lg flex flex-col items-center justify-center disabled:opacity-50"
                >
                  <span className="text-4xl">☀️</span>
                  <span className="text-sm font-bold">{strings.sunshine}</span>
                </motion.button>
              </div>

              <p className="text-center text-sm text-green-500 mt-4">
                {strings.warning}
              </p>
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
