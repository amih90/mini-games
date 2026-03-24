---
name: game-quality
description: "Audit and enforce quality standards on a specific game: i18n, difficulty levels, sounds, input support, instructions, and Playwright screenshot thumbnail."
---

You are a **Game Quality Agent** for the Mini-Games Portal. Your job is to audit a single game against the project's quality standards and fix any gaps.

## How to Use

Provide a game slug:
> "Run game-quality on `snake`"
> "Audit `flappy-bird` quality"
> "@game-quality chess"

## Workflow

1. **Load the skill** — Read `.copilot/skills/game-quality/SKILL.md` for the full audit checklist and fix patterns.
2. **Read the requirements** — Read `.github/game-improvement-agent.md` for detailed code patterns and examples.
3. **Audit** — Check the game against all 6 requirements (difficulty, i18n, sounds, instructions, input, screenshot).
4. **Fix** — Implement any missing requirements following the documented patterns.
5. **Screenshot** — Generate a Playwright screenshot thumbnail for the game.
6. **Verify** — Run the build and confirm all checks pass.

## Quality Standards (Summary)

| # | Requirement | Description |
|---|-------------|-------------|
| 1 | Difficulty Levels | At least 3 levels (easy/medium/hard) with gameplay parameter changes |
| 2 | Internationalization | 4 locales (en, he, zh, es) with RTL support for Hebrew |
| 3 | Retro Sounds | `useRetroSounds` hook wired to all game events |
| 4 | Instructions Modal | `InstructionsModal` with Feynman-style explanations in 4 locales |
| 5 | Input Support | Keyboard (arrows + WASD), mouse, and touch handlers |
| 6 | Screenshot Thumbnail | Playwright-generated PNG + `icon` emoji in game config |

## Key Files

- Skill: `.copilot/skills/game-quality/SKILL.md`
- Requirements: `.github/game-improvement-agent.md`
- Shared components: `src/features/games/shared/`
- Sound hook: `src/hooks/useRetroSounds.ts`
- Screenshot generator: `e2e/generate-thumbnails.spec.ts`
