import {
  Potion,
  PotionId,
  Creature,
  CreatureId,
  Recipe,
  Level,
  DifficultySettings,
  Difficulty,
} from './types';

// ─── Potion Definitions ──────────────────────────────────────

export const POTIONS: Record<PotionId, Potion> = {
  green: { id: 'green', color: '#22c55e', emissiveColor: '#16a34a', bottleShape: 'round', label: 'potionGreen' },
  purple: { id: 'purple', color: '#a855f7', emissiveColor: '#9333ea', bottleShape: 'tall', label: 'potionPurple' },
  blue: { id: 'blue', color: '#3b82f6', emissiveColor: '#2563eb', bottleShape: 'flask', label: 'potionBlue' },
  red: { id: 'red', color: '#ef4444', emissiveColor: '#dc2626', bottleShape: 'triangular', label: 'potionRed' },
  yellow: { id: 'yellow', color: '#eab308', emissiveColor: '#ca8a04', bottleShape: 'spiral', label: 'potionYellow' },
  cyan: { id: 'cyan', color: '#06b6d4', emissiveColor: '#0891b2', bottleShape: 'crystal', label: 'potionCyan' },
  golden: { id: 'golden', color: '#f59e0b', emissiveColor: '#d97706', bottleShape: 'round', label: 'potionGolden' },
  pink: { id: 'pink', color: '#ec4899', emissiveColor: '#db2777', bottleShape: 'tall', label: 'potionPink' },
};

export const POTION_LIST: Potion[] = Object.values(POTIONS);

// ─── Creature Definitions ────────────────────────────────────

export const CREATURES: Record<CreatureId, Creature> = {
  slime:         { id: 'slime',         color: '#22c55e', emissiveColor: '#16a34a', isFail: false, label: 'creatureSlime' },
  fireImp:       { id: 'fireImp',       color: '#ef4444', emissiveColor: '#dc2626', isFail: false, label: 'creatureFireImp' },
  waterSprite:   { id: 'waterSprite',   color: '#3b82f6', emissiveColor: '#2563eb', isFail: false, label: 'creatureWaterSprite' },
  stoneGolem:    { id: 'stoneGolem',    color: '#78716c', emissiveColor: '#57534e', isFail: false, label: 'creatureStoneGolem' },
  fairy:         { id: 'fairy',         color: '#f0abfc', emissiveColor: '#e879f9', isFail: false, label: 'creatureFairy' },
  shadowWisp:    { id: 'shadowWisp',    color: '#6b21a8', emissiveColor: '#581c87', isFail: false, label: 'creatureShadowWisp' },
  crystalDragon: { id: 'crystalDragon', color: '#06b6d4', emissiveColor: '#0e7490', isFail: false, label: 'creatureCrystalDragon' },
  goldenPhoenix: { id: 'goldenPhoenix', color: '#f59e0b', emissiveColor: '#d97706', isFail: false, label: 'creatureGoldenPhoenix' },
  failBlob:      { id: 'failBlob',      color: '#84cc16', emissiveColor: '#65a30d', isFail: true,  label: 'creatureFailBlob' },
  failSpiky:     { id: 'failSpiky',     color: '#f97316', emissiveColor: '#ea580c', isFail: true,  label: 'creatureFailSpiky' },
  failWobbly:    { id: 'failWobbly',    color: '#a78bfa', emissiveColor: '#8b5cf6', isFail: true,  label: 'creatureFailWobbly' },
};

// ─── Recipes ─────────────────────────────────────────────────

export const RECIPES: Recipe[] = [
  // Tier 1: 2 ingredients, simple patterns
  { id: 'r1',  ingredients: ['green', 'blue'],           orderMatters: false, heatRange: [0.3, 0.7], minStirs: 2, stirPattern: ['cw', 'cw'],                     creature: 'slime' },
  { id: 'r2',  ingredients: ['red', 'yellow'],           orderMatters: false, heatRange: [0.6, 1.0], minStirs: 3, stirPattern: ['cw', 'cw', 'ccw'],               creature: 'fireImp' },
  { id: 'r3',  ingredients: ['blue', 'cyan'],            orderMatters: false, heatRange: [0.1, 0.5], minStirs: 2, stirPattern: ['ccw', 'ccw'],                    creature: 'waterSprite' },
  { id: 'r4',  ingredients: ['red', 'purple'],           orderMatters: false, heatRange: [0.2, 0.6], minStirs: 4, stirPattern: ['cw', 'ccw', 'cw', 'ccw'],       creature: 'stoneGolem' },
  { id: 'r5',  ingredients: ['pink', 'golden'],          orderMatters: false, heatRange: [0.4, 0.8], minStirs: 3, stirPattern: ['cw', 'ccw', 'cw'],              creature: 'fairy' },

  // Tier 2: 3 ingredients, mixed patterns
  { id: 'r6',  ingredients: ['purple', 'blue', 'red'],    orderMatters: true,  heatRange: [0.2, 0.5], minStirs: 4, stirPattern: ['ccw', 'ccw', 'cw', 'cw'],       creature: 'shadowWisp' },
  { id: 'r7',  ingredients: ['cyan', 'purple', 'golden'], orderMatters: false, heatRange: [0.5, 0.9], minStirs: 5, stirPattern: ['cw', 'ccw', 'cw', 'ccw', 'cw'], creature: 'crystalDragon' },
  { id: 'r8',  ingredients: ['golden', 'red', 'yellow'],  orderMatters: true,  heatRange: [0.7, 1.0], minStirs: 6, stirPattern: ['cw', 'cw', 'ccw', 'cw', 'cw', 'ccw'], creature: 'goldenPhoenix' },
  { id: 'r9',  ingredients: ['green', 'yellow', 'cyan'],  orderMatters: false, heatRange: [0.3, 0.6], minStirs: 3, stirPattern: ['ccw', 'cw', 'ccw'],             creature: 'slime' },
  { id: 'r10', ingredients: ['pink', 'blue', 'purple'],   orderMatters: false, heatRange: [0.2, 0.7], minStirs: 4, stirPattern: ['cw', 'cw', 'ccw', 'ccw'],       creature: 'fairy' },

  // Tier 3: 4 ingredients, complex patterns
  { id: 'r11', ingredients: ['red', 'blue', 'green', 'yellow'],    orderMatters: true,  heatRange: [0.4, 0.6], minStirs: 6, stirPattern: ['cw', 'ccw', 'cw', 'ccw', 'cw', 'ccw'],       creature: 'crystalDragon' },
  { id: 'r12', ingredients: ['purple', 'pink', 'cyan', 'golden'],  orderMatters: true,  heatRange: [0.5, 0.8], minStirs: 7, stirPattern: ['ccw', 'cw', 'cw', 'ccw', 'ccw', 'cw', 'cw'], creature: 'goldenPhoenix' },
  { id: 'r13', ingredients: ['green', 'purple', 'red', 'cyan'],    orderMatters: false, heatRange: [0.3, 0.5], minStirs: 5, stirPattern: ['cw', 'ccw', 'ccw', 'cw', 'ccw'],              creature: 'shadowWisp' },
  { id: 'r14', ingredients: ['yellow', 'pink', 'blue', 'red'],     orderMatters: true,  heatRange: [0.6, 0.9], minStirs: 5, stirPattern: ['ccw', 'cw', 'ccw', 'cw', 'ccw'],              creature: 'stoneGolem' },

  // Tier 4: 5 ingredients, boss-level patterns
  { id: 'r15', ingredients: ['golden', 'red', 'yellow', 'pink', 'cyan'],      orderMatters: true,  heatRange: [0.7, 0.9], minStirs: 8, stirPattern: ['cw', 'cw', 'ccw', 'cw', 'ccw', 'ccw', 'cw', 'cw'], creature: 'goldenPhoenix' },
  { id: 'r16', ingredients: ['purple', 'blue', 'cyan', 'green', 'golden'],    orderMatters: true,  heatRange: [0.3, 0.5], minStirs: 7, stirPattern: ['ccw', 'cw', 'ccw', 'cw', 'cw', 'ccw', 'cw'],       creature: 'crystalDragon' },
];

// ─── Level Definitions ───────────────────────────────────────

const BASIC_POTIONS: PotionId[] = ['green', 'blue', 'red', 'yellow', 'purple', 'pink'];
const ALL_POTIONS: PotionId[] = ['green', 'blue', 'red', 'yellow', 'purple', 'pink', 'cyan', 'golden'];

export const LEVELS: Level[] = [
  // Tutorial levels (1-5)
  { id: 1,  recipe: RECIPES[0],  availablePotions: ['green', 'blue', 'red'],                    timeLimitSeconds: null, showHints: true },
  { id: 2,  recipe: RECIPES[1],  availablePotions: ['red', 'yellow', 'green'],                  timeLimitSeconds: null, showHints: true },
  { id: 3,  recipe: RECIPES[2],  availablePotions: ['blue', 'cyan', 'purple'],                  timeLimitSeconds: null, showHints: true },
  { id: 4,  recipe: RECIPES[3],  availablePotions: ['red', 'purple', 'yellow', 'blue'],         timeLimitSeconds: null, showHints: true },
  { id: 5,  recipe: RECIPES[4],  availablePotions: ['pink', 'golden', 'green', 'blue'],         timeLimitSeconds: null, showHints: true },

  // Standard levels (6-12)
  { id: 6,  recipe: RECIPES[5],  availablePotions: BASIC_POTIONS,                               timeLimitSeconds: null, showHints: false },
  { id: 7,  recipe: RECIPES[6],  availablePotions: ALL_POTIONS,                                 timeLimitSeconds: null, showHints: false },
  { id: 8,  recipe: RECIPES[7],  availablePotions: ALL_POTIONS,                                 timeLimitSeconds: null, showHints: false },
  { id: 9,  recipe: RECIPES[8],  availablePotions: ALL_POTIONS,                                 timeLimitSeconds: null, showHints: false },
  { id: 10, recipe: RECIPES[9],  availablePotions: ALL_POTIONS,                                 timeLimitSeconds: null, showHints: false },
  { id: 11, recipe: RECIPES[5],  availablePotions: ALL_POTIONS,                                 timeLimitSeconds: 60,  showHints: false },
  { id: 12, recipe: RECIPES[7],  availablePotions: ALL_POTIONS,                                 timeLimitSeconds: 60,  showHints: false },

  // Advanced levels (13-18)
  { id: 13, recipe: RECIPES[10], availablePotions: ALL_POTIONS,                                 timeLimitSeconds: 90,  showHints: false },
  { id: 14, recipe: RECIPES[11], availablePotions: ALL_POTIONS,                                 timeLimitSeconds: 90,  showHints: false },
  { id: 15, recipe: RECIPES[12], availablePotions: ALL_POTIONS,                                 timeLimitSeconds: 75,  showHints: false },
  { id: 16, recipe: RECIPES[13], availablePotions: ALL_POTIONS,                                 timeLimitSeconds: 75,  showHints: false },
  { id: 17, recipe: RECIPES[10], availablePotions: ALL_POTIONS,                                 timeLimitSeconds: 60,  showHints: false },
  { id: 18, recipe: RECIPES[11], availablePotions: ALL_POTIONS,                                 timeLimitSeconds: 60,  showHints: false },

  // Boss levels (19-20)
  { id: 19, recipe: RECIPES[14], availablePotions: ALL_POTIONS,                                 timeLimitSeconds: 120, showHints: false },
  { id: 20, recipe: RECIPES[15], availablePotions: ALL_POTIONS,                                 timeLimitSeconds: 120, showHints: false },
];

// ─── Difficulty Settings ─────────────────────────────────────

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    ingredientCount: [2, 3],
    orderSensitive: false,
    timePressure: false,
    heatTolerance: 0.3,
    showHints: true,
    scoreMultiplier: 1,
  },
  medium: {
    ingredientCount: [3, 4],
    orderSensitive: true,
    timePressure: false,
    heatTolerance: 0.2,
    showHints: false,
    scoreMultiplier: 1.5,
  },
  hard: {
    ingredientCount: [4, 5],
    orderSensitive: true,
    timePressure: true,
    heatTolerance: 0.1,
    showHints: false,
    scoreMultiplier: 2,
  },
};

// ─── Fail creature picker ────────────────────────────────────

const FAIL_CREATURES: CreatureId[] = ['failBlob', 'failSpiky', 'failWobbly'];

export function pickFailCreature(): CreatureId {
  return FAIL_CREATURES[Math.floor(Math.random() * FAIL_CREATURES.length)];
}

// ─── Recipe matching ─────────────────────────────────────────

export function matchRecipe(
  addedPotions: PotionId[],
  heatLevel: number,
  stirCount: number,
  difficulty: Difficulty,
): { recipe: Recipe; stars: number } | null {
  const settings = DIFFICULTY_SETTINGS[difficulty];

  for (const recipe of RECIPES) {
    if (recipe.ingredients.length !== addedPotions.length) continue;

    // Check ingredient match
    let ingredientsMatch = false;
    if (recipe.orderMatters && settings.orderSensitive) {
      ingredientsMatch = recipe.ingredients.every((ing, i) => addedPotions[i] === ing);
    } else {
      const sorted1 = [...recipe.ingredients].sort();
      const sorted2 = [...addedPotions].sort();
      ingredientsMatch = sorted1.every((ing, i) => sorted2[i] === ing);
    }

    if (!ingredientsMatch) continue;

    // Calculate stars based on heat accuracy and stir count
    let stars = 1;
    const heatInRange = heatLevel >= recipe.heatRange[0] - settings.heatTolerance &&
                        heatLevel <= recipe.heatRange[1] + settings.heatTolerance;
    const heatPerfect = heatLevel >= recipe.heatRange[0] && heatLevel <= recipe.heatRange[1];
    const stirsEnough = stirCount >= recipe.minStirs;

    if (heatInRange) stars = 2;
    if (heatPerfect && stirsEnough) stars = 3;

    return { recipe, stars };
  }
  return null;
}

// ─── Level for difficulty ────────────────────────────────────

export function getLevelsForDifficulty(difficulty: Difficulty): Level[] {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  return LEVELS.filter(l => {
    const count = l.recipe.ingredients.length;
    const [min, max] = settings.ingredientCount;
    const withinCount = count >= min && count <= max;
    const withinTime = !settings.timePressure ? true : true; // all levels available in hard
    return withinCount || withinTime;
  }).slice(0, 20);
}
