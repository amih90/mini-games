# Andy — History

## Project Context

- **Project:** mini-games — a kids' mini-games platform with multiple browser-based games
- **Stack:** Next.js, React, TypeScript, Tailwind CSS, next-intl (i18n), Three.js / React Three Fiber
- **User:** Ami Hollander
- **Team:** Mikey (Lead), Data (Frontend Dev), Chunk (Game Dev), Mouth (Tester), Andy (3D Game Designer), Scribe, Ralph

## Key Paths

- `src/features/games/` — all game folders
- `src/features/games/solar-system-3d/` — example 3D game
- `src/features/games/shape-sorter-3d/` — example 3D game
- `src/features/games/backgammon-phaser/` — Phaser-based game
- `src/features/games/sprint-race-phaser/` — Phaser-based game
- `src/features/games/shared/` — shared game utilities and components
- `src/hooks/useRetroSounds.ts` — retro sound hook (wire to game events)
- `messages/` — i18n translation files (en, he, zh, es)

## Learnings

### 2026-03-31 — Merge Tank Tactics (merge-tank-tactics)
- Built full R3F game: 17 files, isometric 3D view, procedural tank geometry
- Patterns used: useReducer for game state, useFrame for battle animation loop
- Key files: MergeTankTacticsGame.tsx (root), BattleArena.tsx (R3F scene), useMergeTankGame.ts (state)
- Grid: two 4×3 grids in world space, player near (z+), enemy far (z-)
- Tanks: Box+Cylinder THREE.js geometry, level-colored materials, emissive on L5
- FX: ExplosionFX (Points particle burst), MergeSparks, ProjectileFX (lerp path), HPBar (drei Html)
- PostFX: Bloom + Vignette via @react-three/postprocessing
- Camera shake: useThree camera + shakeRef in useFrame
- i18n: all 4 locales, keyboard shortcuts [M]/[R] for buy, [Enter]/[Space] for start
- Sound: playClick/playSuccess/playWin/playGameOver/playHit/playPowerUp/playMove all wired
- `playError` does NOT exist in useRetroSounds — use `playGameOver` for negative feedback
