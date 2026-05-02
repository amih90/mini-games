// ─────────────────────────────────────────────────────────────────────
// Color Lab — Color & Recipe data
// ─────────────────────────────────────────────────────────────────────

export type LessonTag =
  | 'primary'
  | 'primary-mix'
  | 'tint'
  | 'shade'
  | 'neutral'
  | 'tertiary'
  | 'complex';

export type Family = 'warm' | 'cool' | 'neutral' | 'mix';

export interface PaintColor {
  /** Stable id used in recipes/state. */
  id: string;
  /** Hex used for rendering. */
  hex: string;
  /** 1-letter (English) badge for color-blind assist. */
  cbCode: string;
  /** Family classification used in smart-feedback hints. */
  family: Family;
  /** Whether this is a base tube (always available) or unlocked via discovery. */
  base: boolean;
}

/**
 * Base palette (always available as tubes).
 * 6 colors keeps mobile layouts to a single row of tubes.
 */
export const BASE_COLORS: PaintColor[] = [
  { id: 'red',    hex: '#EF4444', cbCode: 'R', family: 'warm',    base: true },
  { id: 'blue',   hex: '#3B82F6', cbCode: 'B', family: 'cool',    base: true },
  { id: 'yellow', hex: '#FACC15', cbCode: 'Y', family: 'warm',    base: true },
  { id: 'white',  hex: '#F9FAFB', cbCode: 'W', family: 'neutral', base: true },
  { id: 'black',  hex: '#1F2937', cbCode: 'K', family: 'neutral', base: true },
  { id: 'grey',   hex: '#9CA3AF', cbCode: 'G', family: 'neutral', base: true },
];

/**
 * Unlockable secondaries — become tubes once discovered.
 * Used in Act 4 (Hidden Colors) and Act 5 (Master Painter) to make tertiaries.
 */
export const UNLOCKABLE_COLORS: PaintColor[] = [
  { id: 'purple', hex: '#A855F7', cbCode: 'Pu', family: 'cool', base: false },
  { id: 'orange', hex: '#F97316', cbCode: 'Or', family: 'warm', base: false },
  { id: 'green',  hex: '#22C55E', cbCode: 'Gr', family: 'cool', base: false },
  { id: 'pink',   hex: '#F9A8D4', cbCode: 'Pi', family: 'warm', base: false },
  { id: 'brown',  hex: '#92400E', cbCode: 'Br', family: 'warm', base: false },
];

export const ALL_COLORS: PaintColor[] = [...BASE_COLORS, ...UNLOCKABLE_COLORS];

export const COLOR_BY_ID: Record<string, PaintColor> = ALL_COLORS.reduce(
  (acc, c) => { acc[c.id] = c; return acc; },
  {} as Record<string, PaintColor>,
);

// ─────────────────────────────────────────────────────────────────────
// Result colors (what mixes produce — superset of unlockable + result-only)
// ─────────────────────────────────────────────────────────────────────

export interface ResultColor {
  id: string;
  hex: string;
  emoji: string;
}

/**
 * Every color a recipe can produce. Includes the unlockable secondaries
 * (mirror of UNLOCKABLE_COLORS) and result-only colors (tints/shades/tertiaries).
 */
export const RESULTS: Record<string, ResultColor> = {
  // Unlockable secondaries (mirror tube hex)
  purple:        { id: 'purple',        hex: '#A855F7', emoji: '🟣' },
  orange:        { id: 'orange',        hex: '#F97316', emoji: '🟠' },
  green:         { id: 'green',         hex: '#22C55E', emoji: '🟢' },
  pink:          { id: 'pink',          hex: '#F9A8D4', emoji: '🩷' },
  brown:         { id: 'brown',         hex: '#92400E', emoji: '🟤' },

  // Tints
  'light-blue':  { id: 'light-blue',    hex: '#93C5FD', emoji: '🩵' },
  cream:         { id: 'cream',         hex: '#FEF3C7', emoji: '🟡' },
  peach:         { id: 'peach',         hex: '#FDBA74', emoji: '🍑' },
  mint:          { id: 'mint',          hex: '#A7F3D0', emoji: '🌿' },
  lavender:      { id: 'lavender',      hex: '#C4B5FD', emoji: '💜' },
  rose:          { id: 'rose',          hex: '#FBCFE8', emoji: '🌸' },
  beige:         { id: 'beige',         hex: '#E5C9A8', emoji: '🥨' },
  salmon:        { id: 'salmon',        hex: '#FCA5A5', emoji: '🐟' },

  // Shades
  'dark-red':    { id: 'dark-red',      hex: '#991B1B', emoji: '🍷' },
  'dark-blue':   { id: 'dark-blue',     hex: '#1E3A8A', emoji: '🌊' },
  'dark-green':  { id: 'dark-green',    hex: '#14532D', emoji: '🌲' },
  'dark-purple': { id: 'dark-purple',   hex: '#4C1D95', emoji: '🍇' },
  olive:         { id: 'olive',         hex: '#65A30D', emoji: '🫒' },
  maroon:        { id: 'maroon',        hex: '#7F1D1D', emoji: '🎻' },

  // Neutrals
  'light-grey':  { id: 'light-grey',    hex: '#D1D5DB', emoji: '☁️' },
  charcoal:      { id: 'charcoal',      hex: '#374151', emoji: '🪨' },
  sage:          { id: 'sage',          hex: '#A3B58C', emoji: '🌱' },

  // Tertiaries (Act 4 — need unlocked tubes)
  magenta:       { id: 'magenta',       hex: '#D946EF', emoji: '🌺' },
  indigo:        { id: 'indigo',        hex: '#4338CA', emoji: '🫐' },
  cyan:          { id: 'cyan',          hex: '#06B6D4', emoji: '💎' },
  teal:          { id: 'teal',          hex: '#0D9488', emoji: '🦚' },
  coral:         { id: 'coral',         hex: '#FB7185', emoji: '🌊' },
  gold:          { id: 'gold',          hex: '#EAB308', emoji: '🏆' },
  'hot-pink':    { id: 'hot-pink',      hex: '#EC4899', emoji: '💖' },
};

// ─────────────────────────────────────────────────────────────────────
// Recipes
// ─────────────────────────────────────────────────────────────────────

export interface Recipe {
  id: string;
  /** Map of colorId → number of parts (1, 2, 3). */
  parts: Record<string, number>;
  /** ResultColor id. */
  result: string;
  /** Pedagogical category — picks the lesson sentence. */
  lesson: LessonTag;
  /** Family of the produced color (warm/cool/neutral) for smart-feedback hints. */
  family: Family;
  /** True if this recipe needs an unlockable tube. */
  needsUnlock?: boolean;
}

const r = (
  id: string,
  parts: Record<string, number>,
  result: string,
  lesson: LessonTag,
  family: Family,
  needsUnlock = false,
): Recipe => ({ id, parts, result, lesson, family, needsUnlock });

export const RECIPES: Recipe[] = [
  // ── Primary mixes → secondaries (Act 1) ──
  r('purple',  { red: 1, blue: 1 },             'purple',  'primary-mix', 'cool'),
  r('orange',  { red: 1, yellow: 1 },           'orange',  'primary-mix', 'warm'),
  r('green',   { blue: 1, yellow: 1 },          'green',   'primary-mix', 'cool'),

  // ── Tints (+white) — Act 2 ──
  r('pink',        { red: 1, white: 1 },        'pink',        'tint', 'warm'),
  r('light-blue',  { blue: 1, white: 1 },       'light-blue',  'tint', 'cool'),
  r('cream',       { yellow: 1, white: 1 },     'cream',       'tint', 'warm'),

  // ── Shades (+black) — Act 2 ──
  r('dark-red',   { red: 1, black: 1 },         'dark-red',    'shade', 'warm'),
  r('dark-blue',  { blue: 1, black: 1 },        'dark-blue',   'shade', 'cool'),
  r('olive',      { yellow: 1, black: 1 },      'olive',       'shade', 'warm'),

  // ── Neutrals (Act 3) ──
  r('grey',       { white: 1, black: 1 },       'grey',        'neutral', 'neutral'),
  r('brown',      { red: 1, blue: 1, yellow: 1 }, 'brown',     'neutral', 'warm'),
  r('light-grey', { grey: 1, white: 1 },        'light-grey',  'tint',    'neutral'),
  r('charcoal',   { grey: 1, black: 1 },        'charcoal',    'shade',   'neutral'),

  // ── Mid-Act 3 / 5 multi ──
  r('lavender',   { red: 1, blue: 1, white: 1 }, 'lavender',   'tint',    'cool'),
  r('peach',      { red: 1, yellow: 1, white: 1 }, 'peach',    'tint',    'warm'),
  r('mint',       { blue: 1, yellow: 1, white: 1 }, 'mint',    'tint',    'cool'),
  r('rose',       { red: 1, white: 2 },         'rose',        'tint',    'warm'),
  r('beige',      { yellow: 1, white: 1, black: 1 }, 'beige',  'neutral', 'neutral'),
  r('salmon',     { red: 2, white: 1, yellow: 1 }, 'salmon',   'tint',    'warm'),
  r('sage',       { blue: 1, yellow: 1, black: 1 }, 'sage',    'shade',   'cool'),

  // ── Shades (Act 5 cont.) ──
  r('dark-green', { blue: 1, yellow: 1, black: 1 }, 'dark-green', 'shade', 'cool'),
  r('dark-purple',{ red: 1, blue: 1, black: 1 }, 'dark-purple',  'shade', 'cool'),
  r('maroon',     { red: 2, black: 1 },         'maroon',      'shade',   'warm'),

  // ── Tertiaries (Act 4 — need unlocked secondaries) ──
  r('magenta',    { red: 1, purple: 1 },        'magenta',     'tertiary', 'warm', true),
  r('indigo',     { blue: 1, purple: 1 },       'indigo',      'tertiary', 'cool', true),
  r('cyan',       { blue: 1, green: 1 },        'cyan',        'tertiary', 'cool', true),
  r('teal',       { blue: 1, green: 1, black: 1 }, 'teal',     'tertiary', 'cool', true),
  r('coral',      { orange: 1, pink: 1 },       'coral',       'tertiary', 'warm', true),
  r('gold',       { yellow: 1, orange: 1 },     'gold',        'tertiary', 'warm', true),
  r('hot-pink',   { red: 1, pink: 1 },          'hot-pink',    'tertiary', 'warm', true),
];

export const RECIPE_BY_ID: Record<string, Recipe> = RECIPES.reduce(
  (acc, r) => { acc[r.id] = r; return acc; },
  {} as Record<string, Recipe>,
);

// ─────────────────────────────────────────────────────────────────────
// Mix-checking utilities
// ─────────────────────────────────────────────────────────────────────

/** Returns the recipe matched by the given pour map, or null. */
export function findRecipeByPour(pour: Record<string, number>): Recipe | null {
  const pourKeys = Object.keys(pour).filter(k => pour[k] > 0).sort();
  if (pourKeys.length === 0) return null;
  for (const recipe of RECIPES) {
    const recipeKeys = Object.keys(recipe.parts).sort();
    if (recipeKeys.length !== pourKeys.length) continue;
    let match = true;
    for (const k of recipeKeys) {
      if (recipe.parts[k] !== pour[k]) { match = false; break; }
    }
    if (match) return recipe;
  }
  return null;
}

/** Counts total parts in a pour map. */
export function totalParts(pour: Record<string, number>): number {
  return Object.values(pour).reduce((s, n) => s + n, 0);
}

/** Computes a blended hex by weighted average of RGB. */
export function blendHex(pour: Record<string, number>): string {
  const total = totalParts(pour);
  if (total === 0) return '#E5E7EB';
  let r = 0, g = 0, b = 0;
  for (const [id, parts] of Object.entries(pour)) {
    if (!parts) continue;
    const c = COLOR_BY_ID[id];
    if (!c) continue;
    const hex = c.hex.replace('#', '');
    r += parseInt(hex.slice(0, 2), 16) * parts;
    g += parseInt(hex.slice(2, 4), 16) * parts;
    b += parseInt(hex.slice(4, 6), 16) * parts;
  }
  const rr = Math.round(r / total).toString(16).padStart(2, '0');
  const gg = Math.round(g / total).toString(16).padStart(2, '0');
  const bb = Math.round(b / total).toString(16).padStart(2, '0');
  return `#${rr}${gg}${bb}`;
}
