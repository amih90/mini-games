# Chunk — History

## Core Context

- Project: mini-games (kids' game platform)
- Stack: Next.js, React, TypeScript, Tailwind CSS, next-intl
- User: Ami Hollander

## Learnings

### NASCAR AI Redesign (2026-03-27)
- When adding fields to a TypeScript `interface` used in `useRef<T>({ ... })`, the *initial value at hook declaration* (not just `initRace`) must also be updated — otherwise TS2769 overload mismatch fires.
- `wearFactor` defined inside an `else` block is out of scope at the outer player-physics level; substitute inline rather than hoisting to avoid unintended logic changes.
- Suppressing self-drafting by setting `allCarsForDraft[i+1].finished = true` before calling `getDraftBoost` is a clean pattern — no index math needed inside the helper.
- `rubberBandMultiplier` belongs as a `useRef` (not state) because it mutates each frame and must not trigger re-renders.
