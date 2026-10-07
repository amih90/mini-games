# Pokémon Path Protectors

A colorful, mobile-first HTML5 Canvas tower-defense adventure made for simple tap play. Build a team of animated Pokémon, defeat cinematic bosses, unlock final evolutions, and protect the berry basket.

The complete interface supports English, Hebrew/RTL, Chinese, and Spanish.
The three original battlefields have different routes, environments, and tactical placement pockets; none copies a proprietary game map.

## Play

Open `index.html` in a modern browser. There is no build step and no dependency to install.
Standalone play defaults to Hebrew; use `index.html?locale=en`, `?locale=he`,
`?locale=zh`, or `?locale=es` to choose a language. The portal supplies its current locale automatically.

For the most consistent remote-asset loading, you can optionally serve the folder locally:

```sh
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## Difficulty and maps

Choose a difficulty and a map before starting a new run. They are locked during
play and restored by **Continue Saved Game**. After game over, **Play Again**
returns to the selection screen.

| Difficulty | Starting coins | Lives | Challenge |
| --- | --- | --- | --- |
| Easy | 220 | 15 | Slower, weaker enemies, fewer spawns, later evolutions, and gentler boss abilities |
| Medium | 180 | 10 | Balanced mixed waves, evolved enemies, and large bosses |
| Hard | 150 | 7 | More enemies, faster spawns, earlier final forms, and much stronger, larger bosses |

| Map | Logical size | Environment |
| --- | --- | --- |
| Current: Meadow | 1600×900 | The original green meadow, lakes, groves, cliffs, and winding route |
| Bigger: Coastal Lagoon | 2240×1260 | A longer sandy trail, turquoise lagoons, reefs, shells, and palm groves |
| Extra-large: Volcanic Highlands | 2880×1620 | A vast zigzag route, glowing lava, ash cliffs, crystals, and drifting embers |

The whole map is visible initially. Use **+ / −** to zoom between 100% and 300%,
drag empty battlefield space with a mouse or finger to pan, and use **Reset
View** to see the whole map again. A drag never buys or places a defender.
The maps have genuinely larger playable areas and longer routes, not just
different background colors.

## Controls

- Tap **Buy Pokémon** to open the hero shop and filter by any of its 16 types, or All.
- The roster now has **65 selectable defenders**: the original 15 plus 50 additions, including Mew, Mewtwo, Dragonite, Lugia, Zapdos, Moltres, Arceus, Articuno, Rayquaza, Kyogre, Groudon, and all eight Eevee forms. Affordable new evolution chains include Dratini, Gastly, Geodude, Machop, Magikarp, Riolu, Bagon, Gible, Beldum, and Togepi.
- Tap or click open ground to place the selected Pokémon. With the canvas focused, arrows or WASD move the placement cursor, and Space or Enter places or selects a defender. On-screen direction/action buttons support touch.
- Water, lava, cliffs, groves, occupied cells, and the route itself cannot be used, creating meaningful strong and weak placement locations.
- Escape closes the shop or evolution choice, cancels a move, or pauses. The pause button also pauses/resumes. Instructions, the shop, evolution choices, and hidden tabs pause the simulation without losing countdown time.
- Tap a placed Pokémon to open its Dota-inspired hero ability panel and see its exact attack range.
- Spend coins on three ranked abilities: power, range, and a unique species skill. Every ability has three ranks with live stat updates.
- Evolution is a two-rank ultimate. The first rank unlocks after three ability purchases. After six ability ranks and the first defeated boss, the second rank unlocks the final form or mastery.
- Full progression paths include Pikachu → Raichu → Mastery, Charmander → Charmeleon → Charizard, Bulbasaur → Ivysaur → Venusaur, and Squirtle → Wartortle → Blastoise.
- Eevee's first evolution opens a player-choice grid: **Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon, or Sylveon**. Each changes its actual element and combat style: water splash, chained lightning, fire bursts, long-range psychic attacks, dark slowing, binding seeds, icy slowing, or wide fairy splash. Its second evolution masters the chosen form rather than changing branches. Species with no further evolution can also buy two mastery ranks.
- New chains include Magnemite → Magneton → Magnezone, Shinx → Luxio → Luxray, Vulpix → Ninetales → Fire Mastery, Torchic → Combusken → Blaziken, Mudkip → Marshtomp → Swampert, Piplup → Prinplup → Empoleon, Chikorita → Bayleef → Meganium, Rowlet → Dartrix → Decidueye, Abra → Kadabra → Alakazam, and Ralts → Kirlia → Gardevoir.
- Pokémon attack automatically when an enemy enters range.
- Pikachu attacks quickly and can chain lightning to a nearby enemy.
- Charmander launches slower fireballs that damage a small group.
- Bulbasaur throws slowing seeds, Squirtle fires splashy water bubbles, and Eevee launches fast stars.
- Regular waves rotate through a shuffled bag of **32 enemy families**, so a family does not repeat until that rotation is exhausted. The next wave is planned before its countdown and the preview matches the actual spawns.
- Waves contain guaranteed mixtures rather than independently rolling identical enemies: middle-form waves use about 70% base forms and 30% evolved forms, such as 7 Pidgey + 3 Pidgeotto in a ten-enemy group. Later waves add final forms such as Pidgeot, Gengar, Garchomp, and Metagross, with an increasing final-form share. Higher difficulties introduce evolutions earlier. Later waves also mix a second family into the same wave.
- Every fifth wave is a dedicated battle from **17 different bosses**. Onix, Haunter, Snorlax, Dragonite, Articuno, Zapdos, and Moltres can appear early; later boss pools add Mew, Mewtwo, Lugia, Ho-Oh, Kyogre, Groudon, Rayquaza, Dialga, Giratina, and Arceus. Bosses do not repeat until the eligible pool has been used.
- Boss mechanics include shields, phasing, interruptible healing, dashes, storms that briefly delay nearby defenders, and enraged speed/armor. Boss size and strength increase with difficulty and later milestones.
- Boss warnings show the encounter mechanic and weakness. Matching attacks deal bonus damage, but every team can still win.
- A boss health bar shows its next ability. A one-use berry shield automatically pushes back the boss the first time it reaches the basket.
- The animated wave panel shows the current species, countdown, and remaining progress.
- Waves rotate through normal, swarm, fast, and armored modifiers, each with visible rules and different enemy count, health, or speed.
- Use the 1×/2× button to control pacing. Between waves, call the next wave early to earn a countdown-based coin bonus.
- The sound button reflects both the game preference and the portal's shared mute setting. Enabling sound clears the shared mute in one click; standalone sound remains local to this game.
- Use the selected hero panel to move a misplaced Pokémon for free or sell it for 65% of all coins invested in it.
- Difficulty scales more strongly after the opening waves; milestone bosses are tougher and cost two lives if they reach the basket.
- Consecutive defeats build a coin-boosting combo. Defeats also charge the Poké Power button for a dramatic field-wide attack.
- Defeated enemies award coins. Any enemy reaching the basket removes one life.
- Waves become progressively larger, faster, and tougher. The game ends at zero lives.
- Best wave, boss stars, Pokédex discoveries, sound, speed, preferred difficulty/map, and tutorial completion are saved locally.
- The current run is checkpointed between rounds, including difficulty, map, camera, coins, lives, Poké Power, placed towers, positions, ability ranks, chosen Eevee branches, evolutions, boss rotation, selected defender, family rotation, and the exact next-wave composition.
- Returning players can choose **Continue Saved Game** or **New Game**. A checkpoint resumes safely before the next wave rather than restoring enemies halfway along the route.
- Original version 1 checkpoints remain compatible: missing difficulty/map fields mean Medium/Meadow, and an already evolved Eevee without a branch remains Vaporeon.

## Development

`data.js` contains the additional roster, localized species names, combat
profiles, difficulty settings, map definitions, and deterministic wave/stat/
camera helpers. `i18n.js` contains dynamic interface translations and merges
the static HTML translations from `ui-strings.js`. `game.js` owns simulation,
rendering, inputs, and checkpointing. The portal wrapper forwards the locale,
uses the shared instructions modal, and owns embedded audio through
`useRetroSounds`; standalone play retains procedural Web Audio.

```sh
npx playwright test e2e/pokemon-tower-defense-model.spec.ts e2e/pokemon-tower-defense.spec.ts
GAME_SLUG=pokemon-tower-defense npm run test:screenshots
```

## External artwork

Battlefield characters use transparent animated Pokémon Showdown GIFs hosted by PokéAPI:

- [Animated Pikachu](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif)
- [Animated Charmander](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/4.gif)
- [Animated Zubat](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/41.gif)
- [Animated Raichu](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/26.gif)
- [Animated Charmeleon](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/5.gif)
- [Animated Charizard](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/6.gif)
- [Animated Bulbasaur](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/1.gif)
- [Animated Ivysaur](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/2.gif)
- [Animated Venusaur](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/3.gif)
- [Animated Squirtle](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/7.gif)
- [Animated Wartortle](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/8.gif)
- [Animated Blastoise](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/9.gif)
- [Animated Eevee](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/133.gif)
- [Animated Vaporeon](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/134.gif)
- [Animated Pidgey](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/16.gif)
- [Animated Rattata](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/19.gif)
- [Animated Caterpie](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/10.gif)
- [Animated Weedle](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/13.gif)
- [Animated Onix](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/95.gif)
- [Animated Haunter](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/93.gif)
- [Animated Snorlax](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/143.gif)
- [Animated Dragonite](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/149.gif)

The same PokéAPI sprite collections provide the additional multi-generation defenders, their evolutions, and evolving enemy families. Battlefield artwork loads on demand instead of fetching the entire expanded Pokédex at startup. Missing animated sprites fall back to official artwork, then to species-colored procedural art, so unavailable artwork cannot stop a run or disguise every enemy as Zubat.

Tower cards and animated-image fallbacks use PokéAPI official artwork:

- [Pikachu artwork](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png)
- [Charmander artwork](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png)
- [Bulbasaur artwork](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png)
- [Squirtle artwork](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png)
- [Eevee artwork](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png)
- [Zubat artwork](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/41.png)

The grass textures are selected from Kenney's CC0 [Tower Defense (Top-Down)](https://kenney.nl/assets/tower-defense-top-down) pack:

- [Grass base](https://raw.githubusercontent.com/shorepine/kenney/main/2d/Tower%20Defense/Retina/towerDefense_tile024.png)
- [Grass variation](https://raw.githubusercontent.com/shorepine/kenney/main/2d/Tower%20Defense/Retina/towerDefense_tile038.png)
- [Grass detail](https://raw.githubusercontent.com/shorepine/kenney/main/2d/Tower%20Defense/Retina/towerDefense_tile069.png)

Pokémon and Pokémon character names are trademarks of Nintendo, Game Freak, and Creatures. Pokémon imagery is used here in a personal, non-commercial fan project and remains subject to its respective rights holders. Pokémon Showdown sprite credits belong to their original contributors. The game remains playable with procedural fallback art when remote images are unavailable.
