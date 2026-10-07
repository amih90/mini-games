# mini-games.github.io

## Game catalog

Games are registered in `src/features/games/registry/index.ts` and served through
the localized `/[locale]/games/[slug]` route. Standalone browser games can be
bundled under `public/games/` and loaded by a catalog component so they continue
to work with the deployment base path.

The catalog includes **Pokémon Tower Defense** at
`/[locale]/games/pokemon-tower-defense`, with its self-contained Hebrew RTL game
bundle in `public/games/pokemon-tower-defense/`.

## Royal Princess Mansion

**Royal Princess Mansion** is an original, Sunlit Storybook-style care game at
`/[locale]/games/princess-mansion`. Eight connected rooms contain beds, reading
corners, dining tables, private toilet stalls, a bubble bath, toys, crafts,
music, swings, and gardens. Start with Liora and earn Care Hearts through useful
care to optionally invite seven more princesses. Easy, medium, and hard change
need decay and activity duration. English, Hebrew/RTL, Chinese, and Spanish are
supported; the physical mansion always runs left to right.

Drag a princess onto an attraction with a mouse or finger. Drag empty space to
pan, or carry her to the edge to scroll between rooms. Without dragging, select
a portrait, choose a room, and press its attraction button. With the canvas
focused, arrows/WASD navigate or move a carried princess, Space/Enter pick up or
drop her, and Escape cancels a move or pauses. Unnecessary care is gently
refused; repeated insistence has a small, capped happiness cost.

Princesses now wave, look around, take short strolls and occasionally choose
nearby play, reading, music, gardening or a useful nap. Picking one up always
overrides her plan; carrying one princess does not freeze the rest of the house.
Food, bath and toilet care still need the player. Disable **Lively princesses**
in the pause menu to stop wandering and new self-directed activities.

Joyful menus use original character portraits, crown decorations, colored
difficulty cards and gentle motion that respects reduced-motion preferences.
The pause menu also controls a **quiet palace ambience** independently of effects;
the portal's sound button mutes both. Audio waits for a user gesture and pauses
when hidden or unfocused. Water, eating and care have distinct cues, and rewards
use warm, original musical phrases through the existing `useRetroSounds` owner.
Five local interface effects come from [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds),
verified **CC0**, with its license bundled in `public/games/princess-mansion/audio/`.
The 24-second ambient loop and three gentle foley effects are generated originals:

```sh
node scripts/generate-princess-mansion-audio.mjs
```

All audio is served locally, with no third-party runtime audio requests. The
audio manifest records sources, licenses, sizes and SHA-256 hashes. The imported
MP3s were converted from the official pack's `click_003`, `maximize_003`,
`drop_003`, `confirmation_002` and `bong_001` OGGs using FFmpeg (mono, 22050 Hz,
4.5 kHz low-pass, `libmp3lame -q:a 4`), for broader browser compatibility.

### Saving

Progress is saved **on this browser and device**, every ten seconds and after
meaningful events, with a last-known-good backup. Positions, camera location,
needs, invitations, queues, and unfinished activities are restored. Needs and
activity timers pause while closed, hidden, unfocused, or paused: returning
never causes offline deterioration.
Version 2 saves also restore strolls, their intended destinations, and ambience/
liveliness preferences. Original version 1 saves are validated and migrated
without losing princesses, needs, rewards or unfinished care; the original raw
save remains the backup when the upgraded save is first written.

Starting another adventure requires confirmation when a save exists, and the
old adventure is retained until the replacement is successfully written.
Damaged saves offer explicit backup recovery; unavailable storage, full
storage, incompatible save versions, and conflicting writers have visible
recovery dialogs. Web Locks allow only one active writer. Browsers without
Web Locks display a single-tab warning. Clearing this site's browser storage
removes its saves; saves are not cloud-synchronized.

### Original artwork and extending the cast

All mansion artwork is original, generated locally with free tooling. Layered
character SVGs, room backgrounds, furnishings, icons, dimensions, provenance,
and SHA-256 hashes live in `public/games/princess-mansion/`. Regenerate them with:

```sh
node scripts/generate-princess-mansion-assets.mjs
```

Game rules and stable room/princess/station IDs are in
`src/features/games/princess-mansion/data.ts`; deterministic simulation is in
`model.ts`, and validated, versioned saving is in `persistence.ts`. To add a
princess, extend `PRINCESS_IDS` and `PRINCESSES`, add a character definition to
the artwork generator, add her name/description to all four
`princessMansion` message namespaces, and regenerate the artwork. The
album, invitations, renderer, and save validation use those data definitions.
Keep existing IDs stable; changing saved-state structure requires a versioned
migration rather than silently discarding older progress.

### Development checks and thumbnail

```sh
npx playwright test e2e/princess-mansion-model.spec.ts e2e/princess-mansion-assets.spec.ts e2e/princess-mansion.spec.ts e2e/princess-mansion-polish.spec.ts e2e/princess-mansion-visual.spec.ts --workers=2
GAME_SLUG=princess-mansion npm run test:screenshots
```

The deterministic, in-game catalog thumbnail is
`public/images/games/screenshots/princess-mansion.png`. Assets use the configured
deployment base path, including GitHub Pages' `/mini-games`.