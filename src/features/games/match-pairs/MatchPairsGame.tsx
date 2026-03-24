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

// ── Localized pair item names ──
const PAIR_NAMES: Record<string, Record<string, string>> = {
  en: {
    Dog:'Dog',Cat:'Cat',Rabbit:'Rabbit',Monkey:'Monkey',Bear:'Bear',Mouse:'Mouse',Panda:'Panda',Squirrel:'Squirrel',Cow:'Cow',Pig:'Pig',Owl:'Owl',Koala:'Koala',
    Bone:'Bone',Fish:'Fish',Carrot:'Carrot',Banana:'Banana',Honey:'Honey',Cheese:'Cheese',Bamboo:'Bamboo',Acorn:'Acorn',Grass:'Grass',Apple:'Apple',Leaf:'Leaf',
    Bird:'Bird',Spider:'Spider',Bee:'Bee',Penguin:'Penguin',Snail:'Snail',Fox:'Fox',Ant:'Ant',Bat:'Bat',Frog:'Frog',Eagle:'Eagle',Horse:'Horse',
    Nest:'Nest',Water:'Water',Web:'Web',Hive:'Hive',Ice:'Ice',Shell:'Shell',Den:'Den',Hill:'Hill',Cave:'Cave',Pond:'Pond',Mountain:'Mountain',Barn:'Barn',
    Chef:'Chef',Doctor:'Doctor',Artist:'Artist',Farmer:'Farmer',Astronaut:'Astronaut',Firefighter:'Firefighter',Teacher:'Teacher',Musician:'Musician',Scientist:'Scientist',Pilot:'Pilot',Builder:'Builder',Police:'Police',
    Pan:'Pan',Stethoscope:'Stethoscope',Palette:'Palette',Tractor:'Tractor',Rocket:'Rocket',Truck:'Truck',Book:'Book',Guitar:'Guitar',Microscope:'Microscope',Airplane:'Airplane',Hammer:'Hammer',Badge:'Badge',
    Chicken:'Chicken',Duck:'Duck',Sheep:'Sheep',Kangaroo:'Kangaroo',Whale:'Whale',Butterfly:'Butterfly',Lion:'Lion',
    Chick:'Chick',Duckling:'Duckling',Puppy:'Puppy',Kitten:'Kitten',Lamb:'Lamb',Joey:'Joey',Calf:'Calf',Caterpillar:'Caterpillar',Tadpole:'Tadpole',Cub:'Cub',
    Soccer:'Soccer',Basketball:'Basketball',Tennis:'Tennis',Swimming:'Swimming',Baseball:'Baseball',Skiing:'Skiing',Cycling:'Cycling',Archery:'Archery',Surfing:'Surfing',Fencing:'Fencing',
    Goal:'Goal',Hoop:'Hoop',Racket:'Racket',Pool:'Pool',Bicycle:'Bicycle',Target:'Target',Wave:'Wave',Sword:'Sword',Snow:'Snow',
    Rain:'Rain',Sun:'Sun',Wind:'Wind',Cold:'Cold',Hot:'Hot',Night:'Night',Storm:'Storm',
    Umbrella:'Umbrella',Sunglasses:'Sunglasses',Scarf:'Scarf',Kite:'Kite',Coat:'Coat','Ice Cream':'Ice Cream',Flashlight:'Flashlight',Boots:'Boots',
    Car:'Car',Boat:'Boat',Plane:'Plane',Train:'Train',Submarine:'Submarine',Helicopter:'Helicopter',Ambulance:'Ambulance',Bus:'Bus',
    Road:'Road',Sea:'Sea',Sky:'Sky',Track:'Track',Ocean:'Ocean',Helipad:'Helipad',Hospital:'Hospital',Stop:'Stop',
    USA:'USA',Japan:'Japan',Brazil:'Brazil',France:'France',Italy:'Italy',China:'China',UK:'UK',Australia:'Australia',Mexico:'Mexico',India:'India',Flag:'Flag',
    Strawberry:'Strawberry',Blueberry:'Blueberry',Lemon:'Lemon',Orange:'Orange',Grapes:'Grapes',Lime:'Lime',Coconut:'Coconut',Blackberry:'Blackberry',
    Red:'Red',Blue:'Blue',Yellow:'Yellow',Purple:'Purple',Green:'Green',White:'White',Black:'Black',
    Orchestra:'Orchestra',Rock:'Rock',Jazz:'Jazz',March:'March',Percussion:'Percussion',Piano:'Piano',
    Violin:'Violin',Saxophone:'Saxophone',Trumpet:'Trumpet',Drums:'Drums',Keys:'Keys',
    Earth:'Earth',Saturn:'Saturn',Telescope:'Telescope',Alien:'Alien',Comet:'Comet',
    Moon:'Moon',Star:'Star',Rings:'Rings',Spacesuit:'Spacesuit',Stars:'Stars',UFO:'UFO',Tail:'Tail',Launch:'Launch',
  },
  he: {
    Dog:'כלב',Cat:'חתול',Rabbit:'ארנב',Monkey:'קוף',Bear:'דוב',Mouse:'עכבר',Panda:'פנדה',Squirrel:'סנאי',Cow:'פרה',Pig:'חזיר',Owl:'ינשוף',Koala:'קואלה',
    Bone:'עצם',Fish:'דג',Carrot:'גזר',Banana:'בננה',Honey:'דבש',Cheese:'גבינה',Bamboo:'במבוק',Acorn:'בלוט',Grass:'דשא',Apple:'תפוח',Leaf:'עלה',
    Bird:'ציפור',Spider:'עכביש',Bee:'דבורה',Penguin:'פינגווין',Snail:'חילזון',Fox:'שועל',Ant:'נמלה',Bat:'עטלף',Frog:'צפרדע',Eagle:'נשר',Horse:'סוס',
    Nest:'קן',Water:'מים',Web:'רשת',Hive:'כוורת',Ice:'קרח',Shell:'צדף',Den:'מאורה',Hill:'גבעה',Cave:'מערה',Pond:'בריכה',Mountain:'הר',Barn:'אורווה',
    Chef:'שף',Doctor:'רופא',Artist:'אמן',Farmer:'חקלאי',Astronaut:'אסטרונאוט',Firefighter:'כבאי',Teacher:'מורה',Musician:'מוזיקאי',Scientist:'מדען',Pilot:'טייס',Builder:'בנאי',Police:'שוטר',
    Pan:'מחבת',Stethoscope:'סטטוסקופ',Palette:'פלטה',Tractor:'טרקטור',Rocket:'רקטה',Truck:'משאית',Book:'ספר',Guitar:'גיטרה',Microscope:'מיקרוסקופ',Airplane:'מטוס',Hammer:'פטיש',Badge:'תג',
    Chicken:'תרנגולת',Duck:'ברווז',Sheep:'כבשה',Kangaroo:'קנגורו',Whale:'לווייתן',Butterfly:'פרפר',Lion:'אריה',
    Chick:'אפרוח',Duckling:'ברווזון',Puppy:'גור',Kitten:'חתלתול',Lamb:'טלה',Joey:'גור קנגורו',Calf:'עגל',Caterpillar:'זחל',Tadpole:'ראשן',Cub:'גור',
    Soccer:'כדורגל',Basketball:'כדורסל',Tennis:'טניס',Swimming:'שחייה',Baseball:'בייסבול',Skiing:'סקי',Cycling:'רכיבה',Archery:'קשתות',Surfing:'גלישה',Fencing:'סיוף',
    Goal:'שער',Hoop:'סל',Racket:'מחבט',Pool:'בריכה',Bicycle:'אופניים',Target:'מטרה',Wave:'גל',Sword:'חרב',Snow:'שלג',
    Rain:'גשם',Sun:'שמש',Wind:'רוח',Cold:'קור',Hot:'חום',Night:'לילה',Storm:'סערה',
    Umbrella:'מטרייה',Sunglasses:'משקפי שמש',Scarf:'צעיף',Kite:'עפיפון',Coat:'מעיל','Ice Cream':'גלידה',Flashlight:'פנס',Boots:'מגפיים',
    Car:'מכונית',Boat:'סירה',Plane:'מטוס',Train:'רכבת',Submarine:'צוללת',Helicopter:'מסוק',Ambulance:'אמבולנס',Bus:'אוטובוס',
    Road:'כביש',Sea:'ים',Sky:'שמיים',Track:'מסילה',Ocean:'אוקיינוס',Helipad:'מנחת',Hospital:'בית חולים',Stop:'תחנה',
    USA:'ארה"ב',Japan:'יפן',Brazil:'ברזיל',France:'צרפת',Italy:'איטליה',China:'סין',UK:'בריטניה',Australia:'אוסטרליה',Mexico:'מקסיקו',India:'הודו',Flag:'דגל',
    Strawberry:'תות',Blueberry:'אוכמנית',Lemon:'לימון',Orange:'תפוז',Grapes:'ענבים',Lime:'ליים',Coconut:'קוקוס',Blackberry:'אוכמנית',
    Red:'אדום',Blue:'כחול',Yellow:'צהוב',Purple:'סגול',Green:'ירוק',White:'לבן',Black:'שחור',
    Orchestra:'תזמורת',Rock:'רוק',Jazz:'ג\'אז',March:'מצעד',Percussion:'כלי הקשה',Piano:'פסנתר',
    Violin:'כינור',Saxophone:'סקסופון',Trumpet:'חצוצרה',Drums:'תופים',Keys:'קלידים',
    Earth:'כדור הארץ',Saturn:'שבתאי',Telescope:'טלסקופ',Alien:'חייזר',Comet:'שביט',
    Moon:'ירח',Star:'כוכב',Rings:'טבעות',Spacesuit:'חליפת חלל',Stars:'כוכבים',UFO:'עב"ם',Tail:'זנב',Launch:'שיגור',
  },
  zh: {
    Dog:'狗',Cat:'猫',Rabbit:'兔子',Monkey:'猴子',Bear:'熊',Mouse:'老鼠',Panda:'熊猫',Squirrel:'松鼠',Cow:'牛',Pig:'猪',Owl:'猫头鹰',Koala:'考拉',
    Bone:'骨头',Fish:'鱼',Carrot:'胡萝卜',Banana:'香蕉',Honey:'蜂蜜',Cheese:'奶酪',Bamboo:'竹子',Acorn:'橡子',Grass:'草',Apple:'苹果',Leaf:'叶子',
    Bird:'鸟',Spider:'蜘蛛',Bee:'蜜蜂',Penguin:'企鹅',Snail:'蜗牛',Fox:'狐狸',Ant:'蚂蚁',Bat:'蝙蝠',Frog:'青蛙',Eagle:'老鹰',Horse:'马',
    Nest:'巢',Water:'水',Web:'网',Hive:'蜂巢',Ice:'冰',Shell:'壳',Den:'洞穴',Hill:'山丘',Cave:'洞',Pond:'池塘',Mountain:'山',Barn:'马棚',
    Chef:'厨师',Doctor:'医生',Artist:'画家',Farmer:'农民',Astronaut:'宇航员',Firefighter:'消防员',Teacher:'老师',Musician:'音乐家',Scientist:'科学家',Pilot:'飞行员',Builder:'建筑工',Police:'警察',
    Pan:'锅',Stethoscope:'听诊器',Palette:'调色板',Tractor:'拖拉机',Rocket:'火箭',Truck:'消防车',Book:'书',Guitar:'吉他',Microscope:'显微镜',Airplane:'飞机',Hammer:'锤子',Badge:'徽章',
    Chicken:'母鸡',Duck:'鸭子',Sheep:'绵羊',Kangaroo:'袋鼠',Whale:'鲸鱼',Butterfly:'蝴蝶',Lion:'狮子',
    Chick:'小鸡',Duckling:'小鸭',Puppy:'小狗',Kitten:'小猫',Lamb:'小羊',Joey:'小袋鼠',Calf:'小牛',Caterpillar:'毛毛虫',Tadpole:'蝌蚪',Cub:'幼崽',
    Soccer:'足球',Basketball:'篮球',Tennis:'网球',Swimming:'游泳',Baseball:'棒球',Skiing:'滑雪',Cycling:'骑车',Archery:'射箭',Surfing:'冲浪',Fencing:'击剑',
    Goal:'球门',Hoop:'篮筐',Racket:'球拍',Pool:'泳池',Bicycle:'自行车',Target:'靶',Wave:'浪',Sword:'剑',Snow:'雪',
    Rain:'雨',Sun:'太阳',Wind:'风',Cold:'冷',Hot:'热',Night:'夜晚',Storm:'暴风',
    Umbrella:'雨伞',Sunglasses:'太阳镜',Scarf:'围巾',Kite:'风筝',Coat:'外套','Ice Cream':'冰淇淋',Flashlight:'手电筒',Boots:'靴子',
    Car:'汽车',Boat:'船',Plane:'飞机',Train:'火车',Submarine:'潜艇',Helicopter:'直升机',Ambulance:'救护车',Bus:'公交车',
    Road:'公路',Sea:'海',Sky:'天空',Track:'铁轨',Ocean:'海洋',Helipad:'停机坪',Hospital:'医院',Stop:'站台',
    USA:'美国',Japan:'日本',Brazil:'巴西',France:'法国',Italy:'意大利',China:'中国',UK:'英国',Australia:'澳大利亚',Mexico:'墨西哥',India:'印度',Flag:'国旗',
    Strawberry:'草莓',Blueberry:'蓝莓',Lemon:'柠檬',Orange:'橙子',Grapes:'葡萄',Lime:'青柠',Coconut:'椰子',Blackberry:'黑莓',
    Red:'红',Blue:'蓝',Yellow:'黄',Purple:'紫',Green:'绿',White:'白',Black:'黑',
    Orchestra:'管弦乐',Rock:'摇滚',Jazz:'爵士',March:'进行曲',Percussion:'打击乐',Piano:'钢琴',
    Violin:'小提琴',Saxophone:'萨克斯',Trumpet:'小号',Drums:'鼓',Keys:'琴键',
    Earth:'地球',Saturn:'土星',Telescope:'望远镜',Alien:'外星人',Comet:'彗星',
    Moon:'月亮',Star:'星星',Rings:'星环',Spacesuit:'太空服',Stars:'星星',UFO:'飞碟',Tail:'尾巴',Launch:'发射',
  },
  es: {
    Dog:'Perro',Cat:'Gato',Rabbit:'Conejo',Monkey:'Mono',Bear:'Oso',Mouse:'Ratón',Panda:'Panda',Squirrel:'Ardilla',Cow:'Vaca',Pig:'Cerdo',Owl:'Búho',Koala:'Koala',
    Bone:'Hueso',Fish:'Pez',Carrot:'Zanahoria',Banana:'Plátano',Honey:'Miel',Cheese:'Queso',Bamboo:'Bambú',Acorn:'Bellota',Grass:'Hierba',Apple:'Manzana',Leaf:'Hoja',
    Bird:'Pájaro',Spider:'Araña',Bee:'Abeja',Penguin:'Pingüino',Snail:'Caracol',Fox:'Zorro',Ant:'Hormiga',Bat:'Murciélago',Frog:'Rana',Eagle:'Águila',Horse:'Caballo',
    Nest:'Nido',Water:'Agua',Web:'Telaraña',Hive:'Colmena',Ice:'Hielo',Shell:'Concha',Den:'Madriguera',Hill:'Colina',Cave:'Cueva',Pond:'Estanque',Mountain:'Montaña',Barn:'Establo',
    Chef:'Chef',Doctor:'Doctor',Artist:'Artista',Farmer:'Granjero',Astronaut:'Astronauta',Firefighter:'Bombero',Teacher:'Maestro',Musician:'Músico',Scientist:'Científico',Pilot:'Piloto',Builder:'Constructor',Police:'Policía',
    Pan:'Sartén',Stethoscope:'Estetoscopio',Palette:'Paleta',Tractor:'Tractor',Rocket:'Cohete',Truck:'Camión',Book:'Libro',Guitar:'Guitarra',Microscope:'Microscopio',Airplane:'Avión',Hammer:'Martillo',Badge:'Placa',
    Chicken:'Gallina',Duck:'Pato',Sheep:'Oveja',Kangaroo:'Canguro',Whale:'Ballena',Butterfly:'Mariposa',Lion:'León',
    Chick:'Pollito',Duckling:'Patito',Puppy:'Cachorro',Kitten:'Gatito',Lamb:'Cordero',Joey:'Cría',Calf:'Ternero',Caterpillar:'Oruga',Tadpole:'Renacuajo',Cub:'Cachorro',
    Soccer:'Fútbol',Basketball:'Baloncesto',Tennis:'Tenis',Swimming:'Natación',Baseball:'Béisbol',Skiing:'Esquí',Cycling:'Ciclismo',Archery:'Tiro con arco',Surfing:'Surf',Fencing:'Esgrima',
    Goal:'Portería',Hoop:'Aro',Racket:'Raqueta',Pool:'Piscina',Bicycle:'Bicicleta',Target:'Diana',Wave:'Ola',Sword:'Espada',Snow:'Nieve',
    Rain:'Lluvia',Sun:'Sol',Wind:'Viento',Cold:'Frío',Hot:'Calor',Night:'Noche',Storm:'Tormenta',
    Umbrella:'Paraguas',Sunglasses:'Gafas de sol',Scarf:'Bufanda',Kite:'Cometa',Coat:'Abrigo','Ice Cream':'Helado',Flashlight:'Linterna',Boots:'Botas',
    Car:'Coche',Boat:'Barco',Plane:'Avión',Train:'Tren',Submarine:'Submarino',Helicopter:'Helicóptero',Ambulance:'Ambulancia',Bus:'Autobús',
    Road:'Carretera',Sea:'Mar',Sky:'Cielo',Track:'Vía',Ocean:'Océano',Helipad:'Helipuerto',Hospital:'Hospital',Stop:'Parada',
    USA:'EE.UU.',Japan:'Japón',Brazil:'Brasil',France:'Francia',Italy:'Italia',China:'China',UK:'R. Unido',Australia:'Australia',Mexico:'México',India:'India',Flag:'Bandera',
    Strawberry:'Fresa',Blueberry:'Arándano',Lemon:'Limón',Orange:'Naranja',Grapes:'Uvas',Lime:'Lima',Coconut:'Coco',Blackberry:'Mora',
    Red:'Rojo',Blue:'Azul',Yellow:'Amarillo',Purple:'Morado',Green:'Verde',White:'Blanco',Black:'Negro',
    Orchestra:'Orquesta',Rock:'Rock',Jazz:'Jazz',March:'Marcha',Percussion:'Percusión',Piano:'Piano',
    Violin:'Violín',Saxophone:'Saxofón',Trumpet:'Trompeta',Drums:'Tambores',Keys:'Teclas',
    Earth:'Tierra',Saturn:'Saturno',Telescope:'Telescopio',Alien:'Alien',Comet:'Cometa',
    Moon:'Luna',Star:'Estrella',Rings:'Anillos',Spacesuit:'Traje espacial',Stars:'Estrellas',UFO:'OVNI',Tail:'Cola',Launch:'Lanzamiento',
  },
};

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

    const names = PAIR_NAMES[locale] || PAIR_NAMES.en;
    const left = picked.map((p, i) => ({ idx: i, label: names[p.item] || p.item, emoji: p.itemEmoji }));
    const right = shuffle(picked.map((p, i) => ({ idx: i, label: names[p.match] || p.match, emoji: p.matchEmoji })));
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
                      className={`py-3 px-3 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 ${
                        matched.has(idx) ? 'bg-emerald-200 text-emerald-500 opacity-60' :
                        selectedLeft === idx ? 'bg-teal-400 text-white ring-2 ring-teal-600' :
                        'bg-white text-teal-800 hover:bg-teal-50'
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl leading-none">{emoji}</span>
                      <span className="text-sm sm:text-base">{label}</span>
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
                      className={`py-3 px-3 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 ${
                        matched.has(idx) ? 'bg-emerald-200 text-emerald-500 opacity-60' :
                        'bg-white text-cyan-800 hover:bg-cyan-50'
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl leading-none">{emoji}</span>
                      <span className="text-sm sm:text-base">{label}</span>
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
