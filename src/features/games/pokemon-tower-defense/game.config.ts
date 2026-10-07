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
    en: 'Choose from 65 Pokémon and three difficulties across Meadow, the bigger Coastal Lagoon, and the extra-large Volcanic Highlands. Zoom, pan, choose Eevee’s evolution, and defend against mixed waves and epic bosses!',
    he: 'בחרו מבין 65 פוקימונים ושלוש רמות קושי בכר הדשא, בלגונת החוף הגדולה יותר וברמות הגעשיות הגדולות במיוחד. התקרבו, הזיזו את התצוגה, בחרו את ההתפתחות של איווי והגנו מפני גלים מעורבים ובוסים אדירים!',
    zh: '从65只宝可梦和三种难度中选择，在草地、更大的海岸泻湖和超大的火山高地冒险。缩放和平移地图，选择伊布的进化，抵御混合敌人波次和史诗首领！',
    es: 'Elige entre 65 Pokémon y tres dificultades en la Pradera, la Laguna Costera más grande y las Tierras Altas Volcánicas extragrandes. ¡Acerca y desplaza la vista, elige la evolución de Eevee y vence oleadas mixtas y jefes épicos!',
  },
  categories: ['reaction', 'ages-6-8'],
  ageRange: { min: 6, max: 12 },
  icon: '⚡',
  thumbnail: '/images/games/screenshots/pokemon-tower-defense.png',
  engine: 'canvas',
  i18nNamespace: 'pokemonTowerDefense',
};
