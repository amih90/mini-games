# Spec: US-007 — Hub Scene with Interactive World Globe

## Overview
The Hub is the player's home base — a 3D scene with a spinning globe where continents glow as selectable hotspots. As players complete scenes, discovered animals populate the garden around the globe, and completed continents show star badges. This is the first R3F scene the player sees and sets the visual tone for the entire game.

## Detailed Requirements

### WorldGlobe.tsx
- Render a 3D sphere using `@react-three/drei` Sphere component (radius ~2, widthSegments: 32, heightSegments: 32)
- Apply a simple blue/green color scheme (no texture map needed — use vertex colors or simple material)
- Place 5 continent hotspots as Billboard components (from drei) at approximate lat/long positions on the sphere:
  - Africa: position roughly [0.5, 0.3, 1.8]
  - Amazon: position roughly [-1.5, 0, 1.2]
  - Arctic: position roughly [0, 1.8, 0.5]
  - Australia: position roughly [1.5, -0.8, 1.0]
  - Ocean: position roughly [-0.5, -1.0, 1.5]
- Each hotspot renders the continent's emoji + name as an Html overlay (from drei)
- Hotspot states: locked (dimmed, no pulse), available (glowing pulse), completed (gold star overlay)
- Globe auto-rotates slowly (0.005 rad/frame) but stops on hover/touch
- onClick on hotspot triggers scene navigation callback

### AnimalGarden.tsx
- Render discovered animal emojis as Float components (from drei) arranged in a circle around the globe
- Each animal gently bobs up and down with randomized phase offset
- Animals appear with a pop-in animation when first discovered (scale from 0 to 1)
- Maximum 15 animals arranged evenly in a circle at radius ~4 from globe center

### AlbumViewer.tsx
- 2D React overlay (not 3D) — renders on top of the Canvas
- Grid of 15 cells (5 columns × 3 rows)
- Undiscovered animals show as gray silhouette (emoji with CSS grayscale filter)
- Discovered animals show full-color emoji with name below
- Counter at top: "X / 15 Friends Found" (localized)
- Toggle button to open/close the album panel
- Slide-in animation from bottom on mobile

## Technical Approach
- Use a single R3F `<Canvas>` with `<Suspense>` fallback
- Globe and garden are 3D; album viewer is a 2D React overlay using `position: absolute` on top of canvas
- Use `useFrame` for globe rotation
- Use `drei` Html component for hotspot labels (renders DOM inside 3D)
- Camera: fixed position `[0, 2, 8]`, lookAt `[0, 0, 0]` — no OrbitControls (prevents kids from losing the globe)

## Constraints
- Max 40 draw calls for the entire hub scene
- Globe must be touch-responsive — onPointerDown/Up for mobile
- No orbit controls — camera is fixed to prevent disorientation
- Must render on WebGL1 (no WebGL2-only features)
- Canvas height: min 400px, max 600px on mobile

## Test Scenarios
- Globe renders with 5 visible hotspots
- Tapping a hotspot triggers navigation callback with correct scene ID
- Completed scenes show star overlay on globe
- Album viewer opens/closes with animation
- Album correctly reflects discovered animals from localStorage
- Adding a new animal to album triggers pop-in animation in garden
