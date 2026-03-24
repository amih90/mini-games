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

const WEATHER_LABELS: Record<string, Record<string, string>> = {
  en: { sunny: 'Sunny & Hot', rainy: 'Rainy', snowy: 'Snowy & Cold', windy: 'Windy' },
  he: { sunny: 'שמשי וחם', rainy: 'גשום', snowy: 'שלגי וקר', windy: 'סוער' },
  zh: { sunny: '晴天炎热', rainy: '下雨', snowy: '下雪寒冷', windy: '刮风' },
  es: { sunny: 'Soleado y Caliente', rainy: 'Lluvioso', snowy: 'Nevado y Frío', windy: 'Ventoso' },
};

const CLOTHING_LABELS: Record<string, Record<string, string>> = {
  en: { sunglasses: 'Sunglasses', sunhat: 'Sun Hat', shorts: 'Shorts', tshirt: 'T-Shirt', umbrella: 'Umbrella', rainboots: 'Rain Boots', raincoat: 'Raincoat', scarf: 'Scarf', gloves: 'Gloves', winterhat: 'Warm Hat', wintercoat: 'Winter Coat', jacket: 'Jacket', sandals: 'Sandals', boots: 'Boots' },
  he: { sunglasses: 'משקפי שמש', sunhat: 'כובע שמש', shorts: 'מכנסונים', tshirt: 'חולצת טי', umbrella: 'מטרייה', rainboots: 'מגפי גשם', raincoat: 'מעיל גשם', scarf: 'צעיף', gloves: 'כפפות', winterhat: 'כובע חם', wintercoat: 'מעיל חורף', jacket: 'ז׳קט', sandals: 'סנדלים', boots: 'מגפיים' },
  zh: { sunglasses: '太阳镜', sunhat: '遮阳帽', shorts: '短裤', tshirt: 'T恤', umbrella: '雨伞', rainboots: '雨靴', raincoat: '雨衣', scarf: '围巾', gloves: '手套', winterhat: '暖帽', wintercoat: '冬衣', jacket: '夹克', sandals: '凉鞋', boots: '靴子' },
  es: { sunglasses: 'Gafas de Sol', sunhat: 'Sombrero', shorts: 'Pantalones Cortos', tshirt: 'Camiseta', umbrella: 'Paraguas', rainboots: 'Botas de Lluvia', raincoat: 'Impermeable', scarf: 'Bufanda', gloves: 'Guantes', winterhat: 'Gorro', wintercoat: 'Abrigo', jacket: 'Chaqueta', sandals: 'Sandalias', boots: 'Botas' },
};

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    title: 'Weather Dress-Up',
    description: 'Pick the right clothes for the weather!',
    easy: '😊 Easy', medium: '🤔 Medium', hard: '🔥 Hard',
    todayIs: 'Today is {weather}!',
    pickItems: 'Pick {n} items to wear',
    dressUp: '✅ Dress Up!',
    levelComplete: 'Level {n} Complete!',
    score: 'Score', nextLevel: 'Next Level →',
  },
  he: {
    title: 'הלבשה לפי מזג אוויר',
    description: 'בחרו את הבגדים המתאימים למזג האוויר!',
    easy: '😊 קל', medium: '🤔 בינוני', hard: '🔥 קשה',
    todayIs: 'היום {weather}!',
    pickItems: 'בחרו {n} פריטים ללבוש',
    dressUp: '✅ התלבשו!',
    levelComplete: 'שלב {n} הושלם!',
    score: 'ניקוד', nextLevel: 'שלב הבא →',
  },
  zh: {
    title: '天气穿搭',
    description: '为天气选择合适的衣服！',
    easy: '😊 简单', medium: '🤔 中等', hard: '🔥 困难',
    todayIs: '今天是{weather}！',
    pickItems: '选择{n}件衣物穿',
    dressUp: '✅ 穿上！',
    levelComplete: '第{n}关完成！',
    score: '分数', nextLevel: '下一关 →',
  },
  es: {
    title: 'Vestirse según el Clima',
    description: '¡Elige la ropa adecuada para el clima!',
    easy: '😊 Fácil', medium: '🤔 Medio', hard: '🔥 Difícil',
    todayIs: '¡Hoy está {weather}!',
    pickItems: 'Elige {n} prendas para usar',
    dressUp: '✅ ¡Vestirse!',
    levelComplete: '¡Nivel {n} Completado!',
    score: 'Puntos', nextLevel: 'Siguiente Nivel →',
  },
};

const INSTRUCTIONS_DATA: Record<string, { instructions: { icon: string; title: string; description: string }[]; controls: { icon: string; description: string }[]; tip: string }> = {
  en: {
    instructions: [
      { icon: '🌤️', title: 'Check the Weather', description: 'Look at the weather shown on screen.' },
      { icon: '👕', title: 'Pick Clothes', description: 'Tap the clothing items that match the weather!' },
      { icon: '✅', title: 'Dress Up', description: 'Select all the right items and hit Check!' },
    ],
    controls: [
      { icon: '👆', description: 'Tap clothing items to select or deselect' },
      { icon: '✅', description: 'Hit Dress Up when ready' },
    ],
    tip: "Think about what you'd wear in real life for this weather!",
  },
  he: {
    instructions: [
      { icon: '🌤️', title: 'בדקו את מזג האוויר', description: 'הסתכלו על מזג האוויר שמוצג על המסך.' },
      { icon: '👕', title: 'בחרו בגדים', description: 'הקישו על פריטי הלבוש המתאימים למזג האוויר!' },
      { icon: '✅', title: 'התלבשו', description: 'בחרו את כל הפריטים הנכונים ולחצו בדיקה!' },
    ],
    controls: [
      { icon: '👆', description: 'הקישו על פריטי לבוש לבחירה או ביטול' },
      { icon: '✅', description: 'לחצו התלבשו כשמוכנים' },
    ],
    tip: 'חשבו מה הייתם לובשים בחיים האמיתיים במזג אוויר כזה!',
  },
  zh: {
    instructions: [
      { icon: '🌤️', title: '查看天气', description: '看屏幕上显示的天气。' },
      { icon: '👕', title: '选择衣服', description: '点击适合天气的衣物！' },
      { icon: '✅', title: '穿上', description: '选择所有正确的物品然后点击检查！' },
    ],
    controls: [
      { icon: '👆', description: '点击衣物选择或取消' },
      { icon: '✅', description: '准备好后点击穿上' },
    ],
    tip: '想想在这种天气下你会穿什么！',
  },
  es: {
    instructions: [
      { icon: '🌤️', title: 'Revisa el Clima', description: 'Mira el clima mostrado en pantalla.' },
      { icon: '👕', title: 'Elige Ropa', description: '¡Toca las prendas que sean adecuadas para el clima!' },
      { icon: '✅', title: 'Vístete', description: '¡Selecciona todos los elementos correctos y presiona Verificar!' },
    ],
    controls: [
      { icon: '👆', description: 'Toca prendas para seleccionar o deseleccionar' },
      { icon: '✅', description: 'Presiona Vestirse cuando estés listo' },
    ],
    tip: '¡Piensa en lo que usarías en la vida real con este clima!',
  },
};

export function WeatherDressUpGame() {
  const t = useTranslations();
  const locale = useLocale();
  const strings = UI_STRINGS[locale] || UI_STRINGS.en;
  const weatherLabels = WEATHER_LABELS[locale] || WEATHER_LABELS.en;
  const clothingLabels = CLOTHING_LABELS[locale] || CLOTHING_LABELS.en;
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
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
    <GameWrapper title={strings.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 p-4 sm:p-8" dir={direction}>

        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-2xl mx-auto">
            <LevelDisplay level={level} />
            <div className="flex gap-2">
              {streak >= 2 && (
                <span className="bg-cyan-100 text-cyan-700 px-3 py-1.5 rounded-full text-sm font-bold">🔥 {streak}</span>
              )}
              <span className="bg-sky-100 text-sky-700 px-3 py-1.5 rounded-full text-base font-bold">⭐ {score}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-12">
              <span className="text-7xl">👗</span>
              <h2 className="text-3xl font-bold text-sky-800">{strings.title}</h2>
              <p className="text-sky-600 text-center max-w-xs">{strings.description}</p>
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
              {/* Weather display */}
              <div className="bg-white/80 rounded-2xl p-4 mb-4 text-center shadow-sm">
                <span className="text-6xl">{weather.emoji}</span>
                <p className="text-lg font-bold text-sky-800 mt-2">{strings.todayIs.replace('{weather}', weatherLabels[weather.type] || weather.label)}</p>
                <p className="text-base text-sky-500">{strings.pickItems.replace('{n}', String(config.itemsToChoose))}</p>
              </div>

              {/* Character */}
              <div className="bg-white/60 rounded-2xl p-3 mb-4 text-center">
                <div className="text-6xl mb-1">🧒</div>
                <div className="flex justify-center gap-1 flex-wrap">
                  {[...selectedItems].map(id => {
                    const item = CLOTHING.find(c => c.id === id);
                    return item ? <span key={id} className="text-3xl">{item.emoji}</span> : null;
                  })}
                </div>
              </div>

              {/* Clothing options */}
              <div className="grid grid-cols-3 gap-3 mb-4">
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
                    <span className="text-3xl">{item.emoji}</span>
                    <span className="text-xs text-sky-600 mt-1">{clothingLabels[item.id] || item.label}</span>
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCheck}
                  disabled={selectedItems.size !== config.itemsToChoose || !!feedback}
                  className="px-8 py-3 rounded-xl bg-sky-500 text-white font-bold text-lg shadow-md disabled:opacity-50"
                >
                  {strings.dressUp}
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

              <p className="text-center text-sm text-sky-400 mt-3">
                {challengeIndex + 1} / {config.challengesPerLevel}
              </p>
            </motion.div>
          )}

          {phase === 'levelComplete' && (
            <motion.div key="levelComplete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-16">
              <span className="text-7xl">🌟</span>
              <h2 className="text-2xl font-bold text-sky-800">{strings.levelComplete.replace('{n}', String(level))}</h2>
              <p className="text-sky-600">{strings.score}: {score}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleNextLevel}
                className="px-6 py-3 bg-sky-500 text-white rounded-xl font-bold shadow-md">{strings.nextLevel}</motion.button>
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
