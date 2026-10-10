# mini-games.github.io

## Game catalog

Games are registered in `src/features/games/registry/index.ts` and served through
the localized `/[locale]/games/[slug]` route. Standalone browser games can be
bundled under `public/games/` and loaded by a catalog component so they continue
to work with the deployment base path.

The catalog includes **Pokémon Tower Defense** at
`/[locale]/games/pokemon-tower-defense`, with its self-contained game bundle in
`public/games/pokemon-tower-defense/`. It supports English, Hebrew/RTL, Chinese,
and Spanish, a shop with 137 base-form and independent-defender choices,
including 50 new base-form families and all 27 official starter lines across
Generations I–IX. It also has all eight player-chosen Eevee evolutions, three
difficulties, mixed evolving enemy waves, and 17 bosses. Choose the
original Meadow, bigger Coastal Lagoon, or extra-large Volcanic Highlands
before playing; each has its own route and environment, with whole-map view,
zoom, and mouse/touch panning. See the bundle's README for controls and checks.

## Royal Princess Mansion

**Royal Princess Mansion** is an original, Sunlit Storybook-style care game at
`/[locale]/games/princess-mansion`. The original eight connected rooms contain beds, reading
corners, dining tables, private toilet stalls, a bubble bath, toys, crafts,
music, swings, and gardens. Start with Liora and earn Care Hearts through useful
care to optionally invite seven more princesses. Easy, medium, and hard change
need decay and activity duration. English, Hebrew/RTL, Chinese, and Spanish are
supported; the physical mansion always runs left to right.

Drag a princess onto an attraction with a mouse or finger. Drag empty space to
pan, or carry her to the edge to scroll between rooms. Without dragging, select
a large portrait, choose a pictured room, and press its pictured attraction.
The five large wish pictures are also shortcuts to food, rest, washing, the
toilet and play; their chunky meters, `!` requests and completion ticks work
without reading. The hand picture picks up a princess and the stop picture
puts her down or ends an activity. The castle, cauldron and suitcase pictures
switch floors or open outings. On phones, the shopping bag opens picture tabs
for clothes, toys and treats. Text remains available for grown-ups and assistive
technology.

The canvas keeps the same large frame across mansion floors, recipe selection,
ingredients and brewing. The picture dock has a fixed height, and the potion
notebook floats over unused space instead of shrinking the room. Narrow screens
have swipeable room/attraction pictures; landscape phones use one compact dock
row without hiding sound, help or pause. With the canvas
focused, arrows/WASD navigate or move a carried princess, Space/Enter pick up or
drop her, and Escape cancels a move or pauses. Unnecessary care is gently
refused; repeated insistence has a small, capped happiness cost. Leisure always
accepts play, even at full Fun, without lowering a high meter to an activity
target. Only a meaningful need deficit at the start earns completion rewards.

### Outings, treasures, and magical play

**Outings** takes any chosen group of invited princesses to a three-shop mall or
a two-zone beach. Travel is free; return home before changing companions or
visiting the other destination. Everyone left at home freezes completely,
including care, queues, wandering and timers. Trips restore their companions,
destination, home return positions and camera after a reload. Departing stops
the chosen companions' activities without undoing care already received.

Useful care earns **3 coins**, or **4 for a favorite**, alongside cumulative
Care Hearts. New and migrated adventures receive **10 welcome coins once**.
Hearts are never spent. The boutique sells three visible outfits, the toy shop
sells a cuddle dragon, train and bubble wand, and the ice-cream parlor sells
three consumable flavors. Clothing/toys belong to the household; each princess
chooses her own outfit and toy. Original outfits and castle blocks stay free.
Previews are free, purchases use no real money, and permanent purchases cannot
charge twice. A cone is consumed only when accepted; fullness refusal preserves
it. Bought treats and full-Fun play earn no coins or Hearts.

The backyard connects to a **slide and treehouse playground**. The beach offers
sandcastles, shell arranging, shallow splashing and hammock rest, without a
swimming minigame. The **Potion basement** floor contains two cauldrons for
original fairy-tale lessons: choose a recipe, add three pictured fictional
ingredients, then watch pouring, stirring, bubbling and a star/flower reveal.
The pictured three-step recipe highlights the matching next ingredient, ticks
accepted steps, and marks a wrong choice with a cross. Recipe controls fold away
during brewing so the cauldron animation stays visible.
Wrong ingredients give hints, not penalties. Automatic lessons need no input.

Each invitation milestone has a portrait, confetti and a distinct fanfare.
**Invite now** welcomes the friend; **Later** leaves the invitation in the album
without replaying its notice. Notices wait behind other dialogs. Invitations
accepted on a trip place the new princess at home, without changing the party.

Princesses now wave, look around, take short strolls and occasionally choose
nearby play, reading, music, gardening or a useful nap. Picking one up always
overrides her plan; carrying one princess does not freeze the rest of the house.
Food, bath and toilet care still need the player. Disable **Lively princesses**
in the pause menu at home to stop wandering and new self-directed activities.
This setting is locked during outings to preserve the resting household's plans.

Four short starter cards teach care. Optional help in travel, shopping and potion
panels explains each new activity where it is used, without lengthening onboarding.

Joyful menus use original character portraits, crown decorations, colored
difficulty cards and gentle motion that respects reduced-motion preferences.
The pause menu also controls **quiet adventure ambience** independently of effects;
the portal's sound button mutes both. Audio waits for a user gesture and pauses
when hidden or unfocused. Water, eating and care have distinct cues, and rewards
use warm, original musical phrases through the existing `useRetroSounds` owner.
Five local interface effects come from [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds),
verified **CC0**, with its license bundled in `public/games/princess-mansion/audio/`.
The two 24-second palace/beach loops and seven care, play and invitation effects
are generated originals:

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
Version 3 also restores destination clocks, trips, coins, shared collections,
equipment, treat consumption, potion steps and acknowledged invitations.
Authentic version 1/2 saves are validated and explicitly migrated without
losing princesses, needs, rewards, walks or unfinished care; the original raw
save remains the backup when the upgraded save is first written. There is no
conversion or subtraction of old Care Hearts.

Purchases, equipment, treats, travel and invitation decisions save the whole
candidate snapshot **before publishing success**. A failed write leaves the
old wallet, collection and roster intact and shows recovery. Retrying storage
does not repeat the failed command; buy/invite again explicitly after recovery.

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
`src/features/games/princess-mansion/data.ts`; prices and shared item IDs are in
`catalog.ts`; deterministic simulation is in
`model.ts`, and validated, versioned saving is in `persistence.ts`. To add a
princess, extend `PRINCESS_IDS` and `PRINCESSES`, add a character definition to
the artwork generator, add her name/description to all four
`princessMansion` message namespaces, and regenerate the artwork. The
album, invitations, renderer, and save validation use those data definitions.
Keep existing IDs stable; changing saved-state structure requires a versioned
migration rather than silently discarding older progress.

### Development checks and thumbnail

```sh
npx playwright test e2e/princess-mansion-model.spec.ts e2e/princess-mansion-expansion-model.spec.ts e2e/princess-mansion-assets.spec.ts e2e/princess-mansion.spec.ts e2e/princess-mansion-expansion.spec.ts e2e/princess-mansion-preschool.spec.ts e2e/princess-mansion-polish.spec.ts e2e/princess-mansion-visual.spec.ts --workers=2
GAME_SLUG=princess-mansion npm run test:screenshots
```

The deterministic, in-game catalog thumbnail is
`public/images/games/screenshots/princess-mansion.png`. Assets use the configured
deployment base path, including GitHub Pages' `/mini-games`.