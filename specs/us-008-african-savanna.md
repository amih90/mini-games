# Spec: US-008 — African Savanna 3D Environment and Scene

## Overview
The African Savanna is the first continent scene players visit. It establishes the visual and interaction pattern that all subsequent scenes follow. The environment features golden grasslands, acacia trees, and warm sunset lighting. Players discover Lion, Elephant, and Giraffe through a guided sequence of encounters.

## Detailed Requirements

### SavannaEnv.tsx (3D Environment)
- **Terrain**: Large flat Plane (20×20) with golden/tan color (#D4A843)
- **Trees**: 3-5 acacia tree shapes built from simple geometry — cylinder trunk (brown) + flattened sphere canopy (dark green). Positioned randomly but seeded for consistency
- **Sky**: Use drei `Sky` component with warm sunset settings (sunPosition: [1, 0.2, 0], turbidity: 10) OR a gradient plane
- **Lighting**: Warm directional light (color: #FFD700, intensity: 1.2, position: [5, 5, 5]) + soft ambient light (intensity: 0.4)
- **Atmosphere**: Dust mote particles — ~20 small spheres floating with gentle random drift using `useFrame`
- **Camera**: Fixed at [0, 3, 8] looking at [0, 0, 0]

### AfricanSavanna.tsx (Scene Logic)
- Manages a local state machine: `intro` → `exploring` → `encounter` → `factCard` → `challenge` → `reward` → (repeat ×3) → `complete`
- On mount, plays Kiwi intro dialogue (storyIntro from scene data)
- In `exploring` phase, 3 animals visible as clickable emojis using drei `Billboard` + `Html`
- Animals positioned at: Lion [-2, 0.5, 0], Elephant [2, 0.5, -1], Giraffe [0, 0.5, 2]
- Each animal has a gentle `Float` bounce animation
- On click: transitions to `encounter` → shows Kiwi dialogue → `factCard` (AnimalCard) → `challenge` (respective challenge component) → `reward` (StarReward)
- After all 3: `complete` phase shows scene star sticker and "Back to Globe" button
- Each animal click triggers `playClick()`, discovery triggers `playPowerUp()`

## Technical Approach
- SavannaEnv is a pure 3D component (no state management) — just renders the environment meshes and lights
- AfricanSavanna wraps SavannaEnv in a Canvas and layers the UI components (KiwiGuide, AnimalCard, challenge components) as HTML overlays
- Challenge components render as 2D React overlays on top of the 3D scene (not inside the Canvas)
- Use `useState` for scene phase management, `useCallback` for event handlers

## Constraints
- Total draw calls ≤ 80
- Must work on mobile Safari WebGL
- Animals must be clearly visible and tappable (large enough on mobile screens)
- No complex mesh loading — all geometry is procedural (primitives)

## Test Scenarios
- Scene loads without errors
- Kiwi intro dialogue appears on scene entry
- All 3 animals are visible and tappable
- Clicking an animal triggers the encounter sequence
- After completing all 3 encounters, scene completion fires
- Star reward animates properly
- Scene can be revisited after completion (animals still visible, facts reviewable)
