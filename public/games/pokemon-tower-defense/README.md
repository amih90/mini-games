# Pokémon Path Protectors — Fieldnotes redesign

A modern illustrated 2D tower-defense game. The presentation and pointer
interactions have been rebuilt; the shop offers **137 choices**: base forms from
all nine generations of starter trios, 50 additional base-form families, and
independent defenders. Evolution forms are earned through upgrades rather than
bought directly. The full
species/evolution catalog remains available to the game and existing saves.
The endless waves, enemy families, boss squads and three difficulties are unchanged.
No campaign or gameplay rebalance was introduced.

### Fifty new base-form families

The shop adds exactly 50 distinct, previously unavailable base-form choices:
Bellsprout, Tentacool, Doduo, Drowzee, Krabby, Horsea, Spinarak, Aipom, Gligar,
Lotad, Seedot, Aron, Electrike, Trapinch, Shroomish, Cranidos, Shieldon,
Shellos, Drifloon, Snover, Stunky, Sandile, Darumaka, Joltik, Litwick, Axew,
Golett, Honedge, Skiddo, Goomy, Phantump, Bergmite, Grubbin, Salandit,
Mareanie, Jangmo-o, Morelull, Rookidee, Blipbug, Toxel, Impidimp, Silicobra,
Cufant, Sizzlipede, Pawmi, Tarountula, Nacli, Tadbulb, Shroodle and Frigibax.
Their species and evolution forms include dex numbers and English, Hebrew,
Chinese and Spanish names. Every new defender uses the shared tower-stat,
attack, skill-price, evolution and save model. The existing shop roster remains
available, and evolved forms are earned through training rather than bought.

### Johto team expansion

Exactly 30 Johto species join the original catalog (Lugia and Ho-Oh were
already included and are retained): Totodile, Croconaw, Feraligatr, Cyndaquil,
Quilava, Typhlosion, Mareep, Flaaffy, Ampharos, Chinchou, Lanturn, Marill,
Azumarill, Hoppip, Skiploom, Jumpluff, Sunkern, Sunflora, Wooper, Quagsire,
Teddiursa, Ursaring, Slugma, Magcargo, Swinub, Piloswine, Houndour, Houndoom,
Skarmory and Shuckle. Twelve base members of those chains appear in the shop;
their other 16 forms evolve in play. Skarmory and Shuckle remain as single-form
shop choices. All 27 official grass/fire/water starter lines from Generations I–IX are
represented with their real forms and artwork. Eevee still chooses any of its
eight branches through its evolution upgrade. Standalone defenders such as
Lugia and Ho-Oh remain purchasable.

Buy now has an original colorful capture-ball shop illustration. Sell shows
the selected hero returning a gold coin, its short localized label and the
exact 65% investment refund. Sell remains separate from the four upgrades,
only appears for a placed hero and keeps its original single-click behavior.
The controls use 48–64px artwork and at least 48px touch targets, including RTL
and compact portrait layouts, without changing the cockpit's row heights.

## Play and language

Open `index.html?locale=en` (also `he`, `zh`, `es`; Hebrew is RTL), or play through
the Mini-Games Portal. Standalone defaults to Hebrew. The portal supplies its
locale, shared `InstructionsModal`, and `useRetroSounds` audio owner. For local
standalone serving, run `python3 -m http.server 8080` in this directory.

## Interface

- Dark-slate translucent surfaces, mint/gold accents, custom SVG controls,
  picture-first Pokémon cards and live illustrated map previews.
- One compact status strip; a bounded shop; a reserved team/inspector workspace
  **above** the battlefield. Opening upgrades never moves the canvas.
- The opt-in portal header is 51px tall with 48px back/help targets; embedded
  play omits the repeated internal title. Other games' headers are unchanged.
- The map stays 16:9, with no page scroll in tablet portrait or landscape.
  Shop browsing scrolls only inside the modal. Primary touch controls are 48px.
- The five original landscapes have layered painted glades, foliage, rocks,
  shorelines and distinct biomes. Static terrain is cached once per map;
  previews are generated from the same scene, not unrelated stock pictures.

| Map | Logical size | Illustration / route |
| --- | --- | --- |
| Meadow | 1600×900 | Sunny grass, rounded trail, lily ponds and berry sanctuary |
| Coastal Lagoon | 2240×1260 | Turquoise lagoons, sand trail, reefs and palms |
| Volcanic Highlands | 2880×1620 | Basalt, warm lava pools, hardy highland foliage |
| Switchback Garden | 1600×900 | Long alternating lanes around garden pockets |
| Spiral Island | 1600×900 | Clear rounded spiral ending at an inner sanctuary, **no crossings** |

## Controls

1. Press **Buy Pokémon** to open the shop. Choose one of its 137 base-form or
   independent defenders using the type filters; choosing closes the shop.
   Tap clear ground to place and pay its price. Train it with upgrades to evolve
   it; evolved forms are not separate purchases. Selection is still free
   and affordability is checked only when placing.
   Buy Pokémon stays available beside an open defender inspector.
2. Tap a defender's visible body to inspect its range, power, speed and upgrades.
   Tap empty ground to dismiss inspection without buying or spending coins.
   Choosing a Pokémon in the shop exits inspection, so the next clear-ground
   tap intentionally places the newly chosen Pokémon.
3. **Hold the body for 480ms**, watching the immediate progress ring. Small
   pre-lift finger drift is tolerated. When lifted, drag and release on green
   ground to move **for free**. No Move button is needed.
4. The pointer keeps its original grab offset even when grabbing an upper body.
   The original location remains occupied until a valid drop. Red/occupied/path
   drops return safely to that location without spending coins.
5. A stationary hold can also be released before tapping the destination.
   Escape, close inspector, pointer cancellation, pause, instructions, shop,
   hiding the tab and losing pointer capture safely cancel an active drag.
6. For keyboard play focus the field: arrows/WASD move the cursor,
   Space/Enter place/select. With a defender selected, **M** lifts it or cancels
   relocation; arrows/WASD choose its new spot and Space/Enter drops it.
   Escape cancels relocation, or pauses when not moving.
7. Mouse wheel zoom (100–300%), drag **empty** ground to pan; Whole map resets the view.
   A pan does not place or buy a defender. Pause and 1×/2× preserve existing rules.
8. Right-click **only the battlefield**, or click the inspector's attached **X**,
   to cancel inspection, an armed shop purchase and relocation. No tower or coins
   change; no pause is triggered. Choose a Pokémon in the shop to build again.
   Hold timers and pointer capture are released, and ghost/range previews clear.

## Compact cockpit

The responsive game frame is centered and capped at 1200px, with height-aware
width on short, wide displays. A single 968px HUD groups enemy preview, illustrated
coin/heart/wave chips and nearby controls. The numeric wave count appears only
in its chip; all chips retain localized accessible labels and tooltips.
The stable 168px command row pairs Buy/large illustrated upgrades (X attached)
with a separate 96px Poké Power orb. Its circular gauge shows charging percent;
ready power glows with a reduced-motion-aware aura. Early-wave action has a
reserved slot below it. No detached utility band or zoom +/- buttons remain.
Start/map and shop dialogs are capped at 760px/840px; internal roster scrolling
exposes every purchasable base or independent defender. The battlefield has no
stretched dark outer card.

## Preserved gameplay

| Difficulty | Coins | Lives | Existing challenge |
| --- | --- | --- | --- |
| Easy | 220 | 15 | Slower enemies and gentle bosses; strikes only briefly stun |
| Medium | 180 | 10 | Mixed forms, boss squads of 2–5; three warned hits knock out defenders |
| Hard | 150 | 7 | Faster/stronger waves and squads of 3–5; earlier evolved enemies |

Defenders attack automatically. Buy three ranks of power, range and species skill.
The first evolution needs three ability purchases; final evolution/mastery needs
six and a defeated boss. Eevee retains all eight selectable branches and masters
the chosen branch. All 32 enemy families, guaranteed mixed-form waves, shuffled
family rotation, every-fifth-wave boss squads and all 17 boss species remain.
Boss abilities include shields, phasing, interruptible healing, dashes, storms
and enrage. Warned ground strikes are dodgeable by moving; knockouts still return
65% investment. Combo rewards, Poké Power, early-wave bonuses and endless
progression retain their existing calculations.

## Routes and saves

`data.js` deterministically samples rounded corners into `map.route`.
Road painting, travel (including multiple segments in a frame), build exclusion
and furthest-progress targeting all use this exact route. Camera transforms
change presentation only. A boss berry-shield rewind uses world distance,
not an arbitrary number of newly sampled points.

Profile/run storage keys and checkpoint `version: 1` stay compatible.
`routeVersion: 2` identifies new geometry. Missing map/difficulty still defaults
to Meadow/Medium; old evolved Eevee still defaults to Vaporeon. Ability ranks,
branches, durability, coins and progression are retained. If a restored placement
is no longer valid, its **entire recorded investment** is returned and a localized
10-second notice explains the recovery. Defenders are never silently discarded.

## Artwork and rights

The redesign reuses the project's existing PokéAPI **official-artwork** collection
for cards and battlefield characters:

- [Repository and usage documentation](https://github.com/PokeAPI/sprites)
- [Pikachu](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png)
- [Eevee](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png)

The repository documents the collection for application use; that is **not**
a separate license grant from the Pokémon rights holders. Pokémon names and
imagery remain subject to Nintendo, Game Freak and Creatures' rights. This is
the existing personal non-commercial fan project, not a claim of ownership or
commercial permission. No new Pokémon art was generated or proprietary maps
copied. Landscape illustration and interface icons are original code in this
project. Kenney tiles and Showdown GIFs are no longer fetched.

Original idle/attack/lift/hit transforms animate the high-resolution portraits.
Reduced motion disables decorative movement. Failed portraits retry the existing
PokéAPI Home collection where available; an explicit localized notice and drawn
fallback preserve play rather than pretending artwork loaded.

## Development and checks

`landscape.js` owns cached terrain; `data.js` owns route/model helpers;
`game.js` owns gameplay, input, UI assembly and storage; `i18n.js` and
`ui-strings.js` own four-locale copy. Portal chrome uses the opt-in `fieldnotes`
GameWrapper and InstructionsModal themes; unrelated games keep their theme.

```sh
npx playwright test e2e/pokemon-tower-defense-model.spec.ts e2e/pokemon-tower-defense.spec.ts e2e/pokemon-tower-defense-redesign.spec.ts
GAME_SLUG=pokemon-tower-defense npm run test:screenshots
npx eslint public/games/pokemon-tower-defense/*.js src/features/games/pokemon-tower-defense src/features/games/shared/GameWrapper.tsx src/features/games/shared/InstructionsModal.tsx
npx tsc --noEmit
npm run build
```

Redesign tests cover real dispatched Chromium touch with pre-lift drift, upper-body
grabs, camera transforms, RTL, free drops, invalid/occupied drops, cancellation,
save recovery and live high-speed boss routes on every map. Numeric model checks
verify every contact point stays on the shared route. Screenshots use live artwork.
Browser emulation does not replace physical iPad/Safari validation.

Inspector tiles use 104px (92px on portrait tablets) original filled
power/target/chain illustrations and the existing next-evolution portrait.
Only numbers, graphical rank dots and lock/check symbols are visible on the
tiles. Localized names and descriptions remain in accessible labels, tooltips
and instructions. Gentle four-second auras and slow orbiting sparks decorate
available upgrades and the selected portrait; purchases get a short glow.
Reduced motion disables all these animations; effects never cover the battlefield.
Purchase regression coverage restores a run, opens the inspector, buys arbitrary
species from the full shop and checks exact cost, unchanged existing defenders,
repeat purchases, affordability-independent selection and Hebrew tablet touch.
