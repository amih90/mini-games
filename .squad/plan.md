Here is a **full Game Design specification in English** for your **2D turn-based strategy merge tank game** 🎮💥

## Similar implementation to https://www.crazygames.com/game/merge-master-tanks-tank-wars

# 🎮 Game Title (Working Name)

**Merge Tank Tactics**

---

# 🧭 Game Genre

- 2D Game
- Turn-Based Strategy
- Merge Mechanics
- Auto-Battle Combat
- Single Player Progression

The game is inspired by turn-based strategy games and merge mechanics, where players **buy, merge, place, and battle tanks on a grid**.

---

# 🔁 Core Gameplay Loop

1. Buy Level 1 tanks
2. Merge identical tanks
3. Place tanks on grid
4. Start battle
5. Tanks fight automatically in turns
6. Win → receive rewards
7. Next stage becomes harder
8. Repeat

---

# 🖥️ Game Structure

The game consists of **two phases**:

### 1. Preparation Phase

- Player grid
- Tank shop
- Merge area
- Start battle button

### 2. Battle Phase

- Player grid vs enemy grid
- Turn-based automatic combat
- Attack animations
- Victory / defeat screen

---

# 🔲 Grid System

- Each side has a grid
- Example: 4 columns × 3 rows
- Tanks stay in place (no movement)
- Only attack within range

Example layout:

Enemy Grid
[ ][ ][ ][ ]
[ ][ ][ ][ ]
[ ][ ][ ][ ]

Player Grid
[ ][ ][ ][ ]
[ ][ ][ ][ ]
[ ][ ][ ][ ]

---

# 🚜 Tank Types (Level 1 only purchasable)

There are **2 base tank types**:

### 1. Melee Tank

- Attacks adjacent tiles only
- High HP ❤️
- High damage 💥
- Range = 1

### 2. Range Tank

- Attacks from distance 🎯
- Lower HP
- Medium damage
- Range = 2–4 tiles

---

# ⭐ Tank Merge System

Players can merge tanks **before battle**.

Rules:

- Same type only
- Same level only
- Drag one tank onto another
- Maximum Level = 5

Merge progression:

- Level 1 + Level 1 → Level 2
- Level 2 + Level 2 → Level 3
- Level 3 + Level 3 → Level 4
- Level 4 + Level 4 → Level 5

---

# 📊 Tank Level Scaling

Each level increases:

- HP
- Attack
- Visual size
- Power effect

Example scaling:

### Melee Tank

Level 1 → HP 100 / Attack 20
Level 2 → HP 160 / Attack 35
Level 3 → HP 260 / Attack 55
Level 4 → HP 400 / Attack 85
Level 5 → HP 600 / Attack 130

### Range Tank

Level 1 → HP 70 / Attack 25
Level 2 → HP 110 / Attack 40
Level 3 → HP 180 / Attack 65
Level 4 → HP 280 / Attack 100
Level 5 → HP 420 / Attack 150

---

# 🛒 Shop System

Player can buy:

- Level 1 Melee Tank
- Level 1 Range Tank

Shop rules:

- Cost increases per purchase
- Resets each stage

Example:

- Purchase 1 → 10 gold
- Purchase 2 → 12 gold
- Purchase 3 → 15 gold

---

# ⚔️ Battle System (Turn-Based)

Combat is **automatic** and **turn-based**.

Turn order:

1. Player tank
2. Enemy tank
3. Player tank
4. Enemy tank

Or optionally:

- Initiative based system

---

# 🎯 Targeting Logic

Tank attacks:

1. Closest enemy in range
2. If none in range → skip turn

---

# 💥 Damage Formula

Simple formula:
Damage = Attack − Defense

Or simplified:
Damage = Attack × LevelMultiplier

---

# ❤️ Tank Stats Structure

Each tank contains:

- id
- type (melee / range)
- level
- hp
- attack
- defense
- range

---

# 🤖 Enemy AI

Enemy tanks are pre-generated per stage.

Example:
Stage 1 → 3 Level 1 tanks
Stage 3 → 1 Level 2 + 2 Level 1
Stage 5 → 2 Level 3 tanks
Stage 10 → Boss

---

# 👑 Boss Units (Optional)

Boss tanks:

- Very high HP
- Area damage
- Special attack every 2 turns

---

# 🏆 Rewards

After victory:

- Gold 💰
- Next stage unlock
- Difficulty increase

---

# 📈 Progression System

- Stage 1
- Stage 2
- Stage 3
- Infinite scaling

Each stage:

- More enemy tanks
- Higher levels
- Harder formations

---

# 🎨 Visual Style

- 2D Cartoon style
- Top-down or slight angle view
- Bright colorful tanks
- Simple particle effects
- Explosion effects

---

# 🧱 Technical Architecture (Suggested)

Main Components:

- GameManager
- GridSystem
- TankComponent
- MergeSystem
- ShopSystem
- BattleSystem
- EnemyAI
- UIManager

---

# 🔥 Optional Future Features

- Critical hits
- Tank abilities
- Elements (fire, ice, etc.)
- PvP mode
- Permanent upgrades
- Daily rewards

---

# 🎯 Minimum Viable Product (MVP)

To start development:

- 2D grid
- 2 tank types
- Merge system
- Turn-based auto battle
- Enemy AI
- Gold rewards

---

If you want, I can also:

- Write the **full game architecture** 🧠
- Create **TypeScript interfaces** 🧑‍💻
- Build **Three.js / React Three Fiber structure**
- Design **UI wireframe** 🎨

---

# 🛠️ Technical Implementation Plan

## Stack Decision

**Engine:** React Three Fiber (R3F) + Three.js  
**Camera:** Perspective, fixed at ~60° isometric angle — gives depth without full 3D navigation  
**Tanks:** Procedural THREE.js geometry (Box + Cylinder combos) — no external GLB assets needed  
**UI HUD:** 2D React overlay (absolute positioned) on top of Canvas  
**Post-processing:** Bloom + vignette via `@react-three/postprocessing`  
**Particles:** GPU-instanced Points for explosions, merge sparks, death smoke  

## File Structure

```
src/features/games/merge-tank-tactics/
├── MergeTankTacticsGame.tsx    ← Root component (phases: prep / battle / result)
├── game.config.ts              ← GameConfig (slug, i18n, engine: 'r3f')
├── index.ts                    ← Default export
├── types.ts                    ← TankType, TankUnit, GridCell, BattleEvent, Stage
├── components/
│   ├── BattleArena.tsx         ← R3F Canvas root, scene orchestrator
│   ├── BattleGrid.tsx          ← Two 4×3 grids, glow on hover, highlight on select
│   ├── TankMesh.tsx            ← Per-tank 3D geometry, level-scaled, material by type
│   ├── HPBar.tsx               ← Billboard HTML HP bar (drei <Html>)
│   ├── ProjectileFX.tsx        ← Animated shell/bullet flying between tanks
│   ├── ExplosionFX.tsx         ← Particle burst on tank death
│   ├── MergeSparks.tsx         ← Sparkle burst on successful merge
│   ├── BattleAnimator.tsx      ← Reads battle event queue, drives FX timing
│   └── Terrain.tsx             ← Stylized ground plane, grass texture, edge bevels
├── hooks/
│   ├── useMergeTankGame.ts     ← Central game state (Zustand or useReducer)
│   ├── useBattleLoop.ts        ← Turn-by-turn logic, targeting, damage, event queue
│   ├── useDragMerge.ts         ← Raycasting-based drag for merge on grid
│   └── useStageAI.ts           ← Enemy formation generator per stage
├── data/
│   ├── tankStats.ts            ← Level 1–5 HP/attack tables for melee & range
│   └── stages.ts               ← Stage 1–10+ enemy formations
└── shaders/
    └── gridCell.glsl           ← Custom shader for animated cell highlight pulse
```

## Visual Identity

| Element | Design |
|---------|--------|
| Tank body | Low-poly box + turret cylinder, flat shading |
| Level colors | L1=gray, L2=green, L3=blue, L4=purple, L5=gold |
| Player side | Blue-tinted ground plane |
| Enemy side | Red-tinted ground plane |
| Merge FX | Spiral golden sparkles, scale-up pop |
| Attack FX | Fast cylinder projectile + hit flash + screen shake |
| Death FX | Orange particle burst + tank shrinks + smoke linger |
| Post-proc | Bloom on impacts, vignette on battle start |

## Camera Setup
```typescript
position: [0, 14, 10]   // isometric fixed angle
fov: 45
lookAt: [0, 0, 0]
// No orbit controls in gameplay — locked perspective
```

## Grid Layout (world coords)
```
Enemy grid:  x: [-3, 3],  z: [-5, -2]  (far side)
Player grid: x: [-3, 3],  z: [ 2,  5]  (near side)
Cell size: 1.5 world units
```

## Drag-Merge Interaction
- Mouse/touch down → raycast → pick tank
- Hover candidate cell → highlight if valid merge target
- Mouse/touch up over valid target → trigger merge animation + combine
- Drag to empty cell → move tank
- Pointer events pass through Canvas via `pointerEvents: none` on HUD layer

## Turn Battle Animation Timeline (per turn)
1. Attacker glow pulse (0.3s)
2. Projectile flies (0.4s lerp)
3. Hit flash on target (0.1s)
4. HP bar animates down (0.3s)
5. If HP=0: explosion burst + tank dissolve (0.8s)
6. Next attacker starts after (0.2s pause)

## i18n Namespaces Required
```json
"mergeTankTactics": {
  "title": "...",
  "buy": "...", "merge": "...", "battle": "...",
  "melee": "...", "range": "...",
  "stage": "...", "gold": "...",
  "easy": "...", "medium": "...", "hard": "...",
  "instructions": { "title": "...", "step1": "...", ... }
}
```
Required locales: en, he (RTL), zh, es

## Quality Checklist
- [ ] 3 difficulty levels (easy/medium/hard) with enemy count + gold scaling
- [ ] i18n 4 locales (en, he, zh, es)
- [ ] useRetroSounds wired to: buy, merge, battleStart, hit, explosion, win, lose
- [ ] InstructionsModal with Feynman explanations all locales
- [ ] Keyboard (arrow keys for cell nav) + mouse + touch (drag)
- [ ] Playwright screenshot at public/images/games/screenshots/merge-tank-tactics.png
- [ ] icon: '🪖' in game.config.ts
