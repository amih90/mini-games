export const ARENA_FOV = 42;
export const ARENA_PITCH = 50 * Math.PI / 180;
export const ARENA_FOCUS_HEIGHT = .6;

export function arenaCameraPosition(aspect: number): [number, number, number] {
  const sine = Math.sin(ARENA_PITCH);
  const cosine = Math.cos(ARENA_PITCH);
  const tangent = Math.tan(ARENA_FOV * Math.PI / 360) * .86;
  let distance = 0;
  for (const z of [-6, 6]) {
    for (const height of [0, 2.4]) {
      const y = height - ARENA_FOCUS_HEIGHT;
      const depth = y * sine + z * cosine;
      distance = Math.max(distance, depth + Math.max(9 / (tangent * aspect), Math.abs(y * cosine - z * sine) / tangent));
    }
  }
  return [0, ARENA_FOCUS_HEIGHT + distance * sine, distance * cosine];
}
