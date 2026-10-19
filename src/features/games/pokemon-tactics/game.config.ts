import type { GameConfig } from '../registry/types';
export const pokemonTacticsConfig: GameConfig = {
  slug: 'pokemon-tactics',
  title: { en: 'Pokémon Tactics', he: 'טקטיקת פוקימונים', zh: '宝可梦战术', es: 'Tácticas Pokémon' },
  description: {
    en: 'Build a Pokémon company, plan every turn, and conquer a ten-battle fantasy campaign.',
    he: 'בנו צוות פוקימונים, תכננו כל תור ונצחו מערכה של עשרה קרבות בעולם פנטזיה.',
    zh: '组建宝可梦队伍，规划每个回合，征服十场战斗的奇幻战役。',
    es: 'Forma un equipo Pokémon, planea cada turno y conquista diez batallas de fantasía.',
  },
  categories: ['reaction', 'ages-6-8'],
  ageRange: { min: 7, max: 14 },
  icon: '⚔️',
  thumbnail: '/images/games/screenshots/pokemon-tactics.png',
  engine: 'r3f',
  i18nNamespace: 'pokemonTactics',
};
