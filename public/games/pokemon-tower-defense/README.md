# Pokémon Path Protectors

A colorful, mobile-first HTML5 Canvas tower-defense adventure made for simple tap play. Build a team of animated Pokémon, defeat cinematic bosses, unlock final evolutions, and protect the berry basket.

The complete in-game interface is in Hebrew with a right-to-left mobile layout.
The battlefield uses a 1600×900 logical adventure map with a long winding route, lakes, cliffs, groves, and many tactical placement pockets. Its bright layered terrain is inspired by the inviting feel of Pokémon route exploration without copying a proprietary game map.

## Play

Open `index.html` in a modern browser. There is no build step and no dependency to install.

For the most consistent remote-asset loading, you can optionally serve the folder locally:

```sh
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## Controls

- Tap **Buy Pokémon** to open a Dota-style hero shop, then filter the roster by Electric, Fire, Water, Grass, Psychic, Normal, or All.
- The 15-defender roster spans multiple generations: Pikachu, Charmander, Bulbasaur, Squirtle, Eevee, Magnemite, Shinx, Vulpix, Torchic, Mudkip, Piplup, Chikorita, Rowlet, Abra, and Ralts.
- Tap or click a grass square to place the selected Pokémon.
- Water, cliffs, groves, occupied cells, and the route itself cannot be used, creating meaningful strong and weak placement locations.
- Tap a placed Pokémon to open its Dota-inspired hero ability panel and see its exact attack range.
- Spend coins on three ranked abilities: power, range, and a unique species skill. Every ability has three ranks with live stat updates.
- Evolution is a two-rank ultimate. The first rank unlocks after three ability purchases. After six ability ranks and the first defeated boss, the second rank unlocks the final form or mastery.
- Full progression paths are Pikachu → Raichu → Thunder Mastery, Charmander → Charmeleon → Charizard, Bulbasaur → Ivysaur → Venusaur, Squirtle → Wartortle → Blastoise, and Eevee → Vaporeon → Tidal Mastery.
- New chains include Magnemite → Magneton → Magnezone, Shinx → Luxio → Luxray, Vulpix → Ninetales → Fire Mastery, Torchic → Combusken → Blaziken, Mudkip → Marshtomp → Swampert, Piplup → Prinplup → Empoleon, Chikorita → Bayleef → Meganium, Rowlet → Dartrix → Decidueye, Abra → Kadabra → Alakazam, and Ralts → Kirlia → Gardevoir.
- Pokémon attack automatically when an enemy enters range.
- Pikachu attacks quickly and can chain lightning to a nearby enemy.
- Charmander launches slower fireballs that damage a small group.
- Bulbasaur throws slowing seeds, Squirtle fires splashy water bubbles, and Eevee launches fast stars.
- Regular waves randomly choose from 15 enemy families across many generations, avoiding the previous predictable five-species loop.
- Enemy families evolve as the run progresses: early waves use base forms, waves after the first boss introduce middle evolutions, and later waves can feature final evolutions such as Pidgeot, Beedrill, Crobat, Staraptor, and Talonflame.
- Every fifth wave is now a dedicated boss battle. Onix raises a stone shield, Haunter phases out, Snorlax tries to heal, and Dragonite periodically dashes forward.
- Boss warnings show the encounter mechanic and weakness. Matching attacks deal bonus damage, but every team can still win.
- A boss health bar shows its next ability. A one-use berry shield automatically pushes back the boss the first time it reaches the basket.
- The animated wave panel shows the current species, countdown, and remaining progress.
- Waves rotate through normal, swarm, fast, and armored modifiers, each with visible rules and different enemy count, health, or speed.
- Use the 1×/2× button to control pacing. Between waves, call the next wave early to earn a countdown-based coin bonus.
- Use the selected hero panel to move a misplaced Pokémon for free or sell it for 65% of all coins invested in it.
- Difficulty scales more strongly after the opening waves; milestone bosses are tougher and cost two lives if they reach the basket.
- Consecutive defeats build a coin-boosting combo. Defeats also charge the Poké Power button for a dramatic field-wide attack.
- Defeated enemies award coins. Any enemy reaching the basket removes one life.
- Waves become progressively larger, faster, and tougher. The game ends at zero lives.
- Best wave, boss stars, Pokédex discoveries, sound, speed, and tutorial completion are saved locally.
- The current run is checkpointed between rounds, including coins, lives, Poké Power, placed towers, positions, ability ranks, evolutions, boss progress, selected defender, and the next enemy family.
- Returning players can choose **Continue Saved Game** or **New Game**. A checkpoint resumes safely before the next wave rather than restoring enemies halfway along the route.

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

The same PokéAPI sprite collections provide the additional multi-generation defenders, their evolutions, and evolving enemy families. Every remote image retains a procedural in-game fallback so unavailable artwork cannot stop a run.

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
