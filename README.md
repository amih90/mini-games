# mini-games.github.io

## Game catalog

Games are registered in `src/features/games/registry/index.ts` and served through
the localized `/[locale]/games/[slug]` route. Standalone browser games can be
bundled under `public/games/` and loaded by a catalog component so they continue
to work with the deployment base path.

The catalog includes **Pokémon Tower Defense** at
`/[locale]/games/pokemon-tower-defense`, with its self-contained Hebrew RTL game
bundle in `public/games/pokemon-tower-defense/`.