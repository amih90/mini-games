'use client';

import { useLocale } from 'next-intl';
import { GameWrapper } from '../shared/GameWrapper';
import { pokemonTowerDefenseConfig } from './game.config';

export default function PokemonTowerDefenseGame() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const locale = useLocale();
  const title =
    pokemonTowerDefenseConfig.title[
      locale as keyof typeof pokemonTowerDefenseConfig.title
    ] ?? pokemonTowerDefenseConfig.title.en;

  return (
    <GameWrapper
      title={title}
      className="bg-gradient-to-b from-emerald-700 via-emerald-600 to-teal-800"
      fullHeight
      showSoundToggle={false}
    >
      <iframe
        src={`${basePath}/games/pokemon-tower-defense/index.html`}
        title={`${title} — מגיני השביל`}
        className="block h-full w-full border-0 bg-emerald-700"
        allow="autoplay"
      />
    </GameWrapper>
  );
}
