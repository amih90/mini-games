// ─── Potion Craft Lab — Core Types ───────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GamePhase =
  | 'menu'
  | 'playing'
  | 'brewing'
  | 'result'
  | 'paused';

// ─── Potions ─────────────────────────────────────────────────

export type PotionId =
  | 'green'
  | 'purple'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'cyan'
  | 'golden'
  | 'pink';

export type BottleShape =
  | 'round'
  | 'tall'
  | 'triangular'
  | 'spiral'
  | 'crystal'
  | 'flask';

export interface Potion {
  id: PotionId;
  color: string; // hex color
  emissiveColor: string;
  bottleShape: BottleShape;
  label: string; // i18n key
}

// ─── Creatures ───────────────────────────────────────────────

export type CreatureId =
  | 'slime'
  | 'fireImp'
  | 'waterSprite'
  | 'stoneGolem'
  | 'fairy'
  | 'shadowWisp'
  | 'crystalDragon'
  | 'goldenPhoenix'
  | 'failBlob'
  | 'failSpiky'
  | 'failWobbly';

export interface Creature {
  id: CreatureId;
  color: string;
  emissiveColor: string;
  isFail: boolean;
  label: string; // i18n key
}

// ─── Recipes ─────────────────────────────────────────────────

export interface Recipe {
  id: string;
  ingredients: PotionId[];
  orderMatters: boolean;
  heatRange: [number, number]; // [min, max] in 0-1
  minStirs: number;
  stirPattern: ('cw' | 'ccw')[]; // required stir directions (repeated cyclically if more stirs needed)
  creature: CreatureId;
}

// ─── Levels ──────────────────────────────────────────────────

export interface Level {
  id: number;
  recipe: Recipe;
  availablePotions: PotionId[];
  timeLimitSeconds: number | null; // null = no time limit
  showHints: boolean;
}

// ─── Difficulty Settings ─────────────────────────────────────

export interface DifficultySettings {
  ingredientCount: [number, number]; // [min, max]
  orderSensitive: boolean;
  timePressure: boolean;
  heatTolerance: number; // 0-1 how far off heat can be
  showHints: boolean;
  scoreMultiplier: number;
}

// ─── Game State ──────────────────────────────────────────────

export interface GameState {
  phase: GamePhase;
  difficulty: Difficulty;
  level: number;
  targetCreature: CreatureId;
  cauldronPotions: PotionId[];
  heatLevel: number; // 0-1
  stirCount: number;
  brewProgress: number; // 0-1
  resultCreature: CreatureId | null;
  stars: number; // 0-3
  score: number;
  highScore: number;
  unlockedPotions: Set<PotionId>;
  creatureCollection: Set<CreatureId>;
  timeRemaining: number | null; // seconds, null = no limit
  showHints: boolean;
  currentLevel: Level | null;
}
