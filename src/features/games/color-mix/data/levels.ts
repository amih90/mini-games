// ─────────────────────────────────────────────────────────────────────
// Color Lab — Acts, Levels, Challenges
// ─────────────────────────────────────────────────────────────────────

export type ActId = 1 | 2 | 3 | 4 | 5;

export interface Challenge {
  /** Recipe id from data/colors.ts the child must reproduce. */
  recipeId: string;
  /** True for the boss challenge of a level (unlocks bonus star at zero wrong). */
  boss?: boolean;
}

export interface Level {
  id: number;          // 1..N — global level number
  act: ActId;
  /** Tubes available on this level (added to base palette by the engine). */
  unlocksTubes?: string[];
  challenges: Challenge[];
}

export interface Act {
  id: ActId;
  /** Localized in strings.ts via key = `act.${id}.title`. */
  bgClass: string;     // tailwind gradient classes for the act background
  emoji: string;
}

export const ACTS: Act[] = [
  { id: 1, emoji: '🎨', bgClass: 'from-yellow-100 via-pink-100 to-orange-200' },
  { id: 2, emoji: '🌅', bgClass: 'from-orange-200 via-pink-300 to-purple-400' },
  { id: 3, emoji: '🌫️', bgClass: 'from-slate-300 via-gray-400 to-slate-500' },
  { id: 4, emoji: '🌈', bgClass: 'from-fuchsia-400 via-purple-500 to-indigo-600' },
  { id: 5, emoji: '🖼️', bgClass: 'from-amber-200 via-orange-300 to-red-400' },
];

export const ACT_BY_ID: Record<ActId, Act> = ACTS.reduce(
  (acc, a) => { acc[a.id] = a; return acc; },
  {} as Record<ActId, Act>,
);

export const LEVELS: Level[] = [
  // ──────────────── Act 1 — The Three Friends ────────────────
  {
    id: 1, act: 1,
    challenges: [
      { recipeId: 'purple' },
      { recipeId: 'orange' },
      { recipeId: 'green' },
    ],
  },
  {
    id: 2, act: 1,
    challenges: [
      { recipeId: 'green' },
      { recipeId: 'purple' },
      { recipeId: 'orange' },
      { recipeId: 'green' },
    ],
  },
  {
    id: 3, act: 1,
    challenges: [
      { recipeId: 'orange' },
      { recipeId: 'purple' },
      { recipeId: 'green', boss: true },
    ],
  },

  // ──────────────── Act 2 — Light & Dark ────────────────
  {
    id: 4, act: 2,
    challenges: [
      { recipeId: 'pink' },
      { recipeId: 'light-blue' },
      { recipeId: 'cream' },
      { recipeId: 'pink' },
    ],
  },
  {
    id: 5, act: 2,
    challenges: [
      { recipeId: 'dark-red' },
      { recipeId: 'dark-blue' },
      { recipeId: 'olive' },
      { recipeId: 'dark-red' },
    ],
  },
  {
    id: 6, act: 2,
    challenges: [
      { recipeId: 'pink' },
      { recipeId: 'dark-blue' },
      { recipeId: 'cream' },
      { recipeId: 'olive', boss: true },
    ],
  },

  // ──────────────── Act 3 — The Greys ────────────────
  {
    id: 7, act: 3,
    challenges: [
      { recipeId: 'grey' },
      { recipeId: 'brown' },
      { recipeId: 'light-grey' },
      { recipeId: 'charcoal' },
    ],
  },
  {
    id: 8, act: 3,
    challenges: [
      { recipeId: 'grey' },
      { recipeId: 'beige' },
      { recipeId: 'lavender' },
      { recipeId: 'brown', boss: true },
    ],
  },

  // ──────────────── Act 4 — Hidden Colors (tertiaries) ────────────────
  {
    id: 9, act: 4,
    unlocksTubes: ['purple', 'orange', 'green'],
    challenges: [
      { recipeId: 'magenta' },
      { recipeId: 'gold' },
      { recipeId: 'cyan' },
    ],
  },
  {
    id: 10, act: 4,
    unlocksTubes: ['purple', 'orange', 'green', 'pink'],
    challenges: [
      { recipeId: 'indigo' },
      { recipeId: 'coral' },
      { recipeId: 'hot-pink' },
      { recipeId: 'teal' },
    ],
  },
  {
    id: 11, act: 4,
    unlocksTubes: ['purple', 'orange', 'green', 'pink'],
    challenges: [
      { recipeId: 'magenta' },
      { recipeId: 'gold' },
      { recipeId: 'indigo' },
      { recipeId: 'teal', boss: true },
    ],
  },

  // ──────────────── Act 5 — Master Painter ────────────────
  {
    id: 12, act: 5,
    challenges: [
      { recipeId: 'peach' },
      { recipeId: 'mint' },
      { recipeId: 'rose' },
    ],
  },
  {
    id: 13, act: 5,
    challenges: [
      { recipeId: 'sage' },
      { recipeId: 'salmon' },
      { recipeId: 'dark-green' },
      { recipeId: 'dark-purple' },
    ],
  },
  {
    id: 14, act: 5,
    challenges: [
      { recipeId: 'maroon' },
      { recipeId: 'beige' },
      { recipeId: 'lavender' },
      { recipeId: 'dark-purple' },
      { recipeId: 'sage', boss: true },
    ],
  },
];

export const LEVEL_BY_ID: Record<number, Level> = LEVELS.reduce(
  (acc, l) => { acc[l.id] = l; return acc; },
  {} as Record<number, Level>,
);

export const LEVELS_BY_ACT: Record<ActId, Level[]> = LEVELS.reduce(
  (acc, l) => {
    if (!acc[l.act]) acc[l.act] = [];
    acc[l.act].push(l);
    return acc;
  },
  {} as Record<ActId, Level[]>,
);

export const TOTAL_LEVELS = LEVELS.length;
