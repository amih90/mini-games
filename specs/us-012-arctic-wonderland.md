# Spec: US-012 — Arctic Wonderland 3D Environment and Scene

## Overview
The Arctic Wonderland scene features an icy blue/white environment with snow particles, iceberg geometry, and an aurora borealis effect in the sky. Players discover Penguin, Polar Bear, and Seal.

## Detailed Requirements

### ArcticEnv.tsx (3D Environment)
- **Terrain**: Plane with white/light blue color (#E8F4FD) representing ice sheet
- **Icebergs**: 3-4 irregular polyhedra (use IcosahedronGeometry with low detail and scaled non-uniformly) in white/blue, positioned at scene edges
- **Snow Particles**: ~40 small white sphere particles drifting downward with gentle horizontal sway, reset to random top position when below ground
- **Aurora Borealis**: Large plane positioned at y=8, z=-5 with an animated gradient material — colors cycle slowly between green (#00FF7F), purple (#8A2BE2), and blue (#00BFFF) using uniforms in `useFrame`
- **Lighting**: Cool blue ambient (color: #B0E0E6, intensity: 0.5) + white directional from above (simulating reflected snow light)
- **Ice Reflections**: Ground plane with slight metalness (0.3) and roughness (0.7) for subtle reflection
- **Camera**: Fixed at [0, 2, 7] looking at [0, 0, 0]

### ArcticWonderland.tsx (Scene Logic)
- Same encounter pattern as previous scenes
- Animal positions: Penguin [-2, 0.3, 1] (on ice), Polar Bear [2, 0.5, -1] (slightly hidden), Seal [0, 0.2, 2] (near water edge)
- Penguin has waddle animation (small rotation oscillation on z-axis)
- Polar Bear has slow walk animation (position drift)
- Seal has flipper-clap animation (small mesh or emoji scale bounce)

## Technical Approach
- Aurora: simplest approach is a wide mesh with ShaderMaterial that blends 3 colors using time-based sine functions. If too complex, use a regular MeshBasicMaterial with color animated via useFrame
- Snow: array of positions updated in useFrame, each particle has random x-drift and consistent y-fall speed
- Follow same component structure as prior scene components

## Constraints
- Aurora shader must be simple — no complex GLSL. If ShaderMaterial is too complex for one iteration, use animated MeshBasicMaterial color
- Snow limited to 40 particles for performance
- Same ≤80 draw call budget

## Test Scenarios
- Scene loads with ice, snow, and aurora visible
- Aurora colors shift over time
- Snow particles fall continuously
- All 3 animals visible and tappable
- Full encounter sequence works
