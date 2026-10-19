import { additionalFamilies, type AdditionalSpeciesId } from './family-data';
import type { Difficulty, Element, LegacyBaseSpeciesId, Move, Species, SpeciesId } from './types';

export const GRID_WIDTH = 12;
export const GRID_HEIGHT = 8;
export const MAX_TEAM = 6;
export const MAX_ROSTER = 12;
export const MAX_STAGE = 10;
export const potionPrices = { healingPotion: 30, revivePotion: 80 } as const;
export const difficultySettings: Record<Difficulty, { enemyPercent: number; rewardPercent: number }> = {
  easy: { enemyPercent: 80, rewardPercent: 120 },
  medium: { enemyPercent: 100, rewardPercent: 100 },
  hard: { enemyPercent: 120, rewardPercent: 85 },
};
export const easyEncounters = [
  { count: 1, level: 1 }, { count: 2, level: 1 }, { count: 2, level: 2 },
  { count: 3, level: 2 }, { count: 3, level: 2 }, { count: 4, level: 2 },
  { count: 4, level: 3 }, { count: 5, level: 3 }, { count: 5, level: 3 }, { count: 6, level: 3 },
] as const;
export const victoryReward = (stage: number, difficulty: Difficulty) => difficulty === 'easy'
  ? 300 + (stage - 1) * 25
  : Math.floor((180 + stage * 35) * difficultySettings[difficulty].rewardPercent / 100);
const move = (id: string, name: string, element: Element, power: number, range: number,
  energy = 0, cooldown = 0, status?: 'burn' | 'slow', kind: 'damage' | 'heal' = 'damage'): Move =>
  ({ id, name, nameKey: `moves.${id}`, descriptionKey: `moveDescriptions.${id}`, element, power, range, energy, cooldown, status, kind });
const baseSpeciesCatalog: Record<LegacyBaseSpeciesId, Species> = {
  charmander: { id: 'charmander', name: 'Charmander', nameKey: 'species.charmander', element: 'fire', price: 100,
    maxHp: 65, attack: 18, defense: 8, speed: 12, movement: 3,
    moves: [move('scratch', 'Scratch', 'normal', 10, 1), move('ember', 'Ember', 'fire', 17, 3, 8, 0, 'burn'), move('flamethrower', 'Flamethrower', 'fire', 27, 3, 0, 3)] },
  squirtle: { id: 'squirtle', name: 'Squirtle', nameKey: 'species.squirtle', element: 'water', price: 110,
    maxHp: 75, attack: 16, defense: 12, speed: 9, movement: 3,
    moves: [move('tackle', 'Tackle', 'normal', 10, 1), move('waterGun', 'Water Gun', 'water', 19, 3, 8), move('icyWind', 'Icy Wind', 'ice', 24, 3, 0, 3, 'slow')] },
  bulbasaur: { id: 'bulbasaur', name: 'Bulbasaur', nameKey: 'species.bulbasaur', element: 'grass', price: 120,
    maxHp: 72, attack: 16, defense: 10, speed: 10, movement: 3,
    moves: [move('tackle', 'Tackle', 'normal', 10, 1), move('vineWhip', 'Vine Whip', 'grass', 20, 2, 8), move('synthesis', 'Synthesis', 'grass', 28, 3, 0, 3, undefined, 'heal')] },
  pikachu: { id: 'pikachu', name: 'Pikachu', nameKey: 'species.pikachu', element: 'electric', price: 160,
    maxHp: 58, attack: 19, defense: 7, speed: 16, movement: 4,
    moves: [move('quickAttack', 'Quick Attack', 'normal', 11, 1), move('thunderShock', 'Thunder Shock', 'electric', 21, 3, 9), move('thunderbolt', 'Thunderbolt', 'electric', 28, 3, 0, 3)] },
  geodude: { id: 'geodude', name: 'Geodude', nameKey: 'species.geodude', element: 'rock', price: 80,
    maxHp: 90, attack: 17, defense: 16, speed: 6, movement: 2,
    moves: [move('tackle', 'Tackle', 'normal', 10, 1), move('rockThrow', 'Rock Throw', 'rock', 20, 3, 8), move('rockTomb', 'Rock Tomb', 'rock', 28, 2, 0, 3, 'slow')] },
  gastly: { id: 'gastly', name: 'Gastly', nameKey: 'species.gastly', element: 'ghost', price: 140,
    maxHp: 55, attack: 22, defense: 6, speed: 14, movement: 4,
    moves: [move('lick', 'Lick', 'ghost', 10, 1), move('shadowBall', 'Shadow Ball', 'ghost', 21, 3, 9), move('willOWisp', 'Will-O-Wisp', 'fire', 16, 3, 0, 3, 'burn')] },
};
const evolved = (base: LegacyBaseSpeciesId, id: SpeciesId, name: string, stage: number): Species => {
  const source = baseSpeciesCatalog[base];
  return { ...source, id, name, nameKey: `species.${id}`, maxHp: source.maxHp + stage * 25,
    attack: source.attack + stage * 6, defense: source.defense + stage * 4, speed: source.speed + stage * 2 };
};
const archetypes: Record<Element, Species> = {
  fire: baseSpeciesCatalog.charmander,
  water: baseSpeciesCatalog.squirtle,
  grass: baseSpeciesCatalog.bulbasaur,
  electric: baseSpeciesCatalog.pikachu,
  rock: baseSpeciesCatalog.geodude,
  ghost: baseSpeciesCatalog.gastly,
  normal: { ...baseSpeciesCatalog.pikachu, element: 'normal', price: 100, moves: [
    move('tackle', 'Tackle', 'normal', 10, 1),
    move('quickAttack', 'Quick Attack', 'normal', 16, 2, 8),
    move('scratch', 'Scratch', 'normal', 25, 1, 0, 3),
  ] },
  ice: { ...baseSpeciesCatalog.squirtle, element: 'ice', price: 120 },
};
const additionalSpeciesCatalog = Object.fromEntries(additionalFamilies.flatMap(family =>
  family.forms.map(([id, , name], stage): [AdditionalSpeciesId, Species] => {
    const source = archetypes[family.element];
    return [id, { ...source, id, name, nameKey: `species.${id}`,
      maxHp: source.maxHp + stage * 25, attack: source.attack + stage * 6,
      defense: source.defense + stage * 4, speed: source.speed + stage * 2 }];
  }))) as Record<AdditionalSpeciesId, Species>;
const additionalEvolutions: Partial<Record<SpeciesId, { species: SpeciesId; cost: number }>> = {};
for (const family of additionalFamilies) {
  family.forms.forEach(([id], stage) => {
    const next = family.forms[stage + 1];
    if (next) additionalEvolutions[id] = { species: next[0], cost: (stage + 1) * 200 };
  });
}
export const speciesCatalog: Record<SpeciesId, Species> = {
  ...baseSpeciesCatalog,
  charmeleon: evolved('charmander', 'charmeleon', 'Charmeleon', 1),
  charizard: evolved('charmander', 'charizard', 'Charizard', 2),
  wartortle: evolved('squirtle', 'wartortle', 'Wartortle', 1),
  blastoise: evolved('squirtle', 'blastoise', 'Blastoise', 2),
  ivysaur: evolved('bulbasaur', 'ivysaur', 'Ivysaur', 1),
  venusaur: evolved('bulbasaur', 'venusaur', 'Venusaur', 2),
  raichu: evolved('pikachu', 'raichu', 'Raichu', 1),
  graveler: evolved('geodude', 'graveler', 'Graveler', 1),
  golem: evolved('geodude', 'golem', 'Golem', 2),
  haunter: evolved('gastly', 'haunter', 'Haunter', 1),
  gengar: evolved('gastly', 'gengar', 'Gengar', 2),
  ...additionalSpeciesCatalog,
};
export const evolutions: Partial<Record<SpeciesId, { species: SpeciesId; cost: number }>> = {
  ...additionalEvolutions,
  charmander: { species: 'charmeleon', cost: 200 }, charmeleon: { species: 'charizard', cost: 400 },
  squirtle: { species: 'wartortle', cost: 200 }, wartortle: { species: 'blastoise', cost: 400 },
  bulbasaur: { species: 'ivysaur', cost: 200 }, ivysaur: { species: 'venusaur', cost: 400 },
  pikachu: { species: 'raichu', cost: 200 },
  geodude: { species: 'graveler', cost: 200 }, graveler: { species: 'golem', cost: 400 },
  gastly: { species: 'haunter', cost: 200 }, haunter: { species: 'gengar', cost: 400 },
};
export const encounterSpeciesIds: LegacyBaseSpeciesId[] = ['charmander', 'squirtle', 'bulbasaur', 'pikachu', 'geodude', 'gastly'];
export const speciesIds: SpeciesId[] = [
  ...encounterSpeciesIds, ...additionalFamilies.map(family => family.forms[0][0]),
];
export const allSpeciesIds = Object.keys(speciesCatalog) as SpeciesId[];
export const trainingCost = (level: number): number => 60 + level * 40;
export function elementalPercent(attack: Element, defense: Element): number {
  const strong: Partial<Record<Element, readonly Element[]>> = {
    fire: ['grass'], water: ['fire', 'rock'], grass: ['water', 'rock'],
    electric: ['water'], rock: ['fire', 'electric'], ghost: ['ghost'], ice: ['grass'],
  };
  if (strong[attack]?.includes(defense)) return 150;
  if (attack !== defense && strong[defense]?.includes(attack)) return 75;
  return 100;
}
