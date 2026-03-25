'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { useRetroSounds } from '@/hooks/useRetroSounds';

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'menu' | 'playing' | 'correct' | 'wrong' | 'levelComplete' | 'won';

interface PuzzleItem {
  id: number;
  emoji: string;
  label: string;
  isOdd: boolean;
}

interface PuzzleRound {
  category: string;
  items: PuzzleItem[];
}

interface DifficultyConfig {
  totalLevels: number;
  roundsPerLevel: number;
  itemCount: number;
  scoreMultiplier: number;
  timeLimit: number; // seconds, 0 = no limit
}

// ────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { totalLevels: 3, roundsPerLevel: 4, itemCount: 4, scoreMultiplier: 1, timeLimit: 0 },
  medium: { totalLevels: 4, roundsPerLevel: 5, itemCount: 4, scoreMultiplier: 2, timeLimit: 0 },
  hard: { totalLevels: 5, roundsPerLevel: 6, itemCount: 5, scoreMultiplier: 3, timeLimit: 15 },
};

const DIFFICULTY_EMOJI: Record<Difficulty, string> = { easy: '🟢', medium: '🟡', hard: '🔴' };

// Puzzle categories with items (group label, matching items, odd items)
interface PuzzleTemplate {
  category: string;
  group: { emoji: string; label: string }[];
  odds: { emoji: string; label: string }[];
}

const EASY_PUZZLES: PuzzleTemplate[] = [
  { category: 'fruits', group: [{ emoji: '🍎', label: 'apple' }, { emoji: '🍌', label: 'banana' }, { emoji: '🍇', label: 'grapes' }, { emoji: '🍊', label: 'orange' }, { emoji: '🍓', label: 'strawberry' }], odds: [{ emoji: '🚗', label: 'car' }, { emoji: '🏠', label: 'house' }, { emoji: '⚽', label: 'ball' }, { emoji: '📚', label: 'book' }] },
  { category: 'animals', group: [{ emoji: '🐶', label: 'dog' }, { emoji: '🐱', label: 'cat' }, { emoji: '🐰', label: 'rabbit' }, { emoji: '🐻', label: 'bear' }, { emoji: '🐸', label: 'frog' }], odds: [{ emoji: '🌳', label: 'tree' }, { emoji: '🌺', label: 'flower' }, { emoji: '☀️', label: 'sun' }, { emoji: '⭐', label: 'star' }] },
  { category: 'vehicles', group: [{ emoji: '🚗', label: 'car' }, { emoji: '🚌', label: 'bus' }, { emoji: '🚀', label: 'rocket' }, { emoji: '✈️', label: 'airplane' }, { emoji: '🚂', label: 'train' }], odds: [{ emoji: '🍕', label: 'pizza' }, { emoji: '🎸', label: 'guitar' }, { emoji: '🐶', label: 'dog' }, { emoji: '🌈', label: 'rainbow' }] },
  { category: 'food', group: [{ emoji: '🍕', label: 'pizza' }, { emoji: '🍔', label: 'hamburger' }, { emoji: '🌮', label: 'taco' }, { emoji: '🍦', label: 'ice cream' }, { emoji: '🎂', label: 'cake' }], odds: [{ emoji: '🎨', label: 'palette' }, { emoji: '🚗', label: 'car' }, { emoji: '📱', label: 'phone' }, { emoji: '🐱', label: 'cat' }] },
];

const MEDIUM_PUZZLES: PuzzleTemplate[] = [
  ...EASY_PUZZLES,
  { category: 'nature', group: [{ emoji: '🌳', label: 'tree' }, { emoji: '🌺', label: 'flower' }, { emoji: '🌵', label: 'cactus' }, { emoji: '🍄', label: 'mushroom' }, { emoji: '🌻', label: 'sunflower' }], odds: [{ emoji: '🎮', label: 'gamepad' }, { emoji: '📺', label: 'tv' }, { emoji: '🔑', label: 'key' }] },
  { category: 'music', group: [{ emoji: '🎸', label: 'guitar' }, { emoji: '🎹', label: 'piano' }, { emoji: '🥁', label: 'drum' }, { emoji: '🎺', label: 'trumpet' }, { emoji: '🎻', label: 'violin' }], odds: [{ emoji: '🏀', label: 'basketball' }, { emoji: '🍎', label: 'apple' }, { emoji: '🐶', label: 'dog' }] },
  { category: 'sports', group: [{ emoji: '⚽', label: 'soccer' }, { emoji: '🏀', label: 'basketball' }, { emoji: '🎾', label: 'tennis' }, { emoji: '⚾', label: 'baseball' }, { emoji: '🏈', label: 'football' }], odds: [{ emoji: '🎂', label: 'cake' }, { emoji: '🌳', label: 'tree' }, { emoji: '📖', label: 'book' }] },
  { category: 'sky', group: [{ emoji: '☀️', label: 'sun' }, { emoji: '🌙', label: 'moon' }, { emoji: '⭐', label: 'star' }, { emoji: '☁️', label: 'cloud' }, { emoji: '🌈', label: 'rainbow' }], odds: [{ emoji: '🐟', label: 'fish' }, { emoji: '🏠', label: 'house' }, { emoji: '🍌', label: 'banana' }] },
];

const HARD_PUZZLES: PuzzleTemplate[] = [
  ...MEDIUM_PUZZLES,
  { category: 'sea', group: [{ emoji: '🐟', label: 'fish' }, { emoji: '🐙', label: 'octopus' }, { emoji: '🦀', label: 'crab' }, { emoji: '🐳', label: 'whale' }, { emoji: '🦈', label: 'shark' }, { emoji: '🐠', label: 'tropical fish' }], odds: [{ emoji: '🦁', label: 'lion' }, { emoji: '🐘', label: 'elephant' }] },
  { category: 'clothes', group: [{ emoji: '👕', label: 'shirt' }, { emoji: '👖', label: 'pants' }, { emoji: '🧢', label: 'cap' }, { emoji: '👟', label: 'shoes' }, { emoji: '🧣', label: 'scarf' }, { emoji: '🧤', label: 'gloves' }], odds: [{ emoji: '🍕', label: 'pizza' }, { emoji: '🔨', label: 'hammer' }] },
  { category: 'tools', group: [{ emoji: '🔨', label: 'hammer' }, { emoji: '🔧', label: 'wrench' }, { emoji: '✂️', label: 'scissors' }, { emoji: '📏', label: 'ruler' }, { emoji: '🖊️', label: 'pen' }], odds: [{ emoji: '🐱', label: 'cat' }, { emoji: '🍎', label: 'apple' }] },
];

// ────────────────────────────────────────────────────────────────────
// Translations
// ────────────────────────────────────────────────────────────────────

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: { title: 'Odd One Out', findOdd: 'Tap the one that doesn\'t belong!', correct: 'Great job! 🎉', wrong: 'Oops! Try again! 🤔', selectDifficulty: 'Choose your level', easy: 'Easy', medium: 'Medium', hard: 'Hard', easyDesc: '4 items, simple groups', mediumDesc: '4 items, more categories', hardDesc: '5 items + timer', score: 'Score', level: 'Level', round: 'Round', timeLeft: 'Time', nextRound: 'Next! ➡️', levelComplete: 'Level Complete! ⭐', category: 'Find the odd one!', streak: 'streak', playAgain: 'Play Again' },
  he: { title: 'מי לא שייך', findOdd: 'הקישו על מי שלא שייך!', correct: '!כל הכבוד 🎉', wrong: '!אופס! נסו שוב 🤔', selectDifficulty: 'בחרו רמת קושי', easy: 'קל', medium: 'בינוני', hard: 'קשה', easyDesc: '4 פריטים, קבוצות פשוטות', mediumDesc: '4 פריטים, עוד קטגוריות', hardDesc: '5 פריטים + טיימר', score: 'ניקוד', level: 'שלב', round: 'סיבוב', timeLeft: 'זמן', nextRound: '!הבא ➡️', levelComplete: '!שלב הושלם ⭐', category: '!מצאו את מי שלא שייך', streak: 'רצף', playAgain: 'שחקו שוב' },
  zh: { title: '找不同', findOdd: '点击不属于这里的那个！', correct: '太棒了！🎉', wrong: '哎呀！再试一次！🤔', selectDifficulty: '选择难度', easy: '简单', medium: '中等', hard: '困难', easyDesc: '4个项目，简单分组', mediumDesc: '4个项目，更多类别', hardDesc: '5个项目+计时器', score: '分数', level: '关卡', round: '回合', timeLeft: '时间', nextRound: '下一个！➡️', levelComplete: '关卡完成！⭐', category: '找出不属于的那个！', streak: '连击', playAgain: '再玩一次' },
  es: { title: '¿Cuál no pertenece?', findOdd: '¡Toca el que no pertenece!', correct: '¡Buen trabajo! 🎉', wrong: '¡Ups! ¡Inténtalo de nuevo! 🤔', selectDifficulty: 'Elige tu nivel', easy: 'Fácil', medium: 'Medio', hard: 'Difícil', easyDesc: '4 objetos, grupos simples', mediumDesc: '4 objetos, más categorías', hardDesc: '5 objetos + temporizador', score: 'Puntos', level: 'Nivel', round: 'Ronda', timeLeft: 'Tiempo', nextRound: '¡Siguiente! ➡️', levelComplete: '¡Nivel completo! ⭐', category: '¡Encuentra el diferente!', streak: 'racha', playAgain: 'Jugar de nuevo' },
};

const ITEM_LABELS: Record<string, Record<string, string>> = {
  en: { apple: 'Apple', banana: 'Banana', grapes: 'Grapes', orange: 'Orange', strawberry: 'Strawberry', car: 'Car', house: 'House', ball: 'Ball', book: 'Book', dog: 'Dog', cat: 'Cat', rabbit: 'Rabbit', bear: 'Bear', frog: 'Frog', tree: 'Tree', flower: 'Flower', sun: 'Sun', star: 'Star', bus: 'Bus', rocket: 'Rocket', airplane: 'Airplane', train: 'Train', pizza: 'Pizza', guitar: 'Guitar', rainbow: 'Rainbow', hamburger: 'Hamburger', taco: 'Taco', 'ice cream': 'Ice Cream', cake: 'Cake', palette: 'Palette', phone: 'Phone', cactus: 'Cactus', mushroom: 'Mushroom', sunflower: 'Sunflower', gamepad: 'Gamepad', tv: 'TV', key: 'Key', piano: 'Piano', drum: 'Drum', trumpet: 'Trumpet', violin: 'Violin', basketball: 'Basketball', soccer: 'Soccer', tennis: 'Tennis', baseball: 'Baseball', football: 'Football', moon: 'Moon', cloud: 'Cloud', fish: 'Fish', octopus: 'Octopus', crab: 'Crab', whale: 'Whale', shark: 'Shark', 'tropical fish': 'Tropical Fish', lion: 'Lion', elephant: 'Elephant', shirt: 'Shirt', pants: 'Pants', cap: 'Cap', shoes: 'Shoes', scarf: 'Scarf', gloves: 'Gloves', hammer: 'Hammer', wrench: 'Wrench', scissors: 'Scissors', ruler: 'Ruler', pen: 'Pen' },
  he: { apple: 'תפוח', banana: 'בננה', grapes: 'ענבים', orange: 'תפוז', strawberry: 'תות', car: 'מכונית', house: 'בית', ball: 'כדור', book: 'ספר', dog: 'כלב', cat: 'חתול', rabbit: 'ארנב', bear: 'דוב', frog: 'צפרדע', tree: 'עץ', flower: 'פרח', sun: 'שמש', star: 'כוכב', bus: 'אוטובוס', rocket: 'רקטה', airplane: 'מטוס', train: 'רכבת', pizza: 'פיצה', guitar: 'גיטרה', rainbow: 'קשת', hamburger: 'המבורגר', taco: 'טאקו', 'ice cream': 'גלידה', cake: 'עוגה', palette: 'פלטה', phone: 'טלפון', cactus: 'קקטוס', mushroom: 'פטריה', sunflower: 'חמנייה', gamepad: 'שלט משחק', tv: 'טלוויזיה', key: 'מפתח', piano: 'פסנתר', drum: 'תוף', trumpet: 'חצוצרה', violin: 'כינור', basketball: 'כדורסל', soccer: 'כדורגל', tennis: 'טניס', baseball: 'בייסבול', football: 'פוטבול', moon: 'ירח', cloud: 'ענן', fish: 'דג', octopus: 'תמנון', crab: 'סרטן', whale: 'לוויתן', shark: 'כריש', 'tropical fish': 'דג טרופי', lion: 'אריה', elephant: 'פיל', shirt: 'חולצה', pants: 'מכנסיים', cap: 'כובע', shoes: 'נעליים', scarf: 'צעיף', gloves: 'כפפות', hammer: 'פטיש', wrench: 'מפתח ברגים', scissors: 'מספריים', ruler: 'סרגל', pen: 'עט' },
  zh: { apple: '苹果', banana: '香蕉', grapes: '葡萄', orange: '橙子', strawberry: '草莓', car: '汽车', house: '房子', ball: '球', book: '书', dog: '狗', cat: '猫', rabbit: '兔子', bear: '熊', frog: '青蛙', tree: '树', flower: '花', sun: '太阳', star: '星星', bus: '公交车', rocket: '火箭', airplane: '飞机', train: '火车', pizza: '披萨', guitar: '吉他', rainbow: '彩虹', hamburger: '汉堡', taco: '塔可', 'ice cream': '冰淇淋', cake: '蛋糕', palette: '调色板', phone: '手机', cactus: '仙人掌', mushroom: '蘑菇', sunflower: '向日葵', gamepad: '游戏手柄', tv: '电视', key: '钥匙', piano: '钢琴', drum: '鼓', trumpet: '小号', violin: '小提琴', basketball: '篮球', soccer: '足球', tennis: '网球', baseball: '棒球', football: '橄榄球', moon: '月亮', cloud: '云', fish: '鱼', octopus: '章鱼', crab: '螃蟹', whale: '鲸鱼', shark: '鲨鱼', 'tropical fish': '热带鱼', lion: '狮子', elephant: '大象', shirt: '衬衫', pants: '裤子', cap: '帽子', shoes: '鞋子', scarf: '围巾', gloves: '手套', hammer: '锤子', wrench: '扳手', scissors: '剪刀', ruler: '尺子', pen: '笔' },
  es: { apple: 'Manzana', banana: 'Plátano', grapes: 'Uvas', orange: 'Naranja', strawberry: 'Fresa', car: 'Coche', house: 'Casa', ball: 'Pelota', book: 'Libro', dog: 'Perro', cat: 'Gato', rabbit: 'Conejo', bear: 'Oso', frog: 'Rana', tree: 'Árbol', flower: 'Flor', sun: 'Sol', star: 'Estrella', bus: 'Autobús', rocket: 'Cohete', airplane: 'Avión', train: 'Tren', pizza: 'Pizza', guitar: 'Guitarra', rainbow: 'Arcoíris', hamburger: 'Hamburguesa', taco: 'Taco', 'ice cream': 'Helado', cake: 'Pastel', palette: 'Paleta', phone: 'Teléfono', cactus: 'Cactus', mushroom: 'Seta', sunflower: 'Girasol', gamepad: 'Mando', tv: 'TV', key: 'Llave', piano: 'Piano', drum: 'Tambor', trumpet: 'Trompeta', violin: 'Violín', basketball: 'Baloncesto', soccer: 'Fútbol', tennis: 'Tenis', baseball: 'Béisbol', football: 'Fútbol americano', moon: 'Luna', cloud: 'Nube', fish: 'Pez', octopus: 'Pulpo', crab: 'Cangrejo', whale: 'Ballena', shark: 'Tiburón', 'tropical fish': 'Pez tropical', lion: 'León', elephant: 'Elefante', shirt: 'Camisa', pants: 'Pantalones', cap: 'Gorra', shoes: 'Zapatos', scarf: 'Bufanda', gloves: 'Guantes', hammer: 'Martillo', wrench: 'Llave inglesa', scissors: 'Tijeras', ruler: 'Regla', pen: 'Bolígrafo' },
};

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  en: { fruits: 'Fruits', animals: 'Animals', vehicles: 'Vehicles', food: 'Food', nature: 'Nature', music: 'Music', sports: 'Sports', sky: 'Sky', sea: 'Sea', clothes: 'Clothes', tools: 'Tools' },
  he: { fruits: 'פירות', animals: 'חיות', vehicles: 'כלי רכב', food: 'אוכל', nature: 'טבע', music: 'מוזיקה', sports: 'ספורט', sky: 'שמיים', sea: 'ים', clothes: 'בגדים', tools: 'כלים' },
  zh: { fruits: '水果', animals: '动物', vehicles: '交通工具', food: '食物', nature: '自然', music: '音乐', sports: '运动', sky: '天空', sea: '海洋', clothes: '衣服', tools: '工具' },
  es: { fruits: 'Frutas', animals: 'Animales', vehicles: 'Vehículos', food: 'Comida', nature: 'Naturaleza', music: 'Música', sports: 'Deportes', sky: 'Cielo', sea: 'Mar', clothes: 'Ropa', tools: 'Herramientas' },
};

const INSTRUCTIONS_DATA: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      { icon: '🔍', title: 'Goal', description: 'Look at the group of items. One of them doesn\'t belong with the others!' },
      { icon: '🧠', title: 'Think', description: 'What do most items have in common? They could all be fruits, animals, or vehicles.' },
      { icon: '👆', title: 'Tap It!', description: 'When you spot the odd one, tap it! The quicker you find it, the more points you earn!' },
    ],
    controls: [
      { icon: '👆', description: 'Tap or click on the item that doesn\'t belong' },
      { icon: '⌨️', description: 'Press 1-5 to select items, Enter to confirm' },
    ],
    tip: 'Look for the one thing that\'s different from all the others. If you see 3 fruits and a car — the car is the odd one out!',
  },
  he: {
    instructions: [
      { icon: '🔍', title: 'מטרה', description: 'הסתכלו על קבוצת הפריטים. אחד מהם לא שייך לשאר!' },
      { icon: '🧠', title: 'חישבו', description: 'מה משותף לרוב הפריטים? הם יכולים להיות כולם פירות, חיות, או כלי רכב.' },
      { icon: '👆', title: '!הקישו', description: 'כשמצאתם את מי שלא שייך, הקישו עליו! ככל שתמצאו מהר יותר, תרוויחו יותר נקודות!' },
    ],
    controls: [
      { icon: '👆', description: 'הקישו על הפריט שלא שייך' },
      { icon: '⌨️', description: 'לחצו 1-5 לבחירת פריט, Enter לאישור' },
    ],
    tip: 'חפשו את הדבר היחיד שונה מכל השאר. אם אתם רואים 3 פירות ומכונית — המכונית היא מי שלא שייך!',
  },
  zh: {
    instructions: [
      { icon: '🔍', title: '目标', description: '看看这组物品。其中一个不属于这里！' },
      { icon: '🧠', title: '想一想', description: '大多数物品有什么共同点？它们可能都是水果、动物或交通工具。' },
      { icon: '👆', title: '点击它！', description: '当你发现不同的那个，点击它！找得越快，得分越多！' },
    ],
    controls: [
      { icon: '👆', description: '点击不属于这里的物品' },
      { icon: '⌨️', description: '按1-5选择物品，Enter确认' },
    ],
    tip: '找出和其他所有东西不同的那一个。如果你看到3个水果和一辆车——车就是不同的那个！',
  },
  es: {
    instructions: [
      { icon: '🔍', title: 'Objetivo', description: '¡Mira el grupo de objetos. Uno de ellos no pertenece!' },
      { icon: '🧠', title: 'Piensa', description: '¿Qué tienen en común la mayoría? Podrían ser frutas, animales o vehículos.' },
      { icon: '👆', title: '¡Tócalo!', description: '¡Cuando encuentres el diferente, tócalo! ¡Cuanto más rápido lo encuentres, más puntos ganarás!' },
    ],
    controls: [
      { icon: '👆', description: 'Toca o haz clic en el objeto que no pertenece' },
      { icon: '⌨️', description: 'Presiona 1-5 para seleccionar, Enter para confirmar' },
    ],
    tip: 'Busca el que es diferente de todos los demás. Si ves 3 frutas y un coche — ¡el coche no pertenece!',
  },
};

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateRound(puzzles: PuzzleTemplate[], itemCount: number): PuzzleRound {
  const template = puzzles[Math.floor(Math.random() * puzzles.length)];
  const groupItems = shuffleArray(template.group).slice(0, itemCount - 1);
  const oddItem = template.odds[Math.floor(Math.random() * template.odds.length)];

  const items: PuzzleItem[] = [
    ...groupItems.map((g, i) => ({ id: i, emoji: g.emoji, label: g.label, isOdd: false })),
    { id: itemCount - 1, emoji: oddItem.emoji, label: oddItem.label, isOdd: true },
  ];

  return { category: template.category, items: shuffleArray(items).map((item, i) => ({ ...item, id: i })) };
}

function getPuzzlesForDifficulty(difficulty: Difficulty): PuzzleTemplate[] {
  switch (difficulty) {
    case 'easy': return EASY_PUZZLES;
    case 'medium': return MEDIUM_PUZZLES;
    case 'hard': return HARD_PUZZLES;
  }
}

// ────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────

export function OddOneOutGame() {
  const locale = useLocale();
  const t = UI_STRINGS[locale] || UI_STRINGS.en;
  const itemLabels = ITEM_LABELS[locale] || ITEM_LABELS.en;
  const catLabels = CATEGORY_LABELS[locale] || CATEGORY_LABELS.en;
  const isRtl = locale === 'he';

  const { playClick, playSuccess, playLevelUp, playGameOver, playHit, playWin, playMatch } = useRetroSounds();

  // State
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('odd-one-out-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [currentRound, setCurrentRound] = useState<PuzzleRound | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showWin, setShowWin] = useState(false);

  const config = DIFFICULTY_CONFIG[difficulty];
  const instrData = INSTRUCTIONS_DATA[locale] || INSTRUCTIONS_DATA.en;

  // Generate a new round
  const startNewRound = useCallback(() => {
    const puzzles = getPuzzlesForDifficulty(difficulty);
    setCurrentRound(generateRound(puzzles, config.itemCount));
    setSelectedId(null);
    setPhase('playing');
    if (config.timeLimit > 0) setTimeLeft(config.timeLimit);
  }, [difficulty, config]);

  // Start game
  const startGame = useCallback((diff: Difficulty) => {
    playClick();
    setDifficulty(diff);
    setLevel(1);
    setRound(1);
    setScore(0);
    setStreak(0);
    setShowWin(false);
    const cfg = DIFFICULTY_CONFIG[diff];
    const puzzles = getPuzzlesForDifficulty(diff);
    setCurrentRound(generateRound(puzzles, cfg.itemCount));
    setSelectedId(null);
    setPhase('playing');
    if (cfg.timeLimit > 0) setTimeLeft(cfg.timeLimit);
  }, [playClick]);

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || config.timeLimit === 0) return;
    if (timeLeft <= 0) {
      setPhase('wrong');
      setStreak(0);
      playHit();
      const timeout = setTimeout(() => startNewRound(), 1500);
      return () => clearTimeout(timeout);
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft, config.timeLimit, startNewRound, playHit]);

  // Handle item tap
  const handleItemTap = useCallback((item: PuzzleItem) => {
    if (phase !== 'playing' || selectedId !== null) return;
    playClick();
    setSelectedId(item.id);

    if (item.isOdd) {
      const points = (10 + streak * 2) * config.scoreMultiplier;
      const newScore = score + points;
      setScore(newScore);
      setStreak((s) => s + 1);
      playMatch();

      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('odd-one-out-highscore', String(newScore));
      }

      setPhase('correct');
      setTimeout(() => {
        const newRound = round + 1;
        if (newRound > config.roundsPerLevel) {
          const newLevel = level + 1;
          if (newLevel > config.totalLevels) {
            playWin();
            setShowWin(true);
            setPhase('won');
          } else {
            playLevelUp();
            setLevel(newLevel);
            setRound(1);
            setPhase('levelComplete');
            setTimeout(() => startNewRound(), 1500);
          }
        } else {
          setRound(newRound);
          startNewRound();
        }
      }, 1200);
    } else {
      setStreak(0);
      playHit();
      setPhase('wrong');
      setTimeout(() => {
        setSelectedId(null);
        setPhase('playing');
      }, 1200);
    }
  }, [phase, selectedId, score, streak, round, level, config, highScore, startNewRound, playClick, playMatch, playHit, playLevelUp, playWin]);

  // Keyboard support
  useEffect(() => {
    if (phase !== 'playing' || !currentRound) return;
    const handleKey = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= currentRound.items.length) {
        handleItemTap(currentRound.items[num - 1]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, currentRound, handleItemTap]);

  const handlePlayAgain = useCallback(() => {
    playClick();
    setPhase('menu');
    setShowWin(false);
  }, [playClick]);

  // ────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────

  return (
    <GameWrapper title={t.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`container mx-auto px-4 py-6 max-w-2xl ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>

        {/* Difficulty Menu */}
        {phase === 'menu' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-white drop-shadow-md">{t.selectDifficulty}</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                <motion.button
                  key={diff}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startGame(diff)}
                  className="px-8 py-4 rounded-2xl text-xl font-bold text-white shadow-lg min-h-[48px] min-w-[48px]
                    bg-gradient-to-b from-white/30 to-white/10 border-2 border-white/40 hover:border-white/60 transition-all"
                >
                  <span className="text-2xl">{DIFFICULTY_EMOJI[diff]}</span>
                  <div>{t[diff]}</div>
                  <div className="text-sm opacity-80">{t[`${diff}Desc` as keyof typeof t]}</div>
                </motion.button>
              ))}
            </div>
            {highScore > 0 && (
              <p className="text-white/80 text-lg">🏆 {t.score}: {highScore}</p>
            )}
          </motion.div>
        )}

        {/* Playing / Correct / Wrong */}
        {(phase === 'playing' || phase === 'correct' || phase === 'wrong') && currentRound && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header stats */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <LevelDisplay level={level} />
              <div className="flex gap-4 text-white font-bold text-lg">
                <span>⭐ {score}</span>
                {streak > 1 && <span className="text-yellow-200">🔥 {streak} {t.streak}</span>}
                <span>{t.round} {round}/{config.roundsPerLevel}</span>
                {config.timeLimit > 0 && (
                  <span className={timeLeft <= 5 ? 'text-red-300 animate-pulse' : ''}>⏱️ {timeLeft}s</span>
                )}
              </div>
            </div>

            {/* Category hint */}
            <motion.p
              key={`cat-${round}-${level}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-xl font-bold text-white drop-shadow-md"
            >
              {t.findOdd}
            </motion.p>

            {/* Items grid */}
            <div className={`grid gap-4 justify-center ${config.itemCount <= 4 ? 'grid-cols-2' : 'grid-cols-3'} max-w-md mx-auto`}>
              {currentRound.items.map((item, idx) => {
                const isSelected = selectedId === item.id;
                const showResult = isSelected && (phase === 'correct' || phase === 'wrong');
                const isCorrectAnswer = item.isOdd && phase === 'correct' && isSelected;
                const isWrongAnswer = !item.isOdd && phase === 'wrong' && isSelected;

                return (
                  <motion.button
                    key={`${item.id}-${round}-${level}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                      opacity: 1,
                      scale: isCorrectAnswer ? [1, 1.2, 1] : isWrongAnswer ? [1, 0.9, 1] : 1,
                    }}
                    transition={{ delay: idx * 0.1, duration: 0.3 }}
                    whileHover={phase === 'playing' ? { scale: 1.08, y: -4 } : {}}
                    whileTap={phase === 'playing' ? { scale: 0.95 } : {}}
                    onClick={() => handleItemTap(item)}
                    disabled={phase !== 'playing'}
                    className={`
                      relative flex flex-col items-center justify-center gap-2 p-4 sm:p-6 rounded-2xl sm:rounded-3xl
                      min-h-[100px] sm:min-h-[130px] min-w-[48px] transition-all cursor-pointer
                      ${showResult && isCorrectAnswer ? 'bg-green-400/90 ring-4 ring-green-300 shadow-lg shadow-green-500/50' : ''}
                      ${showResult && isWrongAnswer ? 'bg-red-400/90 ring-4 ring-red-300 shadow-lg shadow-red-500/50 animate-[shake_0.3s_ease-in-out]' : ''}
                      ${!showResult ? 'bg-white/90 hover:bg-white shadow-lg hover:shadow-xl border-2 border-white/50' : ''}
                    `}
                    aria-label={`${itemLabels[item.label] || item.label}${item.isOdd ? ' (odd one out)' : ''}`}
                  >
                    <span className="text-5xl sm:text-6xl" role="img" aria-hidden="true">{item.emoji}</span>
                    <span className="text-xs sm:text-sm font-medium text-slate-600 truncate max-w-full">
                      {itemLabels[item.label] || item.label}
                    </span>
                    {/* Keyboard hint */}
                    <span className="absolute top-1 left-2 text-xs text-slate-400 font-mono">{idx + 1}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback overlay */}
            <AnimatePresence>
              {phase === 'correct' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <p className="text-2xl font-bold text-white drop-shadow-lg">{t.correct}</p>
                  <p className="text-white/80">
                    {catLabels[currentRound.category] || currentRound.category} ✨
                  </p>
                </motion.div>
              )}
              {phase === 'wrong' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <p className="text-2xl font-bold text-white drop-shadow-lg">{t.wrong}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Level Complete */}
        {phase === 'levelComplete' && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-12">
            <p className="text-5xl">⭐</p>
            <p className="text-3xl font-bold text-white drop-shadow-lg">{t.levelComplete}</p>
            <p className="text-xl text-white/80">{t.score}: {score}</p>
          </motion.div>
        )}
      </div>

      {/* Win Modal */}
      <WinModal isOpen={showWin} onPlayAgain={handlePlayAgain} score={score} />

      {/* Instructions Modal */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={t.title}
        instructions={instrData.instructions}
        controls={instrData.controls}
        tip={instrData.tip}
        locale={locale}
      />
    </GameWrapper>
  );
}
