import { GameConfig } from '../registry/types';

export const backgammonConfig: GameConfig = {
  slug: 'backgammon',
  title: {
    en: 'Backgammon',
    he: 'שש בש',
  },
  description: {
    en: 'Play backgammon with different difficulty levels',
    he: 'שחק שש בש עם רמות קושי שונות',
  },
  categories: ['math', 'memory'],
  ageRange: {
    min: 8,
    max: 12,
  },
  thumbnail: '/images/games/backgammon.svg',
  engine: 'react',
  i18nNamespace: 'backgammon',
};
