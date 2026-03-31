'use client';

/**
 * Minimal terrain — kept as a fallback ground plane.
 * Primary environment rendering is handled by Environment.tsx (HDRI + themed props).
 */
export function Terrain() {
  // Intentionally empty: Environment.tsx renders the ground, divider, and props.
  // This component is preserved for backward-compat import in BattleArena.tsx.
  return null;
}
