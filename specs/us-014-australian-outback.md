# Spec: US-014 — Australian Outback 3D Environment and Scene

## Overview
The Australian Outback scene features a warm red/orange desert at night with eucalyptus trees, a starfield, and a glowing campfire. Players discover Kangaroo, Koala, and Platypus.

## Detailed Requirements

### OutbackEnv.tsx (3D Environment)
- **Terrain**: Plane with red/orange color (#C2642A) representing desert sand
- **Eucalyptus Trees**: 3-4 trees built from cylinder trunks (light gray bark) + elongated spheres (sage green #8FBC8F) for foliage. Taller and thinner than savanna acacias
- **Night Sky**: Dark background (near black #0D1117) with drei `Stars` component (count: 200, depth: 50, factor: 4, saturation: 0)
- **Campfire**: Central point of interest:
  - Base: small stack of cylinder logs (brown, crossed)
  - Flame: 2-3 small cones (orange/yellow) with scale oscillation in useFrame for flicker
  - Light: PointLight (color: #FF6600, intensity: 1.5, distance: 8) with intensity oscillation (±0.3) for flicker effect
  - Embers: 10-15 small particles (orange dots) rising from fire position, drifting upward with random horizontal spread, fading out at height 3+
- **Lighting**: Very low ambient (intensity: 0.15) — campfire is primary light source. Warm orange tones dominate
- **Camera**: Fixed at [0, 2, 7] looking at [0, 0, 0]

### AustralianOutback.tsx (Scene Logic)
- Same encounter pattern as previous scenes
- Animal positions: Kangaroo [-2, 0.5, 1] (near campfire), Koala [2, 2.5, -1] (in tree), Platypus [0, 0.2, 3] (near imaginary water edge)
- Kangaroo has hopping animation (y-position bounce)
- Koala is mostly still with occasional slow blink (scale pulse)
- Platypus has waddle/swim animation (gentle side-to-side)
- Night scene should feel cozy and safe (campfire warmth, not scary darkness)

## Technical Approach
- Campfire flicker: `useFrame` updates PointLight intensity with `Math.sin(clock.getElapsedTime() * 10) * 0.3 + 1.5`
- Embers: small mesh array with y-position incrementing in useFrame, reset when y > 3
- Stars: drei `Stars` component handles the starfield efficiently
- Eucalyptus trees: same procedural approach as other environments

## Constraints
- Night scene must still be bright enough that animals are clearly visible — campfire light reaches all animal positions
- Single PointLight for campfire (plus ambient) to stay within light budget
- Same ≤80 draw call budget

## Test Scenarios
- Scene loads with dark sky, visible stars, and warm campfire
- Campfire flame flickers and light pulses
- Ember particles rise from fire
- All 3 animals visible despite dark setting
- Full encounter sequence works
