'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'menu' | 'playing' | 'levelComplete' | 'won';

interface ClothingItem {
  id: string;
  emoji: string;
  weather: string;
}

interface DifficultyConfig {
  totalLevels: number;
  challengesPerLevel: number;
  correctCount: number;
  distractorCount: number;
  scoreMultiplier: number;
  hintsPerChallenge: number;
  wrongPenalty: number;
}

interface Challenge {
  weatherType: string;
  weatherEmoji: string;
  options: ClothingItem[];
  correctIds: Set<string>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEATHERS = [
  { type: 'sunny', emoji: '☀️' },
  { type: 'rainy', emoji: '🌧️' },
  { type: 'snowy', emoji: '❄️' },
  { type: 'windy', emoji: '💨' },
];

// Each item belongs to ONE weather — unique emojis for clear visual distinction
const CLOTHING: ClothingItem[] = [
  // ☀️ Sunny
  { id: 'sunglasses', emoji: '🕶️', weather: 'sunny' },
  { id: 'sunhat', emoji: '👒', weather: 'sunny' },
  { id: 'shorts', emoji: '🩳', weather: 'sunny' },
  { id: 'tshirt', emoji: '👕', weather: 'sunny' },
  { id: 'sandals', emoji: '🩴', weather: 'sunny' },
  { id: 'sunscreen', emoji: '🧴', weather: 'sunny' },
  // 🌧️ Rainy
  { id: 'umbrella', emoji: '☂️', weather: 'rainy' },
  { id: 'rainboots', emoji: '🥾', weather: 'rainy' },
  { id: 'raincoat', emoji: '🧥', weather: 'rainy' },
  { id: 'wellingtons', emoji: '👢', weather: 'rainy' },
  { id: 'rain_hat', emoji: '🌂', weather: 'rainy' },
  // ❄️ Snowy
  { id: 'scarf', emoji: '🧣', weather: 'snowy' },
  { id: 'gloves', emoji: '🧤', weather: 'snowy' },
  { id: 'winterhat', emoji: '🎩', weather: 'snowy' },
  { id: 'earmuffs', emoji: '🎧', weather: 'snowy' },
  { id: 'hotcocoa', emoji: '☕', weather: 'snowy' },
  { id: 'snowgoggles', emoji: '⛷️', weather: 'snowy' },
  // 💨 Windy
  { id: 'jacket', emoji: '🧶', weather: 'windy' },
  { id: 'cap', emoji: '🧢', weather: 'windy' },
  { id: 'sneakers', emoji: '👟', weather: 'windy' },
  { id: 'longpants', emoji: '👖', weather: 'windy' },
  { id: 'kite', emoji: '🪁', weather: 'windy' },
];

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { totalLevels: 3, challengesPerLevel: 4, correctCount: 2, distractorCount: 2, scoreMultiplier: 1, hintsPerChallenge: 3, wrongPenalty: 0 },
  medium: { totalLevels: 4, challengesPerLevel: 5, correctCount: 3, distractorCount: 3, scoreMultiplier: 1.5, hintsPerChallenge: 2, wrongPenalty: 15 },
  hard: { totalLevels: 5, challengesPerLevel: 6, correctCount: 3, distractorCount: 4, scoreMultiplier: 2, hintsPerChallenge: 1, wrongPenalty: 30 },
};

const ENCOURAGEMENT = {
  correct: {
    en: ['Great job! 🎉', 'Awesome! ⭐', 'You got it! 💪', 'Perfect! 🌟', 'Amazing! 🏆'],
    he: ['כל הכבוד! 🎉', 'מדהים! ⭐', 'נכון! 💪', 'מושלם! 🌟', 'מעולה! 🏆'],
    zh: ['太棒了！🎉', '真厉害！⭐', '答对了！💪', '完美！🌟', '了不起！🏆'],
    es: ['¡Genial! 🎉', '¡Increíble! ⭐', '¡Lo tienes! 💪', '¡Perfecto! 🌟', '¡Asombroso! 🏆'],
  },
  wrong: {
    en: ['Not this one! 🤔', 'Try another! 💭', 'Almost! Keep going! 🌈', 'Hmm, not for this weather 🙃'],
    he: ['לא זה! 🤔', 'נסו אחר! 💭', 'כמעט! המשיכו! 🌈', 'הממ, לא למזג אוויר זה 🙃'],
    zh: ['不是这个！🤔', '试试其他的！💭', '差一点！继续！🌈', '嗯，不适合这种天气 🙃'],
    es: ['¡Este no! 🤔', '¡Prueba otro! 💭', '¡Casi! ¡Sigue así! 🌈', 'Hmm, no para este clima 🙃'],
  },
  allFound: {
    en: ['You dressed up perfectly! 👏', 'Ready to go outside! 🚀', 'Looking great! 🌟'],
    he: ['התלבשתם מושלם! 👏', 'מוכנים לצאת! 🚀', 'נראה נהדר! 🌟'],
    zh: ['穿得太好了！👏', '可以出门了！🚀', '看起来超棒！🌟'],
    es: ['¡Vestido perfecto! 👏', '¡Listo para salir! 🚀', '¡Se ve genial! 🌟'],
  },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// i18n strings
// ---------------------------------------------------------------------------

const WEATHER_LABELS: Record<string, Record<string, string>> = {
  en: { sunny: 'Sunny & Hot', rainy: 'Rainy', snowy: 'Snowy & Cold', windy: 'Windy' },
  he: { sunny: 'שמשי וחם', rainy: 'גשום', snowy: 'שלגי וקר', windy: 'סוער' },
  zh: { sunny: '晴天炎热', rainy: '下雨', snowy: '下雪寒冷', windy: '刮风' },
  es: { sunny: 'Soleado y Caliente', rainy: 'Lluvioso', snowy: 'Nevado y Frío', windy: 'Ventoso' },
};

const CLOTHING_LABELS: Record<string, Record<string, string>> = {
  en: {
    sunglasses: 'Sunglasses', sunhat: 'Sun Hat', shorts: 'Shorts', tshirt: 'T-Shirt', sandals: 'Sandals', sunscreen: 'Sunscreen',
    umbrella: 'Umbrella', rainboots: 'Rain Boots', raincoat: 'Raincoat', wellingtons: 'Boots', rain_hat: 'Rain Hat',
    scarf: 'Scarf', gloves: 'Gloves', winterhat: 'Warm Hat', earmuffs: 'Earmuffs', hotcocoa: 'Hot Cocoa', snowgoggles: 'Ski Goggles',
    jacket: 'Sweater', cap: 'Cap', sneakers: 'Sneakers', longpants: 'Long Pants', kite: 'Kite',
  },
  he: {
    sunglasses: 'משקפי שמש', sunhat: 'כובע שמש', shorts: 'מכנסונים', tshirt: 'חולצת טי', sandals: 'סנדלים', sunscreen: 'קרם הגנה',
    umbrella: 'מטרייה', rainboots: 'מגפי גשם', raincoat: 'מעיל גשם', wellingtons: 'מגפיים', rain_hat: 'כובע גשם',
    scarf: 'צעיף', gloves: 'כפפות', winterhat: 'כובע חם', earmuffs: 'מחממי אוזניים', hotcocoa: 'שוקו חם', snowgoggles: 'משקפי סקי',
    jacket: 'סוודר', cap: 'כובע מצחייה', sneakers: 'נעלי ספורט', longpants: 'מכנסיים ארוכים', kite: 'עפיפון',
  },
  zh: {
    sunglasses: '太阳镜', sunhat: '遮阳帽', shorts: '短裤', tshirt: 'T恤', sandals: '凉鞋', sunscreen: '防晒霜',
    umbrella: '雨伞', rainboots: '雨靴', raincoat: '雨衣', wellingtons: '靴子', rain_hat: '雨帽',
    scarf: '围巾', gloves: '手套', winterhat: '暖帽', earmuffs: '耳罩', hotcocoa: '热可可', snowgoggles: '滑雪镜',
    jacket: '毛衣', cap: '帽子', sneakers: '运动鞋', longpants: '长裤', kite: '风筝',
  },
  es: {
    sunglasses: 'Gafas de Sol', sunhat: 'Sombrero', shorts: 'Pantalones Cortos', tshirt: 'Camiseta', sandals: 'Sandalias', sunscreen: 'Protector Solar',
    umbrella: 'Paraguas', rainboots: 'Botas de Lluvia', raincoat: 'Impermeable', wellingtons: 'Botas', rain_hat: 'Gorro de Lluvia',
    scarf: 'Bufanda', gloves: 'Guantes', winterhat: 'Gorro', earmuffs: 'Orejeras', hotcocoa: 'Chocolate Caliente', snowgoggles: 'Gafas de Esquí',
    jacket: 'Suéter', cap: 'Gorra', sneakers: 'Zapatillas', longpants: 'Pantalones Largos', kite: 'Cometa',
  },
};

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    title: 'Weather Dress-Up',
    description: 'Pick the right clothes for the weather!',
    easy: '😊 Easy', medium: '🤔 Medium', hard: '🔥 Hard',
    todayIs: "Today it's {weather}!",
    findItems: 'Find {found}/{total} items!',
    hint: '💡 Hint',
    noHints: 'No hints left!',
    levelComplete: 'Level {n} Complete!',
    score: 'Score', nextLevel: 'Next Level →',
    dressTheKid: 'Help the kid dress up!',
  },
  he: {
    title: 'הלבשה לפי מזג אוויר',
    description: 'בחרו את הבגדים המתאימים למזג האוויר!',
    easy: '😊 קל', medium: '🤔 בינוני', hard: '🔥 קשה',
    todayIs: 'היום {weather}!',
    findItems: 'מצאו {found}/{total} פריטים!',
    hint: '💡 רמז',
    noHints: 'אין רמזים!',
    levelComplete: 'שלב {n} הושלם!',
    score: 'ניקוד', nextLevel: 'שלב הבא →',
    dressTheKid: 'עזרו לילד/ה להתלבש!',
  },
  zh: {
    title: '天气穿搭',
    description: '为天气选择合适的衣服！',
    easy: '😊 简单', medium: '🤔 中等', hard: '🔥 困难',
    todayIs: '今天是{weather}！',
    findItems: '找到 {found}/{total} 件物品！',
    hint: '💡 提示',
    noHints: '没有提示了！',
    levelComplete: '第{n}关完成！',
    score: '分数', nextLevel: '下一关 →',
    dressTheKid: '帮小朋友穿衣服！',
  },
  es: {
    title: 'Vestirse según el Clima',
    description: '¡Elige la ropa adecuada para el clima!',
    easy: '😊 Fácil', medium: '🤔 Medio', hard: '🔥 Difícil',
    todayIs: '¡Hoy está {weather}!',
    findItems: '¡Encuentra {found}/{total} prendas!',
    hint: '💡 Pista',
    noHints: '¡Sin pistas!',
    levelComplete: '¡Nivel {n} Completado!',
    score: 'Puntos', nextLevel: 'Siguiente Nivel →',
    dressTheKid: '¡Ayuda al niño a vestirse!',
  },
};

const INSTRUCTIONS_DATA: Record<string, { instructions: { icon: string; title: string; description: string }[]; controls: { icon: string; description: string }[]; tip: string }> = {
  en: {
    instructions: [
      { icon: '🌤️', title: 'Check the Weather', description: 'Look at the weather shown on screen — is it sunny, rainy, snowy, or windy?' },
      { icon: '👆', title: 'Tap the Right Clothes', description: 'Tap each clothing item that matches the weather. Green means correct!' },
      { icon: '💡', title: 'Use Hints', description: "Stuck? Tap the hint button to see which item to pick next!" },
      { icon: '🎉', title: 'Complete the Outfit', description: 'Find all the right items to complete each round and level up!' },
    ],
    controls: [
      { icon: '👆', description: 'Tap or click clothing items to select them' },
      { icon: '💡', description: 'Tap the hint button if you need help' },
      { icon: '⌨️', description: 'Use number keys 1-9 to select items' },
    ],
    tip: "Think about what you'd wear if you looked outside and saw this weather!",
  },
  he: {
    instructions: [
      { icon: '🌤️', title: 'בדקו את מזג האוויר', description: 'הסתכלו על מזג האוויר — שמשי, גשום, שלגי או סוער?' },
      { icon: '👆', title: 'הקישו על הבגדים הנכונים', description: 'הקישו על כל פריט לבוש שמתאים למזג האוויר. ירוק = נכון!' },
      { icon: '💡', title: 'השתמשו ברמזים', description: 'תקועים? הקישו על כפתור הרמז כדי לראות מה לבחור!' },
      { icon: '🎉', title: 'השלימו את הלבוש', description: 'מצאו את כל הפריטים הנכונים כדי לעבור שלב!' },
    ],
    controls: [
      { icon: '👆', description: 'הקישו או לחצו על פריטי לבוש לבחירה' },
      { icon: '💡', description: 'הקישו על כפתור הרמז אם צריכים עזרה' },
      { icon: '⌨️', description: 'השתמשו במקשי מספר 1-9 לבחירת פריטים' },
    ],
    tip: 'חשבו מה הייתם לובשים אם הייתם מסתכלים בחוץ ורואים מזג אוויר כזה!',
  },
  zh: {
    instructions: [
      { icon: '🌤️', title: '查看天气', description: '看看屏幕上的天气——晴天、雨天、雪天还是刮风？' },
      { icon: '👆', title: '点击正确的衣服', description: '点击适合天气的每件衣物。绿色表示正确！' },
      { icon: '💡', title: '使用提示', description: '卡住了？点击提示按钮看看该选哪个！' },
      { icon: '🎉', title: '完成穿搭', description: '找到所有正确的物品来完成每一关！' },
    ],
    controls: [
      { icon: '👆', description: '点击衣物来选择它们' },
      { icon: '💡', description: '需要帮助时点击提示按钮' },
      { icon: '⌨️', description: '用数字键1-9选择物品' },
    ],
    tip: '想想如果你看到外面是这种天气，你会穿什么！',
  },
  es: {
    instructions: [
      { icon: '🌤️', title: 'Revisa el Clima', description: '¿Hace sol, llueve, nieva o hay viento?' },
      { icon: '👆', title: 'Toca la Ropa Correcta', description: '¡Toca cada prenda que sea adecuada para el clima. Verde = correcto!' },
      { icon: '💡', title: 'Usa Pistas', description: '¿Atascado? ¡Toca el botón de pista para ver qué elegir!' },
      { icon: '🎉', title: 'Completa el Atuendo', description: '¡Encuentra todos los elementos correctos para completar cada ronda!' },
    ],
    controls: [
      { icon: '👆', description: 'Toca o haz clic en las prendas para seleccionarlas' },
      { icon: '💡', description: 'Toca el botón de pista si necesitas ayuda' },
      { icon: '⌨️', description: 'Usa las teclas numéricas 1-9 para seleccionar' },
    ],
    tip: '¡Piensa en lo que usarías si miraras por la ventana y vieras este clima!',
  },
};

// ---------------------------------------------------------------------------
// Weather animation particles
// ---------------------------------------------------------------------------

function WeatherParticles({ weather }: { weather: string }) {
  const particles = Array.from({ length: 12 }, (_, i) => i);

  if (weather === 'sunny') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.slice(0, 6).map(i => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            initial={{ opacity: 0, y: -20, x: `${15 + i * 15}%` }}
            animate={{
              opacity: [0, 0.8, 0],
              y: ['-5%', '15%'],
              rotate: [0, 20, -10],
            }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
          >
            {i % 2 === 0 ? '✨' : '☀️'}
          </motion.div>
        ))}
      </div>
    );
  }

  if (weather === 'rainy') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(i => (
          <motion.div
            key={i}
            className="absolute text-lg"
            style={{ left: `${5 + i * 8}%` }}
            initial={{ opacity: 0, y: '-10%' }}
            animate={{ opacity: [0, 0.7, 0], y: ['-10%', '110%'] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15, ease: 'linear' }}
          >
            💧
          </motion.div>
        ))}
      </div>
    );
  }

  if (weather === 'snowy') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(i => (
          <motion.div
            key={i}
            className="absolute text-xl"
            style={{ left: `${3 + i * 8}%` }}
            initial={{ opacity: 0, y: '-10%' }}
            animate={{
              opacity: [0, 0.9, 0],
              y: ['-10%', '110%'],
              x: [0, (i % 2 === 0 ? 20 : -20), 0],
            }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }}
          >
            ❄️
          </motion.div>
        ))}
      </div>
    );
  }

  if (weather === 'windy') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.slice(0, 8).map(i => (
          <motion.div
            key={i}
            className="absolute text-xl"
            style={{ top: `${10 + i * 10}%` }}
            initial={{ opacity: 0, x: '-10%' }}
            animate={{ opacity: [0, 0.6, 0], x: ['-10%', '110%'] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3, ease: 'easeIn' }}
          >
            {i % 3 === 0 ? '🍃' : i % 3 === 1 ? '🌬️' : '💨'}
          </motion.div>
        ))}
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Weather background gradient
// ---------------------------------------------------------------------------

function getWeatherBg(weather: string) {
  switch (weather) {
    case 'sunny': return 'from-yellow-100 via-amber-50 to-orange-50';
    case 'rainy': return 'from-slate-200 via-blue-100 to-indigo-100';
    case 'snowy': return 'from-blue-50 via-white to-cyan-50';
    case 'windy': return 'from-teal-50 via-emerald-50 to-cyan-50';
    default: return 'from-cyan-50 via-sky-50 to-blue-50';
  }
}

// ---------------------------------------------------------------------------
// Challenge generation helper (client-side only)
// ---------------------------------------------------------------------------

function generateChallenge(config: DifficultyConfig): Challenge {
  const weather = pickRandom(WEATHERS);
  const correct = shuffle(CLOTHING.filter(c => c.weather === weather.type)).slice(0, config.correctCount);
  const distractors = shuffle(CLOTHING.filter(c => c.weather !== weather.type)).slice(0, config.distractorCount);
  const options = shuffle([...correct, ...distractors]);
  return {
    weatherType: weather.type,
    weatherEmoji: weather.emoji,
    options,
    correctIds: new Set(correct.map(c => c.id)),
  };
}

// ---------------------------------------------------------------------------
// Main Game Component
// ---------------------------------------------------------------------------

export function WeatherDressUpGame() {
  const t = useTranslations();
  const locale = useLocale();
  const strings = UI_STRINGS[locale] || UI_STRINGS.en;
  const weatherLabels = WEATHER_LABELS[locale] || WEATHER_LABELS.en;
  const clothingLabels = CLOTHING_LABELS[locale] || CLOTHING_LABELS.en;
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const { playClick, playSuccess, playDrop, playPowerUp, playLevelUp } = useRetroSounds();

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [streak, setStreak] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [hintedItem, setHintedItem] = useState<string | null>(null);

  // Per-item feedback: track which items have been revealed
  const [foundItems, setFoundItems] = useState<Set<string>>(new Set());
  const [wrongItems, setWrongItems] = useState<Set<string>>(new Set());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [shakeItem, setShakeItem] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  // Challenge state — generated client-side only to avoid SSR hydration mismatch
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [mounted, setMounted] = useState(false);

  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = DIFFICULTY_CONFIG[difficulty];

  // Only generate challenges on the client
  useEffect(() => setMounted(true), []);

  // Generate new challenge when level/challengeIndex changes
  useEffect(() => {
    if (phase === 'playing' && mounted) {
      setChallenge(generateChallenge(config));
      setFoundItems(new Set());
      setWrongItems(new Set());
      setHintedItem(null);
      setFeedbackMsg(null);
      setCelebrating(false);
    }
  }, [phase, level, challengeIndex, config, mounted]);

  // Keyboard support: number keys to select items, H for hint
  useEffect(() => {
    if (phase !== 'playing' || !challenge) return;
    const handler = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= challenge.options.length) {
        const item = challenge.options[num - 1];
        if (item && !foundItems.has(item.id) && !wrongItems.has(item.id)) {
          handleItemTap(item.id);
        }
      }
      if (e.key === 'h' || e.key === 'H') {
        handleHint();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setPhase('playing');
    setLevel(1);
    setScore(0);
    setChallengeIndex(0);
    setStreak(0);
    setHintsLeft(DIFFICULTY_CONFIG[d].hintsPerChallenge);
    playClick();
  }, [playClick]);

  const handleItemTap = useCallback((id: string) => {
    if (!challenge || celebrating) return;
    if (foundItems.has(id) || wrongItems.has(id)) return;

    // Clear any existing feedback timer
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);

    if (challenge.correctIds.has(id)) {
      // CORRECT — item found!
      const newFound = new Set(foundItems);
      newFound.add(id);
      setFoundItems(newFound);
      setStreak(prev => prev + 1);
      setHintedItem(null);

      const streakBonus = streak >= 4 ? 50 : streak >= 2 ? 25 : 0;
      setScore(prev => prev + Math.round((100 + streakBonus) * config.scoreMultiplier));

      const msgs = ENCOURAGEMENT.correct[locale as keyof typeof ENCOURAGEMENT.correct] || ENCOURAGEMENT.correct.en;
      setFeedbackMsg(pickRandom(msgs));
      playSuccess();

      // Check if all items found
      if (newFound.size >= challenge.correctIds.size) {
        setCelebrating(true);
        const allMsgs = ENCOURAGEMENT.allFound[locale as keyof typeof ENCOURAGEMENT.allFound] || ENCOURAGEMENT.allFound.en;
        setFeedbackMsg(pickRandom(allMsgs));
        playPowerUp();

        feedbackTimerRef.current = setTimeout(() => {
          setFeedbackMsg(null);
          setCelebrating(false);
          if (challengeIndex + 1 >= config.challengesPerLevel) {
            if (level >= config.totalLevels) {
              setPhase('won');
            } else {
              setPhase('levelComplete');
            }
          } else {
            setChallengeIndex(prev => prev + 1);
            setHintsLeft(config.hintsPerChallenge);
          }
        }, 1500);
      } else {
        feedbackTimerRef.current = setTimeout(() => setFeedbackMsg(null), 1200);
      }
    } else {
      // WRONG — shake item and show encouragement
      setWrongItems(prev => { const s = new Set(prev); s.add(id); return s; });
      setStreak(0);
      setScore(prev => Math.max(0, prev - config.wrongPenalty));
      setShakeItem(id);
      playDrop();

      const msgs = ENCOURAGEMENT.wrong[locale as keyof typeof ENCOURAGEMENT.wrong] || ENCOURAGEMENT.wrong.en;
      setFeedbackMsg(pickRandom(msgs));

      feedbackTimerRef.current = setTimeout(() => {
        setShakeItem(null);
        setFeedbackMsg(null);
      }, 1200);
    }
  }, [challenge, foundItems, wrongItems, celebrating, streak, config, challengeIndex, level, locale, playSuccess, playDrop, playPowerUp]);

  const handleHint = useCallback(() => {
    if (!challenge || hintsLeft <= 0 || celebrating) return;

    // Find an unrevealed correct item
    const unrevealed = challenge.options.filter(
      item => challenge.correctIds.has(item.id) && !foundItems.has(item.id)
    );
    if (unrevealed.length === 0) return;

    const hintItem = pickRandom(unrevealed);
    setHintedItem(hintItem.id);
    setHintsLeft(prev => prev - 1);
    setScore(prev => Math.max(0, prev - 50));
    playClick();

    // Clear hint after 3 seconds
    setTimeout(() => setHintedItem(null), 3000);
  }, [challenge, hintsLeft, celebrating, foundItems, playClick]);

  const handleNextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setChallengeIndex(0);
    setHintsLeft(config.hintsPerChallenge);
    setPhase('playing');
    playLevelUp();
  }, [playLevelUp, config]);

  const handlePlayAgain = useCallback(() => {
    setPhase('menu');
    setScore(0);
    setLevel(1);
    setChallengeIndex(0);
    setStreak(0);
    setChallenge(null);
  }, []);

  usePlayAgainKey(phase === 'won', handlePlayAgain);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  return (
    <GameWrapper title={strings.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`min-h-screen bg-gradient-to-br ${challenge && phase === 'playing' ? getWeatherBg(challenge.weatherType) : 'from-cyan-50 via-sky-50 to-blue-50'} p-4 sm:p-8 relative transition-colors duration-700`} dir={direction}>

        {/* Weather particles */}
        {phase === 'playing' && challenge && (
          <WeatherParticles weather={challenge.weatherType} />
        )}

        {/* HUD */}
        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-2xl mx-auto relative z-10">
            <LevelDisplay level={level} />
            <div className="flex gap-2 items-center">
              {streak >= 2 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-bold"
                >
                  🔥 {streak}
                </motion.span>
              )}
              <span className="bg-sky-100 text-sky-700 px-3 py-1.5 rounded-full text-base font-bold">⭐ {score}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── MENU ── */}
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-12">
              <motion.span
                className="text-7xl"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👗
              </motion.span>
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

          {/* ── PLAYING ── */}
          {phase === 'playing' && challenge && (
            <motion.div key={`playing-${level}-${challengeIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto relative z-10">

              {/* Weather display */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-4 text-center shadow-sm">
                <motion.span
                  className="text-6xl inline-block"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {challenge.weatherEmoji}
                </motion.span>
                <p className="text-lg font-bold text-sky-800 mt-2">
                  {strings.todayIs.replace('{weather}', weatherLabels[challenge.weatherType] || challenge.weatherType)}
                </p>
                <p className="text-base text-sky-500 font-medium">
                  {strings.findItems
                    .replace('{found}', String(foundItems.size))
                    .replace('{total}', String(challenge.correctIds.size))}
                </p>
              </div>

              {/* Character + found items */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 mb-4 text-center">
                <motion.div
                  className="text-6xl mb-1 inline-block"
                  animate={celebrating ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.6, repeat: celebrating ? Infinity : 0 }}
                >
                  🧒
                </motion.div>
                <div className="flex justify-center gap-2 flex-wrap min-h-[40px]">
                  <AnimatePresence>
                    {[...foundItems].map(id => {
                      const item = CLOTHING.find(c => c.id === id);
                      return item ? (
                        <motion.span
                          key={id}
                          initial={{ scale: 0, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                          className="text-3xl"
                        >
                          {item.emoji}
                        </motion.span>
                      ) : null;
                    })}
                  </AnimatePresence>
                </div>
                {foundItems.size === 0 && (
                  <p className="text-sm text-sky-400 mt-1">{strings.dressTheKid}</p>
                )}
              </div>

              {/* Clothing grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                {challenge.options.map((item, idx) => {
                  const isFound = foundItems.has(item.id);
                  const isWrong = wrongItems.has(item.id);
                  const isHinted = hintedItem === item.id;
                  const isShaking = shakeItem === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      whileHover={!isFound && !isWrong ? { scale: 1.05 } : {}}
                      whileTap={!isFound && !isWrong ? { scale: 0.95 } : {}}
                      animate={
                        isShaking
                          ? { x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.4 } }
                          : isHinted
                          ? { boxShadow: ['0 0 0px #fbbf24', '0 0 20px #fbbf24', '0 0 0px #fbbf24'], transition: { duration: 1, repeat: Infinity } }
                          : {}
                      }
                      onClick={() => handleItemTap(item.id)}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        handleItemTap(item.id);
                      }}
                      disabled={isFound || isWrong || celebrating}
                      className={`py-3 rounded-xl flex flex-col items-center shadow-sm transition-all relative ${
                        isFound
                          ? 'bg-green-100 ring-2 ring-green-400 opacity-80'
                          : isWrong
                          ? 'bg-red-50 ring-2 ring-red-300 opacity-50'
                          : isHinted
                          ? 'bg-yellow-50 ring-2 ring-yellow-400'
                          : 'bg-white hover:bg-sky-50 active:bg-sky-100'
                      }`}
                      aria-label={`${clothingLabels[item.id] || item.id}${isFound ? ' ✓' : ''}`}
                    >
                      <span className="text-3xl sm:text-4xl">{item.emoji}</span>
                      <span className="text-xs sm:text-sm text-sky-700 mt-1 font-medium">{clothingLabels[item.id] || item.id}</span>

                      {/* Keyboard shortcut indicator */}
                      <span className="absolute top-1 left-1 text-[10px] text-sky-300 font-mono">{idx + 1}</span>

                      {/* Status badges */}
                      {isFound && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 text-xl">✅</motion.span>
                      )}
                      {isWrong && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 text-xl">❌</motion.span>
                      )}
                      {isHinted && !isFound && (
                        <motion.span
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="absolute -top-1 -right-1 text-xl"
                        >
                          ✨
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Hint button + progress */}
              <div className="flex justify-between items-center max-w-2xl mx-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleHint}
                  disabled={hintsLeft <= 0 || celebrating}
                  className={`px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all ${
                    hintsLeft > 0
                      ? 'bg-yellow-300 hover:bg-yellow-400 text-yellow-800'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  aria-label={strings.hint}
                >
                  {hintsLeft > 0 ? `${strings.hint} (${hintsLeft})` : strings.noHints}
                </motion.button>

                <p className="text-sm text-sky-400">
                  {challengeIndex + 1} / {config.challengesPerLevel}
                </p>
              </div>

              {/* Feedback message */}
              <AnimatePresence>
                {feedbackMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.8 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
                  >
                    <div className={`px-6 py-3 rounded-2xl font-bold text-lg shadow-lg ${
                      celebrating
                        ? 'bg-green-400 text-white'
                        : feedbackMsg.includes('🤔') || feedbackMsg.includes('💭') || feedbackMsg.includes('🌈') || feedbackMsg.includes('🙃')
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {feedbackMsg}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Celebration overlay */}
              <AnimatePresence>
                {celebrating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
                  >
                    {Array.from({ length: 8 }, (_, i) => (
                      <motion.span
                        key={i}
                        className="absolute text-4xl"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1.5, 0],
                          x: Math.cos((i / 8) * Math.PI * 2) * 120,
                          y: Math.sin((i / 8) * Math.PI * 2) * 120,
                        }}
                        transition={{ duration: 1.2, delay: i * 0.1 }}
                      >
                        {['🎉', '⭐', '🌟', '💫', '🎊', '✨', '🏆', '💪'][i]}
                      </motion.span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── LEVEL COMPLETE ── */}
          {phase === 'levelComplete' && (
            <motion.div key="levelComplete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-16">
              <motion.span
                className="text-7xl"
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: 2 }}
              >
                🌟
              </motion.span>
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
