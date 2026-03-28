# Spec: US-016 — Ocean Deep 3D Environment and Scene

## Overview
The Ocean Deep scene takes players underwater with coral reefs, rising bubble particles, and shimmering light rays from the surface. Players discover Dolphin, Sea Turtle, and Blue Whale. This is the final continent before the Grand Finale.

## Detailed Requirements

### OceanEnv.tsx (3D Environment)
- **Background**: Deep blue gradient — use a large box or sphere with dark blue material (#0A1628 at bottom, #1E90FF at top). Alternatively, set `scene.background` to a gradient color
- **Ocean Floor**: Plane at y=-2 with sandy color (#C2B280)
- **Coral Reef**: 5-8 coral shapes built from scaled/colored primitives:
  - Branch coral: thin cylinders (pink #FF6B8A) at various angles
  - Brain coral: small spheres (orange #FF8C42)
  - Fan coral: flattened cylinders (purple #9370DB)
  - Positioned along the ocean floor in a cluster
- **Bubbles**: 20-30 small transparent spheres rising from bottom with slight horizontal sway. Use instanced meshes with positions updated in useFrame. Each bubble has random size (0.02-0.08), random x/z start, consistent upward speed, resets to bottom when reaching y=5
- **Light Rays**: 3-4 tall, narrow plane meshes positioned vertically at various x positions, with semi-transparent white material (opacity: 0.1-0.2). Animated opacity oscillation in useFrame to create shimmering effect
- **Seaweed**: 2-3 simple elongated shapes on ocean floor with gentle sway animation (rotation oscillation on z-axis)
- **Lighting**: Blue-tinted ambient (color: #4169E1, intensity: 0.4) + directional from above (simulating surface light, color: #87CEEB, intensity: 0.8)
- **Camera**: Fixed at [0, 0, 7] looking at [0, 0, 0] — positioned at "water level" for immersive feel

### OceanDeep.tsx (Scene Logic)
- Same encounter pattern as previous scenes
- Animal positions: Dolphin [-2, 1, 0] (mid-water), Sea Turtle [2, -0.5, 1] (near floor), Blue Whale [0, 2, -3] (large, in background)
- Dolphin has arc/jump animation (sinusoidal y-position)
- Sea Turtle has slow, gentle paddle animation (rotation oscillation)
- Blue Whale is notably larger than other animals (scale: 2x) — moves slowly across background
- This is scene 5 of 5 — completion of this scene triggers the Grand Finale check

## Technical Approach
- Underwater feel: low ambient light + blue tint creates depth
- Bubbles: use a reusable particle array pattern from rain/snow in prior scenes, but rising instead of falling
- Light rays: MeshBasicMaterial with transparent=true, opacity animated via useFrame
- Coral: all procedural geometry — no model loading
- Blue Whale's large scale should be immediately striking — this teaches "biggest animal ever"

## Constraints
- Bubble instancing recommended for performance (30 bubbles)
- Light ray planes must be double-sided and transparent
- Coral reef geometry should be simple (no complex branching) — ~15 primitives max
- Same ≤80 draw call budget
- Camera at y=0 (water level) not y=2 like land scenes

## Test Scenarios
- Scene loads with blue underwater environment
- Bubbles rise continuously
- Light rays shimmer with animated opacity
- Coral reef visible on ocean floor
- All 3 animals visible and tappable
- Blue Whale is visibly larger than other animals
- Full encounter sequence works
- Completing all 3 animals in this scene triggers finale availability
