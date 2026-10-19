# Pokémon Tactics

Playable 56-family Pokémon tactical game at `/en/games/pokemon-tactics`
(also `he`, `zh` and `es`). Local artwork is animated on billboards in a
Three.js arena; it is not skeletal Pokémon 3D animation.

Recruit from an empty company, select a member and click a free cell in the
four leftmost columns. Start battle when at least one healthy member is
deployed. The initiative queue determines the next actor: move once, then
choose a move and target and confirm, heal, defend or wait. The player team
fights manually by default.
The robot **Auto** toggle opts into automatic player turns for the current
battle only. It uses the same legal tactical planner as the PC (movement,
attacks, healing abilities and defending), never spends potions or gold,
and can be switched off to resume manual commands. Pause and dialogs suspend
both teams. Auto turns off at the outcome and is off after reload; it does not
recruit, evolve, rest or advance to another encounter.

Focus the battlefield for arrows/WASD cursor movement, Enter/Space selection
and 1–3 abilities. Escape pauses; the pause menu offers Resume and a confirmed
New campaign action. Use the arena directly with mouse or touch, or its keyboard
cursor; there is no separate field-controls dialog. Sage cells with pale dots
and dashed borders are legal movement destinations; terracotta outlines show
the selected move's current range without hiding the sandy court.
Victory shows the gold earned for that encounter, the next rival team's portraits
and levels, and a short preparation/next-battle goal. Encounter nine previews the
final boss; campaign completion shows the final reward and completed goal instead
of inventing another opponent. Rewards are already credited, not claimed again.
Target rings mark valid victims/allies. The same species and move have exactly
the same range for both teams; melee range is one and most elemental attacks
reach three squares, including diagonals. The PC can move then attack just as
the player can. Each move icon shows its range as a target symbol and number.

Large picture buttons replace the reading-heavy interface. A short picture
guide opens for a new player; the full localized instructions remain available
from its question-mark button. Settings holds optional stats, chronicle,
credits, difficulty, themes, grid, reduced motion and fast animation.
Camp shop and the command dock are outside the arena, not over it; the entire
court is fitted to the available viewport without page scrolling. A responsive
perspective camera preserves the arena's depth, raised court, scenery and
shadows. Charcoal panels and muted brass trim keep the court the visual focus.
Pokémon artwork loads within an isolated material boundary: placing or evolving
a new species never hides the court or existing units. Its placement marker and
resource bars remain visible while its portrait texture loads.
The recruitment shop shows six Pokémon per page with large previous/next arrows:
the original six plus 50 additional base families, with 138 forms across their
normal evolution lines. Evolved forms are unlocked through camp evolution rather than bought directly.
Recruitment pages do not reset the selected teammate or change the formation.
The enemy encounter pool stays unchanged to preserve the existing campaign balance.
New families use the game's eight simplified elemental archetypes and existing
three-move tactical kits, not a full simulation of canonical Pokémon types.

Music is the cheerful CC0 chiptune loop **Jump** by ThePixel, not a ripped
Pokémon soundtrack. It starts after a user gesture at low volume and pauses
with game dialogs, mute, and pause. Feedback uses quiet triangle-wave melodies
via `useRetroSounds.playMelody`, replacing harsh square-wave attacks.

## Tactical rules

- 12×8 square cells; eight directions at cost one; no blocked-corner cutting.
- Speed-based interleaved initiative and seeded ties.
- Chebyshev range; deterministic damage preview; zero-cost basic attacks,
  energy abilities and rechargeable abilities. Energy never regenerates during
  battle. Returning to camp after victory or defeat restores 25% of max energy
  once (rounded up and capped); deployment edits, retries and new activations
  grant none. Easy Rest still fully refills it. No retaliation, random misses
  or area attacks.
- Defend halves damage until the next activation. Wait requeues once per
  cycle and cannot follow movement.
- Burn deals four on two activations; slow reduces movement for two actions.
- Simplified elemental advantages give 150% damage; the reciprocal tactical
  disadvantage gives 75%. These are not official Pokémon damage formulas.
- Injuries persist; healing restores 35 HP. Camp-only revival restores 35%.
  Healing costs 30 gold and revival 80. Battle healing spends the turn and
  requires range three.
- Six deployed and twelve recruited maximum; duplicates permitted.
  Training costs `60 + level * 40`, capped at level five.
- Camp evolution costs 200 gold for the first stage and 400 for the final stage.
  All 56 families have their recognizable evolved artwork, including Charmander →
  Charmeleon → Charizard; Squirtle → Wartortle → Blastoise; Bulbasaur → Ivysaur →
  Venusaur; Pikachu → Raichu; Geodude → Graveler → Golem; Gastly → Haunter → Gengar.
  Each evolution adds 25 max HP, 6 attack, 4 defense, 2 speed and 8 max energy.
  Training, deployment, missing HP, current energy and cooldowns are preserved.
  Knocked-out partners must be revived first. Evolved forms retain the family's
  three recognizable moves and cannot be recruited directly.
- HP and a separate blue energy bar appear above every Pokémon. The active
  Pokémon panel also shows both bars with exact current/maximum values.
  Both bars touch without padding or a gap and fade to 45% opacity on knockout,
  matching the faded Pokémon artwork. HP changes animate over 650ms and energy
  changes over 500ms, including healing/refills; reduced motion disables them.
  Attack projectiles and resource updates share a pause-aware timeline: damage,
  healing and energy spending commit when the projectile reaches its target,
  followed by the bar animation before another automatic turn. Reduced-motion
  attacks apply immediately without projectile travel.
- Selected Pokémon portraits and bars render above overlapping units without
  changing grid positions. The target panel also shows exact HP and energy.
- Easy camp rest restores all HP/energy and revives the roster at no cost,
  keeping upgrades and formation. Battle healing still costs an item and turn.
  Easy rewards start at 300 gold and rise by 25 each encounter. Participants,
  including KO units, gain one free training level on every second victory
  (maximum level five); benched units do not. Rewards/growth cannot be farmed.
- Easy counts are 1/2/2/3/3/4/4/5/5/6, with levels 1/1/2/2/2/2/3/3/3/3.
  Enemy count and level increases are staggered and the Easy boss has no extra
  stat multiplier. Medium/Hard retain paid recovery and their original curve.
- Ten encounters finish with a boss. Easy/Medium/Hard scale
  enemy health/attack/defense to 80%/100%/120%. Medium rewards are
  `180 + encounter * 35`; Hard receives 85% of that. Easy uses the rewards above.

Defeat permits exact pre-battle checkpoint retry, return to camp preserving
losses and consumable spending, or a confirmed new campaign with a difficulty
choice. Checkpoint retry remains available from camp to prevent recovery
deadlocks.

Progress uses localStorage key `mini-games:pokemon-tactics:v1`. Invalid saves
are reported and retained until confirmed reset; storage failures are visible.
Themes, animation preferences and the display-only chronicle are session UI
state rather than campaign state.

Asset provenance and licensing are in
`public/games/pokemon-tactics/CREDITS.txt` and accessible in-game. Pokémon art
uses the user's stated authorization; it is **not** CC0.

## Validation

With a dev server running from this checkout, use its URL explicitly to avoid
reusing another worktree's server:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3017 npx playwright test e2e/pokemon-tactics-model.spec.ts e2e/pokemon-tactics.spec.ts --workers=1
npx eslint src/features/games/pokemon-tactics e2e/pokemon-tactics*.spec.ts
npx tsc --noEmit
```
