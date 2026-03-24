---
name: "game-quality"
description: "Audit and enforce quality standards on a single game: i18n, difficulty levels, sounds, input support, instructions modal, and Playwright screenshot thumbnail."
domain: "game-development"
confidence: "high"
source: "manual"
---

## SCOPE

✅ THIS SKILL PRODUCES:
- A quality audit report for the target game
- Fixes for any missing requirements (i18n, levels, sounds, input, instructions)
- A Playwright screenshot thumbnail at `public/images/games/screenshots/{slug}.png`
- Updated `game.config.ts` with correct `icon` and `thumbnail` fields

❌ THIS SKILL DOES NOT PRODUCE:
- New game implementations from scratch (use `create-new-game.prompt.md`)
- Infrastructure or deployment changes
- Changes to games other than the target slug

## INPUT

The user provides a **game slug** (e.g., `snake`, `chess`, `flappy-bird`).

If no slug is provided, ask: *"Which game slug should I audit?"*

## PREREQUISITES

Before running the audit, ensure Playwright is installed:

```bash
# Install dependencies (includes @playwright/test)
npm install

# Install Playwright browsers (chromium is sufficient)
npx playwright install chromium
```

## WORKFLOW

### Phase 1: Audit

Read the game's source files and check each requirement against the standards defined in `.github/game-improvement-agent.md`.

**Files to read:**
- `src/features/games/{slug}/{Name}Game.tsx` (main game component)
- `src/features/games/{slug}/game.config.ts` (game configuration)
- `src/features/games/{slug}/index.ts` (exports)
- `messages/en.json`, `messages/he.json`, `messages/zh.json`, `messages/es.json` (if the game uses next-intl)

**Checklist — all 6 must pass:**

| # | Requirement | What to check |
|---|-------------|---------------|
| 1 | **Difficulty Levels** | At least 3 levels (easy/medium/hard) with a `DIFFICULTY_SETTINGS` record or equivalent. Difficulty selector shown before game starts. |
| 2 | **Internationalization** | All user-facing strings in 4 locales (en, he, zh, es). RTL layout when `locale === 'he'`. |
| 3 | **Retro Sounds** | Imports `useRetroSounds` from `@/hooks/useRetroSounds`. Sounds wired to game events. No `useSoundEffects` imports. No inline `useRetroSounds` definitions. |
| 4 | **Instructions Modal** | Uses `InstructionsModal` from shared components. Instructions in all 4 locales. Feynman-style explanations. |
| 5 | **Input Support** | Keyboard (arrows + WASD), mouse/click, and touch (touchstart/touchmove/touchend) handlers present. |
| 6 | **Screenshot Thumbnail** | `game.config.ts` has `thumbnail: '/images/games/screenshots/{slug}.png'` and `icon` emoji field. Screenshot file exists. |

**Output the audit as a markdown table:**

```markdown
| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Difficulty Levels | ✅ / ❌ | ... |
| 2 | Internationalization | ✅ / ❌ | ... |
| 3 | Retro Sounds | ✅ / ❌ | ... |
| 4 | Instructions Modal | ✅ / ❌ | ... |
| 5 | Input Support | ✅ / ❌ | ... |
| 6 | Screenshot Thumbnail | ✅ / ❌ | ... |
```

### Phase 2: Fix

For each ❌ item, implement the fix following the patterns in `.github/game-improvement-agent.md`:

1. **Difficulty Levels** — Add `type Difficulty = 'easy' | 'medium' | 'hard'` and `DIFFICULTY_SETTINGS` record. Add difficulty selector UI before game starts.
2. **Internationalization** — Add translations object with all 4 locales, or add keys to `messages/*.json`. Add `isRtl` check.
3. **Retro Sounds** — Replace `useSoundEffects` with `useRetroSounds`. Wire sounds to game events per the mapping table.
4. **Instructions Modal** — Add `InstructionsModal` with translated instructions, controls, and tip.
5. **Input Support** — Add keyboard, mouse, and touch event handlers.
6. **Screenshot Thumbnail** — Update `game.config.ts` if `icon`/`thumbnail` are missing.

### Phase 3: Generate Screenshot

After fixes are applied, generate the Playwright screenshot:

```bash
# Start dev server if not running
npm run dev &

# Generate screenshot for this game
GAME_SLUG={slug} npx playwright test e2e/generate-thumbnails.spec.ts

# Verify the screenshot was created
ls -la public/images/games/screenshots/{slug}.png
```

If the dev server is already running, skip starting it. The Playwright config at `playwright.config.ts` expects the app at `http://localhost:3000`.

### Phase 4: Verify

1. Run `npm run build` to verify no TypeScript errors
2. Confirm the screenshot file exists at `public/images/games/screenshots/{slug}.png`
3. Re-run the audit checklist — all 6 items should now be ✅

## REFERENCE GAMES

Use these as examples of well-implemented games:
- **Canvas game**: `src/features/games/snake/SnakeGame.tsx`
- **Board game**: `src/features/games/checkers/CheckersGame.tsx`
- **Phaser game**: `src/features/games/sprint-race-phaser/`

## RELATED FILES

- `.github/game-improvement-agent.md` — Full requirements with code patterns
- `src/features/games/shared/` — GameWrapper, WinModal, InstructionsModal, LevelDisplay
- `src/hooks/useRetroSounds.ts` — Shared sound effects hook
- `e2e/generate-thumbnails.spec.ts` — Playwright screenshot generator
- `playwright.config.ts` — Playwright configuration
