import { GameConfig } from '../registry/types';

export const backgammonPhaserConfig: GameConfig = {
  slug: 'backgammon-phaser',
  title: {
    en: 'Backgammon (Phaser)',
    he: 'שש בש (פייזר)',
    zh: '双陆棋 (Phaser)',
    es: 'Backgammon (Phaser)',
  },
  description: {
    en: 'Classic backgammon with AI opponent — powered by Phaser!',
    he: 'שש בש קלאסי נגד מחשב — מופעל על ידי Phaser!',
    zh: '经典双陆棋，对战AI — 由 Phaser 驱动！',
    es: '¡Backgammon clásico contra la IA — impulsado por Phaser!',
  },
  categories: ['math', 'memory'],
  ageRange: { min: 8, max: 12 },
  thumbnail: '/images/games/backgammon.svg',
  engine: 'phaser',
  i18nNamespace: 'backgammonPhaser',
};
