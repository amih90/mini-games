/**
 * Shared game logic utilities for Phaser-based games.
 * Non-UI helpers: score persistence, difficulty definitions, etc.
 */

/* ------------------------------------------------------------------ */
/*  High-score persistence                                            */
/* ------------------------------------------------------------------ */

export function loadHighScore(key: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(key);
  return raw ? parseInt(raw, 10) : 0;
}

export function saveHighScore(key: string, score: number): boolean {
  if (typeof window === 'undefined') return false;
  const prev = loadHighScore(key);
  if (score > prev) {
    localStorage.setItem(key, String(score));
    return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/*  Generic difficulty helpers                                        */
/* ------------------------------------------------------------------ */

export interface DifficultyLevel<T extends string = string> {
  key: T;
  label: Record<string, string>;
  emoji: string;
  color: number; // Phaser colour int
}

/* ------------------------------------------------------------------ */
/*  Wins persistence                                                  */
/* ------------------------------------------------------------------ */

export function loadWins(key: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(key);
  return raw ? parseInt(raw, 10) : 0;
}

export function incrementWins(key: string): number {
  const wins = loadWins(key) + 1;
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, String(wins));
  }
  return wins;
}

/* ------------------------------------------------------------------ */
/*  Small math helpers                                                */
/* ------------------------------------------------------------------ */

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}
