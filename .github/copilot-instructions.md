# Copilot Coding Agent — Squad Instructions

You are working on a project that uses **Squad**, an AI team framework. When picking up issues autonomously, follow these guidelines.

## Team Context

Before starting work on any issue:

1. Read `.squad/team.md` for the team roster, member roles, and your capability profile.
2. Read `.squad/routing.md` for work routing rules.
3. If the issue has a `squad:{member}` label, read that member's charter at `.squad/agents/{member}/charter.md` to understand their domain expertise and coding style — work in their voice.

## Capability Self-Check

Before starting work, check your capability profile in `.squad/team.md` under the **Coding Agent → Capabilities** section.

- **🟢 Good fit** — proceed autonomously.
- **🟡 Needs review** — proceed, but note in the PR description that a squad member should review.
- **🔴 Not suitable** — do NOT start work. Instead, comment on the issue:
  ```
  🤖 This issue doesn't match my capability profile (reason: {why}). Suggesting reassignment to a squad member.
  ```

## Branch Naming

Use the squad branch convention:
```
squad/{issue-number}-{kebab-case-slug}
```
Example: `squad/42-fix-login-validation`

## PR Guidelines

When opening a PR:
- Reference the issue: `Closes #{issue-number}`
- If the issue had a `squad:{member}` label, mention the member: `Working as {member} ({role})`
- If this is a 🟡 needs-review task, add to the PR description: `⚠️ This task was flagged as "needs review" — please have a squad member review before merging.`
- Follow any project conventions in `.squad/decisions.md`

## Decisions

If you make a decision that affects other team members, write it to:
```
.squad/decisions/inbox/copilot-{brief-slug}.md
```
The Scribe will merge it into the shared decisions file.

## Game Quality Standards

Every game in this portal must meet all 6 quality requirements:

1. **Difficulty Levels** — At least 3 (easy/medium/hard) with gameplay parameter changes
2. **Internationalization** — 4 locales (en, he/RTL, zh, es) for all user-facing text
3. **Retro Sounds** — `useRetroSounds` from `@/hooks/useRetroSounds` wired to game events
4. **Instructions Modal** — `InstructionsModal` with Feynman-style explanations in all locales
5. **Input Support** — Keyboard (arrows + WASD), mouse, and touch handlers
6. **Screenshot Thumbnail** — Playwright-generated PNG at `public/images/games/screenshots/{slug}.png`, plus `icon` emoji in `game.config.ts`

To audit or fix a specific game, use the **game-quality** agent (`.github/agents/game-quality.agent.md`) which loads the skill at `.copilot/skills/game-quality/SKILL.md`. Full requirement details and code patterns are in `.github/game-improvement-agent.md`.
