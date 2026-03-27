import { GameConfig, GameCategory } from './types';
import { checkersConfig } from '../checkers/game.config';
import { reversiConfig } from '../reversi/game.config';
import { chessConfig } from '../chess/game.config';
import { backgammonConfig } from '../backgammon/game.config';
import { pingPongConfig } from '../ping-pong/game.config';
import { nascarCarsConfig } from '../nascar-cars/game.config';
import { sprintRacePhaserConfig } from '../sprint-race-phaser/game.config';
import { colorMixConfig } from '../color-mix/game.config';
import { fractionPizzaConfig } from '../fraction-pizza/game.config';
import { letterSoupConfig } from '../letter-soup/game.config';
import { matchPairsConfig } from '../match-pairs/game.config';
import { mirrorDrawConfig } from '../mirror-draw/game.config';
import { numberMuncherConfig } from '../number-muncher/game.config';
import { patternMakerConfig } from '../pattern-maker/game.config';
import { plantGrowerConfig } from '../plant-grower/game.config';
import { rhymeTimeConfig } from '../rhyme-time/game.config';
import { shapeBuilderConfig } from '../shape-builder/game.config';
import { sizeSorterConfig } from '../size-sorter/game.config';
import { weatherDressUpConfig } from '../weather-dress-up/game.config';
import { backgammonPhaserConfig } from '../backgammon-phaser/game.config';
import { oddOneOutConfig } from '../odd-one-out/game.config';
import { shadowMatchConfig } from '../shadow-match/game.config';
import { countingBubblesConfig } from '../counting-bubbles/game.config';
import { armyRunnerConfig } from '../army-runner/game.config';
import { potionCraftConfig } from '../potion-craft/game.config';

// Re-export types
export type { GameConfig, GameCategory } from './types';

/**
 * Central game registry
 * All games must be registered here to appear in the portal
 */
export const gameRegistry: Record<string, GameConfig> = {
  'color-match': {
    slug: 'color-match',
    title: {
      en: 'Color Match',
      he: 'התאמת צבעים',
    },
    description: {
      en: 'Match colors by dragging items to the right place!',
      he: 'התאימו צבעים על ידי גרירת פריטים למקום הנכון!',
    },
    categories: ['colors', 'ages-3-5'],
    ageRange: { min: 3, max: 5 },
    thumbnail: '/images/games/color-match.svg',
    icon: '🎨',
    engine: 'react',
    i18nNamespace: 'colorMatch',
  },
  'memory-cards': {
    slug: 'memory-cards',
    title: {
      en: 'Memory Cards',
      he: 'קלפי זיכרון',
    },
    description: {
      en: 'Find all the matching pairs!',
      he: 'מצאו את כל הזוגות התואמים!',
    },
    categories: ['memory', 'ages-3-5', 'ages-6-8'],
    ageRange: { min: 4, max: 7 },
    thumbnail: '/images/games/memory-cards.svg',
    icon: '🃏',
    engine: 'react',
    i18nNamespace: 'memoryCards',
  },
  'flappy-bird': {
    slug: 'flappy-bird',
    title: {
      en: 'Flappy Bird',
      he: 'ציפור מעופפת',
    },
    description: {
      en: 'Tap to fly through the pipes! How far can you go?',
      he: 'הקישו כדי לעוף בין הצינורות! כמה רחוק תגיעו?',
    },
    categories: ['reaction', 'ages-6-8'],
    ageRange: { min: 5, max: 12 },
    thumbnail: '/images/games/flappy-bird.svg',
    icon: '🐦',
    engine: 'canvas',
    i18nNamespace: 'flappyBird',
  },
  'chicken-invaders': {
    slug: 'chicken-invaders',
    title: {
      en: 'Chicken Invaders',
      he: 'פולשי התרנגולות',
    },
    description: {
      en: 'Defend Earth from waves of invading chickens!',
      he: 'הגנו על כדור הארץ מגלי פלישה של תרנגולות!',
    },
    categories: ['reaction', 'ages-6-8'],
    ageRange: { min: 6, max: 12 },
    thumbnail: '/images/games/chicken-invaders.svg',
    icon: '🐔',
    engine: 'canvas',
    i18nNamespace: 'chickenInvaders',
  },
  'tetris': {
    slug: 'tetris',
    title: {
      en: 'Tetris',
      he: 'טטריס',
    },
    description: {
      en: 'Stack falling blocks to clear lines!',
      he: 'סדרו בלוקים נופלים כדי למחוק שורות!',
    },
    categories: ['reaction', 'ages-6-8'],
    ageRange: { min: 6, max: 12 },
    thumbnail: '/images/games/tetris.svg',
    icon: '🧱',
    engine: 'canvas',
    i18nNamespace: 'tetris',
  },
  'snake': {
    slug: 'snake',
    title: {
      en: 'Snake',
      he: 'נחש',
    },
    description: {
      en: 'Eat fruits and grow longer! How big can you get?',
      he: 'אכלו פירות וגדלו! כמה גדולים תוכלו להיות?',
    },
    categories: ['reaction', 'ages-6-8'],
    ageRange: { min: 5, max: 12 },
    thumbnail: '/images/games/snake.svg',
    icon: '🐍',
    engine: 'canvas',
    i18nNamespace: 'snake',
  },
  'brick-breaker': {
    slug: 'brick-breaker',
    title: {
      en: 'Brick Breaker',
      he: 'שובר לבנים',
    },
    description: {
      en: 'Break all the bricks with your ball and paddle!',
      he: 'שברו את כל הלבנים עם הכדור והמחבט!',
    },
    categories: ['reaction', 'ages-6-8'],
    ageRange: { min: 5, max: 12 },
    thumbnail: '/images/games/brick-breaker.svg',
    icon: '🧱',
    engine: 'canvas',
    i18nNamespace: 'brickBreaker',
  },
  'dino-run': {
    slug: 'dino-run',
    title: {
      en: 'Dino Run',
      he: 'דינו רץ',
    },
    description: {
      en: 'Jump over obstacles and run as far as you can!',
      he: 'קפצו מעל מכשולים ורוצו כמה שיותר רחוק!',
    },
    categories: ['reaction', 'ages-6-8'],
    ageRange: { min: 4, max: 10 },
    thumbnail: '/images/games/dino-run.svg',
    icon: '🦕',
    engine: 'canvas',
    i18nNamespace: 'dinoRun',
  },
  'whack-a-mole': {
    slug: 'whack-a-mole',
    title: {
      en: 'Whack-a-Mole',
      he: 'הכה את השומה',
    },
    description: {
      en: 'Whack the moles as they pop up! Watch out for bombs!',
      he: 'הכו את השומות כשהן קופצות! היזהרו מפצצות!',
    },
    categories: ['reaction', 'ages-3-5', 'ages-6-8'],
    ageRange: { min: 3, max: 10 },
    thumbnail: '/images/games/whack-a-mole.svg',
    icon: '🔨',
    engine: 'canvas',
    i18nNamespace: 'whackAMole',
  },
  'penalty-kick': {
    slug: 'penalty-kick',
    title: {
      en: 'Penalty Kick',
      he: 'בעיטת עונשין',
    },
    description: {
      en: 'Score goals in this exciting penalty shootout! Aim, power up, and shoot!',
      he: 'הבקיעו שערים בפנדלים מרגשים! כוונו, טענו כוח ובעטו!',
    },
    categories: ['reaction', 'ages-6-8'],
    ageRange: { min: 5, max: 12 },
    thumbnail: '/images/games/penalty-kick.svg',
    icon: '⚽',
    engine: 'canvas',
    i18nNamespace: 'penaltyKick',
  },
  'sprint-race': {
    slug: 'sprint-race',
    title: {
      en: 'Sprint Race',
      he: 'מרוץ ספרינט',
    },
    description: {
      en: 'Tap as fast as you can to win the Olympic sprint race!',
      he: 'הקישו מהר ככל האפשר כדי לנצח במרוץ האולימפי!',
    },
    categories: ['reaction', 'ages-6-8'],
    ageRange: { min: 5, max: 12 },
    thumbnail: '/images/games/sprint-race.svg',
    icon: '🏃',
    engine: 'canvas',
    i18nNamespace: 'sprintRace',
  },
  'tower-defense': {
    slug: 'tower-defense',
    title: {
      en: 'Tower Defense',
      he: 'הגנת מגדלים',
    },
    description: {
      en: 'Build towers to defend against waves of enemies! A strategic battle awaits!',
      he: 'בנו מגדלים כדי להגן מפני גלי אויבים! קרב אסטרטגי מחכה!',
    },
    categories: ['reaction', 'ages-6-8'],
    ageRange: { min: 6, max: 12 },
    thumbnail: '/images/games/tower-defense.svg',
    icon: '🏰',
    engine: 'canvas',
    i18nNamespace: 'towerDefense',
  },
  'checkers': checkersConfig,
  'reversi': reversiConfig,
  'chess': chessConfig,
  'backgammon': backgammonConfig,
  'ping-pong': pingPongConfig,
  'nascar-cars': nascarCarsConfig,
  'sprint-race-phaser': sprintRacePhaserConfig,
  'color-mix': colorMixConfig,
  'fraction-pizza': fractionPizzaConfig,
  'letter-soup': letterSoupConfig,
  'match-pairs': matchPairsConfig,
  'mirror-draw': mirrorDrawConfig,
  'number-muncher': numberMuncherConfig,
  'pattern-maker': patternMakerConfig,
  'plant-grower': plantGrowerConfig,
  'rhyme-time': rhymeTimeConfig,
  'shape-builder': shapeBuilderConfig,
  'size-sorter': sizeSorterConfig,
  'weather-dress-up': weatherDressUpConfig,
  'backgammon-phaser': backgammonPhaserConfig,
  'odd-one-out': oddOneOutConfig,
  'shadow-match': shadowMatchConfig,
  'counting-bubbles': countingBubblesConfig,
  'army-runner': armyRunnerConfig,
  'potion-craft': potionCraftConfig,
};

/**
 * Get a game config by slug
 */
export function getGameBySlug(slug: string): GameConfig | undefined {
  return gameRegistry[slug];
}

/**
 * Get all games
 */
export function getAllGames(): GameConfig[] {
  return Object.values(gameRegistry);
}

/**
 * Get all game slugs
 */
export function getAllGameSlugs(): string[] {
  return Object.keys(gameRegistry);
}

/**
 * Get games filtered by category
 */
export function getGamesByCategory(category: GameCategory): GameConfig[] {
  return Object.values(gameRegistry).filter((game) =>
    game.categories.includes(category)
  );
}

/**
 * Get games filtered by age
 */
export function getGamesByAge(age: number): GameConfig[] {
  return Object.values(gameRegistry).filter(
    (game) => age >= game.ageRange.min && age <= game.ageRange.max
  );
}

/**
 * Get all unique categories from registered games
 */
export function getAllCategories(): GameCategory[] {
  const categories = new Set<GameCategory>();
  Object.values(gameRegistry).forEach((game) => {
    game.categories.forEach((cat) => categories.add(cat));
  });
  return Array.from(categories);
}
