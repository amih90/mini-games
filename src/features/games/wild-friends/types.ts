// ─── Wild Friends — Core Types ───────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GamePhase =
  | 'menu'
  | 'difficulty_select'
  | 'hub'
  | 'scene_intro'
  | 'exploring'
  | 'animal_encounter'
  | 'fact_card'
  | 'challenge'
  | 'reward'
  | 'scene_complete'
  | 'grand_finale';

export type ChallengeType =
  | 'sound_match'
  | 'size_sort'
  | 'reach_and_feed'
  | 'color_match'
  | 'patience_hold'
  | 'fruit_catch'
  | 'penguin_slide'
  | 'hide_and_seek'
  | 'rhythm_clap'
  | 'jump_count'
  | 'leaf_match'
  | 'mix_and_match'
  | 'bubble_pop'
  | 'path_trace'
  | 'size_compare';

// ─── Animals ─────────────────────────────────────────────────

export interface Animal {
  id: string;
  name: { en: string; he: string; zh: string; es: string };
  emoji: string;
  continent: string;
  fact: { en: string; he: string; zh: string; es: string };
  challengeType: ChallengeType;
  challengeConfig: Record<string, unknown>;
}

// ─── Scenes ──────────────────────────────────────────────────

export interface Scene {
  id: string;
  continent: { en: string; he: string; zh: string; es: string };
  biome: string;
  animalIds: string[];
  order: number;
  storyIntro: { en: string; he: string; zh: string; es: string };
}

// ─── Album ───────────────────────────────────────────────────

export interface AnimalAlbumEntry {
  animalId: string;
  discoveredAt: number;
  sceneId: string;
}
