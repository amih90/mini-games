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
    en: 'Explore five illustrated landscapes and choose from 137 Pokémon, including 50 new base-form families. Train your team to evolve, then protect the berries through endless waves and boss squads!',
    he: 'גלו חמש מפות מאוירות ובחרו מבין 137 פוקימונים, כולל 50 משפחות חדשות של צורות בסיס. שדרגו את הצוות כדי לפתח אותו והגנו על הפירות בגלים אינסופיים ובקרבות בוסים!',
    zh: '探索五张插画地图，从137只宝可梦中组队，其中包含50种全新的基础形态进化家族。训练队伍让它们进化，在无尽波次与首领战中守护树果！',
    es: 'Explora cinco paisajes ilustrados y elige entre 137 Pokémon, incluidas 50 nuevas familias de formas básicas. Entrena a tu equipo para que evolucione y protege las bayas de oleadas y grupos de jefes.',
  },
  categories: ['reaction', 'ages-6-8'],
  ageRange: { min: 6, max: 12 },
  icon: '⚡',
  thumbnail: '/images/games/screenshots/pokemon-tower-defense.png',
  engine: 'canvas',
  i18nNamespace: 'pokemonTowerDefense',
};
