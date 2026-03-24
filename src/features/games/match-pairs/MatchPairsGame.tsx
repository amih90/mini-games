'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
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

// ── Animal + Food pairs ──
const ANIMAL_PAIRS: PairDef[] = [
  { item: 'Dog', itemEmoji: '🐶', match: 'Bone', matchEmoji: '🦴', category: 'food' },
  { item: 'Cat', itemEmoji: '🐱', match: 'Fish', matchEmoji: '🐟', category: 'food' },
  { item: 'Rabbit', itemEmoji: '🐰', match: 'Carrot', matchEmoji: '🥕', category: 'food' },
  { item: 'Monkey', itemEmoji: '🐵', match: 'Banana', matchEmoji: '🍌', category: 'food' },
  { item: 'Bear', itemEmoji: '🐻', match: 'Honey', matchEmoji: '🍯', category: 'food' },
  { item: 'Mouse', itemEmoji: '🐭', match: 'Cheese', matchEmoji: '🧀', category: 'food' },
  { item: 'Panda', itemEmoji: '🐼', match: 'Bamboo', matchEmoji: '🎋', category: 'food' },
  { item: 'Squirrel', itemEmoji: '🐿️', match: 'Acorn', matchEmoji: '🌰', category: 'food' },
  { item: 'Cow', itemEmoji: '🐄', match: 'Grass', matchEmoji: '🌾', category: 'food' },
  { item: 'Pig', itemEmoji: '🐷', match: 'Apple', matchEmoji: '🍎', category: 'food' },
  { item: 'Owl', itemEmoji: '🦉', match: 'Mouse', matchEmoji: '🐭', category: 'food' },
  { item: 'Koala', itemEmoji: '🐨', match: 'Leaf', matchEmoji: '🍃', category: 'food' },
];

// ── Animal + Home pairs ──
const HOME_PAIRS: PairDef[] = [
  { item: 'Bird', itemEmoji: '🐦', match: 'Nest', matchEmoji: '🪺', category: 'home' },
  { item: 'Fish', itemEmoji: '🐟', match: 'Water', matchEmoji: '🌊', category: 'home' },
  { item: 'Spider', itemEmoji: '🕷️', match: 'Web', matchEmoji: '🕸️', category: 'home' },
  { item: 'Bee', itemEmoji: '🐝', match: 'Hive', matchEmoji: '🐝', category: 'home' },
  { item: 'Penguin', itemEmoji: '🐧', match: 'Ice', matchEmoji: '🧊', category: 'home' },
  { item: 'Snail', itemEmoji: '🐌', match: 'Shell', matchEmoji: '🐚', category: 'home' },
  { item: 'Fox', itemEmoji: '🦊', match: 'Den', matchEmoji: '🕳️', category: 'home' },
  { item: 'Ant', itemEmoji: '🐜', match: 'Hill', matchEmoji: '⛰️', category: 'home' },
  { item: 'Bat', itemEmoji: '🦇', match: 'Cave', matchEmoji: '🪨', category: 'home' },
  { item: 'Frog', itemEmoji: '🐸', match: 'Pond', matchEmoji: '🪷', category: 'home' },
  { item: 'Eagle', itemEmoji: '🦅', match: 'Mountain', matchEmoji: '🏔️', category: 'home' },
  { item: 'Horse', itemEmoji: '🐴', match: 'Barn', matchEmoji: '🏠', category: 'home' },
];

// ── Profession + Tool pairs ──
const TOOL_PAIRS: PairDef[] = [
  { item: 'Chef', itemEmoji: '👨‍🍳', match: 'Pan', matchEmoji: '🍳', category: 'tool' },
  { item: 'Doctor', itemEmoji: '👩‍⚕️', match: 'Stethoscope', matchEmoji: '🩺', category: 'tool' },
  { item: 'Artist', itemEmoji: '🧑‍🎨', match: 'Palette', matchEmoji: '🎨', category: 'tool' },
  { item: 'Farmer', itemEmoji: '🧑‍🌾', match: 'Tractor', matchEmoji: '🚜', category: 'tool' },
  { item: 'Astronaut', itemEmoji: '🧑‍🚀', match: 'Rocket', matchEmoji: '🚀', category: 'tool' },
  { item: 'Firefighter', itemEmoji: '🧑‍🚒', match: 'Truck', matchEmoji: '🚒', category: 'tool' },
  { item: 'Teacher', itemEmoji: '🧑‍🏫', match: 'Book', matchEmoji: '📚', category: 'tool' },
  { item: 'Musician', itemEmoji: '🧑‍🎤', match: 'Guitar', matchEmoji: '🎸', category: 'tool' },
  { item: 'Scientist', itemEmoji: '🧑‍🔬', match: 'Microscope', matchEmoji: '🔬', category: 'tool' },
  { item: 'Pilot', itemEmoji: '👨‍✈️', match: 'Airplane', matchEmoji: '✈️', category: 'tool' },
  { item: 'Builder', itemEmoji: '👷', match: 'Hammer', matchEmoji: '🔨', category: 'tool' },
  { item: 'Police', itemEmoji: '👮', match: 'Badge', matchEmoji: '🛡️', category: 'tool' },
];

// ── Baby Animal pairs (who's my baby?) ──
const BABY_PAIRS: PairDef[] = [
  { item: 'Chicken', itemEmoji: '🐔', match: 'Chick', matchEmoji: '🐣', category: 'baby' },
  { item: 'Duck', itemEmoji: '🦆', match: 'Duckling', matchEmoji: '🐥', category: 'baby' },
  { item: 'Dog', itemEmoji: '🐕', match: 'Puppy', matchEmoji: '🐶', category: 'baby' },
  { item: 'Cat', itemEmoji: '🐈', match: 'Kitten', matchEmoji: '🐱', category: 'baby' },
  { item: 'Sheep', itemEmoji: '🐑', match: 'Lamb', matchEmoji: '🐏', category: 'baby' },
  { item: 'Kangaroo', itemEmoji: '🦘', match: 'Joey', matchEmoji: '🦘', category: 'baby' },
  { item: 'Whale', itemEmoji: '🐋', match: 'Calf', matchEmoji: '🐳', category: 'baby' },
  { item: 'Butterfly', itemEmoji: '🦋', match: 'Caterpillar', matchEmoji: '🐛', category: 'baby' },
  { item: 'Frog', itemEmoji: '🐸', match: 'Tadpole', matchEmoji: '🐸', category: 'baby' },
  { item: 'Lion', itemEmoji: '🦁', match: 'Cub', matchEmoji: '🐱', category: 'baby' },
];

// ── Sport + Equipment pairs ──
const SPORT_PAIRS: PairDef[] = [
  { item: 'Soccer', itemEmoji: '⚽', match: 'Goal', matchEmoji: '🥅', category: 'sport' },
  { item: 'Basketball', itemEmoji: '🏀', match: 'Hoop', matchEmoji: '🏀', category: 'sport' },
  { item: 'Tennis', itemEmoji: '🎾', match: 'Racket', matchEmoji: '🏸', category: 'sport' },
  { item: 'Swimming', itemEmoji: '🏊', match: 'Pool', matchEmoji: '🌊', category: 'sport' },
  { item: 'Baseball', itemEmoji: '⚾', match: 'Bat', matchEmoji: '🏏', category: 'sport' },
  { item: 'Skiing', itemEmoji: '⛷️', match: 'Snow', matchEmoji: '❄️', category: 'sport' },
  { item: 'Cycling', itemEmoji: '🚴', match: 'Bicycle', matchEmoji: '🚲', category: 'sport' },
  { item: 'Archery', itemEmoji: '🏹', match: 'Target', matchEmoji: '🎯', category: 'sport' },
  { item: 'Surfing', itemEmoji: '🏄', match: 'Wave', matchEmoji: '🌊', category: 'sport' },
  { item: 'Fencing', itemEmoji: '🤺', match: 'Sword', matchEmoji: '⚔️', category: 'sport' },
];

// ── Weather + What to wear/bring ──
const WEATHER_PAIRS: PairDef[] = [
  { item: 'Rain', itemEmoji: '🌧️', match: 'Umbrella', matchEmoji: '☂️', category: 'weather' },
  { item: 'Sun', itemEmoji: '☀️', match: 'Sunglasses', matchEmoji: '🕶️', category: 'weather' },
  { item: 'Snow', itemEmoji: '🌨️', match: 'Scarf', matchEmoji: '🧣', category: 'weather' },
  { item: 'Wind', itemEmoji: '💨', match: 'Kite', matchEmoji: '🪁', category: 'weather' },
  { item: 'Cold', itemEmoji: '🥶', match: 'Coat', matchEmoji: '🧥', category: 'weather' },
  { item: 'Hot', itemEmoji: '🥵', match: 'Ice Cream', matchEmoji: '🍦', category: 'weather' },
  { item: 'Night', itemEmoji: '🌙', match: 'Flashlight', matchEmoji: '🔦', category: 'weather' },
  { item: 'Storm', itemEmoji: '⛈️', match: 'Boots', matchEmoji: '🥾', category: 'weather' },
];

// ── Vehicle + Where it goes ──
const VEHICLE_PAIRS: PairDef[] = [
  { item: 'Car', itemEmoji: '🚗', match: 'Road', matchEmoji: '🛣️', category: 'vehicle' },
  { item: 'Boat', itemEmoji: '⛵', match: 'Sea', matchEmoji: '🌊', category: 'vehicle' },
  { item: 'Plane', itemEmoji: '✈️', match: 'Sky', matchEmoji: '☁️', category: 'vehicle' },
  { item: 'Train', itemEmoji: '🚂', match: 'Track', matchEmoji: '🛤️', category: 'vehicle' },
  { item: 'Submarine', itemEmoji: '🚢', match: 'Ocean', matchEmoji: '🐙', category: 'vehicle' },
  { item: 'Helicopter', itemEmoji: '🚁', match: 'Helipad', matchEmoji: '🏥', category: 'vehicle' },
  { item: 'Ambulance', itemEmoji: '🚑', match: 'Hospital', matchEmoji: '🏥', category: 'vehicle' },
  { item: 'Bus', itemEmoji: '🚌', match: 'Stop', matchEmoji: '🚏', category: 'vehicle' },
];

// ── Country + Flag pairs ──
const FLAG_PAIRS: PairDef[] = [
  { item: 'USA', itemEmoji: '🗽', match: 'Flag', matchEmoji: '🇺🇸', category: 'flag' },
  { item: 'Japan', itemEmoji: '🗾', match: 'Flag', matchEmoji: '🇯🇵', category: 'flag' },
  { item: 'Brazil', itemEmoji: '🎉', match: 'Flag', matchEmoji: '🇧🇷', category: 'flag' },
  { item: 'France', itemEmoji: '🗼', match: 'Flag', matchEmoji: '🇫🇷', category: 'flag' },
  { item: 'Italy', itemEmoji: '🍕', match: 'Flag', matchEmoji: '🇮🇹', category: 'flag' },
  { item: 'China', itemEmoji: '🏯', match: 'Flag', matchEmoji: '🇨🇳', category: 'flag' },
  { item: 'UK', itemEmoji: '💂', match: 'Flag', matchEmoji: '🇬🇧', category: 'flag' },
  { item: 'Australia', itemEmoji: '🦘', match: 'Flag', matchEmoji: '🇦🇺', category: 'flag' },
  { item: 'Mexico', itemEmoji: '🌮', match: 'Flag', matchEmoji: '🇲🇽', category: 'flag' },
  { item: 'India', itemEmoji: '🕌', match: 'Flag', matchEmoji: '🇮🇳', category: 'flag' },
];

// ── Fruit + Color pairs ──
const FRUIT_PAIRS: PairDef[] = [
  { item: 'Strawberry', itemEmoji: '🍓', match: 'Red', matchEmoji: '🔴', category: 'fruit' },
  { item: 'Blueberry', itemEmoji: '🫐', match: 'Blue', matchEmoji: '🔵', category: 'fruit' },
  { item: 'Lemon', itemEmoji: '🍋', match: 'Yellow', matchEmoji: '🟡', category: 'fruit' },
  { item: 'Orange', itemEmoji: '🍊', match: 'Orange', matchEmoji: '🟠', category: 'fruit' },
  { item: 'Grapes', itemEmoji: '🍇', match: 'Purple', matchEmoji: '🟣', category: 'fruit' },
  { item: 'Lime', itemEmoji: '🍈', match: 'Green', matchEmoji: '🟢', category: 'fruit' },
  { item: 'Coconut', itemEmoji: '🥥', match: 'White', matchEmoji: '⚪', category: 'fruit' },
  { item: 'Blackberry', itemEmoji: '🫐', match: 'Black', matchEmoji: '⚫', category: 'fruit' },
];

// ── Music + Instrument pairs ──
const MUSIC_PAIRS: PairDef[] = [
  { item: 'Orchestra', itemEmoji: '🎼', match: 'Violin', matchEmoji: '🎻', category: 'music' },
  { item: 'Rock', itemEmoji: '🤘', match: 'Guitar', matchEmoji: '🎸', category: 'music' },
  { item: 'Jazz', itemEmoji: '🎷', match: 'Saxophone', matchEmoji: '🎷', category: 'music' },
  { item: 'March', itemEmoji: '🎺', match: 'Trumpet', matchEmoji: '🎺', category: 'music' },
  { item: 'Percussion', itemEmoji: '🥁', match: 'Drums', matchEmoji: '🥁', category: 'music' },
  { item: 'Piano', itemEmoji: '🎹', match: 'Keys', matchEmoji: '🎹', category: 'music' },
];

// ── Space pairs ──
const SPACE_PAIRS: PairDef[] = [
  { item: 'Earth', itemEmoji: '🌍', match: 'Moon', matchEmoji: '🌙', category: 'space' },
  { item: 'Sun', itemEmoji: '☀️', match: 'Star', matchEmoji: '⭐', category: 'space' },
  { item: 'Saturn', itemEmoji: '🪐', match: 'Rings', matchEmoji: '💫', category: 'space' },
  { item: 'Astronaut', itemEmoji: '🧑‍🚀', match: 'Spacesuit', matchEmoji: '👨‍🚀', category: 'space' },
  { item: 'Telescope', itemEmoji: '🔭', match: 'Stars', matchEmoji: '🌟', category: 'space' },
  { item: 'Alien', itemEmoji: '👽', match: 'UFO', matchEmoji: '🛸', category: 'space' },
  { item: 'Comet', itemEmoji: '☄️', match: 'Tail', matchEmoji: '✨', category: 'space' },
  { item: 'Rocket', itemEmoji: '🚀', match: 'Launch', matchEmoji: '🔥', category: 'space' },
];

// ── All pools by difficulty ──
const EASY_POOL = [...ANIMAL_PAIRS, ...BABY_PAIRS, ...FRUIT_PAIRS, ...WEATHER_PAIRS];
const MEDIUM_POOL = [...EASY_POOL, ...HOME_PAIRS, ...SPORT_PAIRS, ...VEHICLE_PAIRS, ...MUSIC_PAIRS];
const HARD_POOL = [...MEDIUM_POOL, ...TOOL_PAIRS, ...FLAG_PAIRS, ...SPACE_PAIRS];

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { totalLevels: 5, pairsPerLevel: 3, pool: EASY_POOL, scoreMultiplier: 1 },
  medium: { totalLevels: 6, pairsPerLevel: 4, pool: MEDIUM_POOL, scoreMultiplier: 1.5 },
  hard: { totalLevels: 8, pairsPerLevel: 5, pool: HARD_POOL, scoreMultiplier: 2 },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Pair history: avoids showing the same pairs repeatedly ──
const HISTORY_KEY = 'match-pairs-history';
const MAX_HISTORY = 60;

function pairKey(p: PairDef): string {
  return `${p.itemEmoji}→${p.matchEmoji}`;
}

function getHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addToHistory(pairs: PairDef[]): void {
  try {
    const history = getHistory();
    const newKeys = pairs.map(pairKey);
    const updated = [...history, ...newKeys].slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch { /* localStorage unavailable */ }
}

function pickFreshPairs(pool: PairDef[], count: number): PairDef[] {
  const history = new Set(getHistory());
  const unseen = pool.filter(p => !history.has(pairKey(p)));
  const seen = pool.filter(p => history.has(pairKey(p)));

  // Prefer unseen, fill with shuffled seen if not enough
  const candidates = [...shuffle(unseen), ...shuffle(seen)];
  return candidates.slice(0, count);
}

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    title: 'Match Pairs',
    description: 'Match pairs: animals, sports, weather, space, and more!',
    easy: '😊 Easy', medium: '🤔 Medium', hard: '🔥 Hard',
    tapInstruction: 'Tap an item on the left, then its match on the right!',
    levelComplete: 'Level {n} Complete!',
    score: 'Score:',
    nextLevel: 'Next Level →',
  },
  he: {
    title: 'התאמת זוגות',
    description: 'התאימו זוגות: חיות, ספורט, מזג אוויר, חלל ועוד!',
    easy: '😊 קל', medium: '🤔 בינוני', hard: '🔥 קשה',
    tapInstruction: 'הקישו על פריט בצד שמאל, ואז על ההתאמה בצד ימין!',
    levelComplete: 'שלב {n} הושלם!',
    score: 'ניקוד:',
    nextLevel: 'שלב הבא →',
  },
  zh: {
    title: '配对游戏',
    description: '配对挑战：动物、运动、天气、太空等等！',
    easy: '😊 简单', medium: '🤔 中等', hard: '🔥 困难',
    tapInstruction: '点击左边的项目，然后点击右边的匹配项！',
    levelComplete: '第{n}关完成！',
    score: '分数：',
    nextLevel: '下一关 →',
  },
  es: {
    title: 'Emparejar',
    description: '¡Empareja: animales, deportes, clima, espacio y más!',
    easy: '😊 Fácil', medium: '🤔 Medio', hard: '🔥 Difícil',
    tapInstruction: '¡Toca un elemento a la izquierda, luego su pareja a la derecha!',
    levelComplete: '¡Nivel {n} Completado!',
    score: 'Puntos:',
    nextLevel: 'Siguiente Nivel →',
  },
};

const INSTRUCTIONS_DATA: Record<string, { instructions: { icon: string; title: string; description: string }[]; controls: { icon: string; description: string }[]; tip: string }> = {
  en: {
    instructions: [
      { icon: '🔗', title: 'Find the Match', description: 'Each item on the left has a partner on the right!' },
      { icon: '🐶', title: 'Think About It', description: 'Dogs eat bones, cats eat fish — match what belongs together.' },
      { icon: '⭐', title: 'Score Points', description: 'Match all pairs to complete the level. Build streaks for bonus points!' },
    ],
    controls: [
      { icon: '👈', description: 'Tap an item on the left to select it' },
      { icon: '👉', description: 'Then tap the matching item on the right' },
    ],
    tip: 'Think about what each animal eats or where it lives!',
  },
  he: {
    instructions: [
      { icon: '🔗', title: 'מצאו את ההתאמה', description: 'לכל פריט בצד שמאל יש שותף בצד ימין!' },
      { icon: '🐶', title: 'חשבו על זה', description: 'כלבים אוכלים עצמות, חתולים אוכלים דגים — התאימו מה שייך ביחד.' },
      { icon: '⭐', title: 'צברו נקודות', description: 'התאימו את כל הזוגות כדי להשלים את השלב. בנו רצפים לנקודות בונוס!' },
    ],
    controls: [
      { icon: '👈', description: 'הקישו על פריט בצד שמאל לבחירה' },
      { icon: '👉', description: 'ואז הקישו על ההתאמה בצד ימין' },
    ],
    tip: 'חשבו מה כל חיה אוכלת או איפה היא גרה!',
  },
  zh: {
    instructions: [
      { icon: '🔗', title: '找到配对', description: '左边的每个项目在右边都有一个搭档！' },
      { icon: '🐶', title: '想一想', description: '狗吃骨头，猫吃鱼 — 配对属于一起的东西。' },
      { icon: '⭐', title: '得分', description: '配对所有对来完成关卡。连续配对获得额外分数！' },
    ],
    controls: [
      { icon: '👈', description: '点击左边的项目选择' },
      { icon: '👉', description: '然后点击右边的匹配项' },
    ],
    tip: '想想每只动物吃什么或住在哪里！',
  },
  es: {
    instructions: [
      { icon: '🔗', title: 'Encuentra la Pareja', description: '¡Cada elemento a la izquierda tiene una pareja a la derecha!' },
      { icon: '🐶', title: 'Piénsalo', description: 'Los perros comen huesos, los gatos comen pescado — empareja lo que va junto.' },
      { icon: '⭐', title: 'Gana Puntos', description: '¡Empareja todos los pares para completar el nivel. ¡Haz rachas para puntos extra!' },
    ],
    controls: [
      { icon: '👈', description: 'Toca un elemento a la izquierda para seleccionarlo' },
      { icon: '👉', description: 'Luego toca el elemento correspondiente a la derecha' },
    ],
    tip: '¡Piensa en lo que come cada animal o dónde vive!',
  },
};

export function MatchPairsGame() {
  const t = useTranslations();
  const locale = useLocale();
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const strings = UI_STRINGS[locale] || UI_STRINGS.en;
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

  // Track which pairs were used this session so we don't repeat within one game
  const sessionUsed = useRef<Set<string>>(new Set());

  const { leftItems, rightItems, pairs } = useMemo(() => {
    const history = new Set(getHistory());
    const usedThisSession = sessionUsed.current;

    // Priority: 1) unseen + not used this session, 2) unseen, 3) not used this session, 4) anything
    const fresh = config.pool.filter(p => !history.has(pairKey(p)) && !usedThisSession.has(pairKey(p)));
    const unseenOnly = config.pool.filter(p => !history.has(pairKey(p)));
    const sessionFresh = config.pool.filter(p => !usedThisSession.has(pairKey(p)));
    const candidates = fresh.length >= config.pairsPerLevel ? shuffle(fresh) :
      unseenOnly.length >= config.pairsPerLevel ? shuffle(unseenOnly) :
      sessionFresh.length >= config.pairsPerLevel ? shuffle(sessionFresh) :
      shuffle(config.pool);

    const picked = candidates.slice(0, config.pairsPerLevel);

    // Record what we picked
    picked.forEach(p => usedThisSession.add(pairKey(p)));
    addToHistory(picked);

    const left = picked.map((p, i) => ({ idx: i, label: p.item, emoji: p.itemEmoji }));
    const right = shuffle(picked.map((p, i) => ({ idx: i, label: p.match, emoji: p.matchEmoji })));
    return { leftItems: left, rightItems: right, pairs: picked };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, level, phase]);

  const handleStart = useCallback((d: Difficulty) => {
    sessionUsed.current = new Set();
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
    <GameWrapper title={strings.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 p-4 sm:p-8" dir={direction}>

        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-2xl mx-auto">
            <LevelDisplay level={level} />
            <div className="flex gap-2">
              {streak >= 2 && (
                <span className="bg-teal-100 text-teal-700 px-3 py-1.5 rounded-full text-sm font-bold">🔥 {streak}</span>
              )}
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-base font-bold">⭐ {score}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-12">
              <span className="text-7xl">🔗</span>
              <h2 className="text-3xl font-bold text-teal-800">{strings.title}</h2>
              <p className="text-teal-600 text-center max-w-xs">{strings.description}</p>
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
              <p className="text-center text-base text-teal-600 mb-3">
                {strings.tapInstruction}
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Left column */}
                <div className="flex flex-col gap-3">
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
                <div className="flex flex-col gap-3">
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
              <h2 className="text-2xl font-bold text-teal-800">{strings.levelComplete.replace('{n}', String(level))}</h2>
              <p className="text-teal-600">{strings.score} {score}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleNextLevel}
                className="px-6 py-3 bg-teal-500 text-white rounded-xl font-bold shadow-md">{strings.nextLevel}</motion.button>
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
