import { GameConfig } from '../registry/types';

export const pokemonTowerDefenseConfig: GameConfig = {
  slug: 'pokemon-tower-defense',
  title: {
    en: 'Pokémon Tower Defense',
    he: 'מגיני השביל',
    zh: '宝可梦塔防',
    es: 'Defensa de Torres Pokémon',
  },
  description: {
    en: 'Build a team of 15 evolving defenders and protect the berry basket from enemy waves and bosses!',
    he: 'בנו צוות של 15 מגינים מתפתחים והגנו על סל הפירות מפני גלי אויבים ובוסים!',
    zh: '组建一支由15名可进化守卫组成的队伍，抵御敌人浪潮和首领，保护树果篮！',
    es: '¡Forma un equipo de 15 defensores que evolucionan y protege la cesta de bayas de oleadas y jefes!',
  },
  categories: ['reaction', 'ages-6-8'],
  ageRange: { min: 6, max: 12 },
  icon: '⚡',
  thumbnail: '/images/games/screenshots/pokemon-tower-defense.png',
  engine: 'canvas',
  i18nNamespace: 'pokemonTowerDefense',
};
