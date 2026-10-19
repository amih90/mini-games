import type { AdditionalBaseSpeciesId, AdditionalSpeciesId } from './family-data';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type LegacyBaseSpeciesId = 'charmander' | 'squirtle' | 'bulbasaur' | 'pikachu' | 'geodude' | 'gastly';
export type BaseSpeciesId = LegacyBaseSpeciesId | AdditionalBaseSpeciesId;
export type SpeciesId = BaseSpeciesId | AdditionalSpeciesId | 'charmeleon' | 'charizard' | 'wartortle' | 'blastoise' | 'ivysaur' | 'venusaur' | 'raichu' | 'graveler' | 'golem' | 'haunter' | 'gengar';
export type Element = 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'rock' | 'ghost' | 'ice';
export type Owner = 'player' | 'enemy';
export type Phase = 'camp' | 'deployment' | 'battle' | 'victory' | 'defeat' | 'complete';
export type Potion = 'healingPotion' | 'revivePotion';
export interface Cell { x: number; y: number }
export interface Move {
  id: string; name: string; nameKey: string; descriptionKey: string;
  element: Element; power: number; range: number; energy: number; cooldown: number;
  kind: 'damage' | 'heal'; status?: 'burn' | 'slow';
}
export interface Species {
  id: SpeciesId; name: string; nameKey: string; element: Element; price: number;
  maxHp: number; attack: number; defense: number; speed: number; movement: number;
  moves: readonly Move[];
}
export interface Status { kind: 'burn' | 'slow'; remaining: number }
export interface Unit {
  id: string; species: SpeciesId; owner: Owner; level: number;
  hp: number; maxHp: number; energy: number; maxEnergy: number;
  attack: number; defense: number; speed: number; movement: number;
  cooldowns: Record<string, number>; statuses: Status[]; defending: boolean;
  position: Cell | null;
}
export interface Inventory { healingPotion: number; revivePotion: number }
export interface Checkpoint {
  gold: number; potions: Inventory; roster: Unit[]; deployment: Record<string, Cell>;
  stage: number; seed: number; nextId: number;
}
export interface GameState {
  version: 1; phase: Phase; difficulty: Difficulty; stage: number;
  gold: number; potions: Inventory; roster: Unit[]; deployment: Record<string, Cell>;
  battleUnits: Unit[]; blockedCells: Cell[]; initiative: string[]; activeId: string | null;
  cycle: number; moved: boolean; waitedIds: string[]; seed: number; nextId: number;
  checkpoint: Checkpoint | null; rewardedStages: number[];
}
export type GameAction =
  | { type: 'buyCreature'; species: SpeciesId }
  | { type: 'buyPotion'; potion: Potion }
  | { type: 'train'; unitId: string }
  | { type: 'evolve'; unitId: string }
  | { type: 'rest' }
  | { type: 'deploy'; unitId: string; position: Cell }
  | { type: 'bench'; unitId: string }
  | { type: 'prepareBattle' } | { type: 'startBattle' }
  | { type: 'move'; position: Cell }
  | { type: 'useMove'; moveId: string; targetId: string }
  | { type: 'defend' } | { type: 'wait' }
  | { type: 'usePotion'; potion: Potion; targetId: string }
  | { type: 'retry' } | { type: 'recover' } | { type: 'continue' }
  | { type: 'reset'; difficulty: Difficulty };
export interface TransitionResult { state: GameState; error?: string }
export interface LoadResult { state?: GameState; error?: string }
