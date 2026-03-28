# Spec: US-010 — Amazon Rainforest 3D Environment and Scene

## Overview
The Amazon Rainforest is the second continent scene. It features a lush, dense green environment with rain particles, waterfalls, and firefly lights. Players discover Poison Dart Frog, Sloth, and Toucan. This scene follows the same encounter pattern established by the Savanna scene.

## Detailed Requirements

### RainforestEnv.tsx (3D Environment)
- **Terrain**: Plane with dark green/brown color (#2D5F2D) representing forest floor
- **Canopy Layers**: 2-3 large green flattened spheres positioned at y=4-6 to create overhead canopy feel
- **Tree Trunks**: 4-6 cylinder trunks (brown, tall and thin) reaching up to canopy
- **Waterfall**: Vertical particle stream (white/blue particles falling along a z-plane at scene edge) using drei `Points` — ~50 particles in a narrow column
- **Rain**: Light rain particle effect — ~30 small particles falling randomly across the scene, reset to top when reaching bottom
- **Fireflies**: 5-8 small point lights (yellow/green, low intensity 0.3) with gentle wandering movement using sine waves in `useFrame`
- **Lighting**: Green-tinted ambient (color: #90EE90, intensity: 0.3) + filtered directional from above (simulating canopy-filtered sunlight)
- **Camera**: Fixed at [0, 2, 7] looking at [0, 1, 0] — angled slightly up to show canopy

### AmazonRainforest.tsx (Scene Logic)
- Same state machine pattern as AfricanSavanna: intro → exploring → encounter cycle × 3 → complete
- Animal positions: Frog [-2, 0, 1] (on ground), Sloth [1, 3, -1] (in canopy), Toucan [2, 4, 0] (high in tree)
- Frog has a small random hop animation (y oscillation)
- Sloth moves very slowly side-to-side
- Toucan has wing-flap animation (scale oscillation on x-axis)
- Kiwi intro plays on entry with rainforest-themed dialogue

## Technical Approach
- Follow exact same component structure as AfricanSavanna.tsx
- Reuse all shared components: KiwiGuide, AnimalCard, StarReward
- Rain and waterfall use simple particle arrays updated in useFrame
- Fireflies are small meshes with emissive material

## Constraints
- Rain particles must not impact performance — cap at 30 particles
- Firefly lights limited to 8 (GPU point light limit consideration)
- Same draw call budget: ≤80

## Test Scenarios
- Scene loads with visible canopy, rain, and fireflies
- All 3 animals positioned correctly and tappable
- Waterfall particles animate continuously
- Encounter sequence works: click animal → Kiwi → fact card → challenge → reward
- Scene completion triggers after all 3 animals
