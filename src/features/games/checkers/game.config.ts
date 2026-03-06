import { GameConfig } from '../registry/types';

export const checkersConfig: GameConfig = {
  slug: 'checkers',
  title: {
    en: 'Checkers',
    he: 'דמקה',
  },
  description: {
    en: 'Play checkers with different difficulty levels',
    he: 'שחק דמקה עם רמות קושי שונות',
  },
  categories: ['math', 'memory'],
  ageRange: {
    min: 6,
    max: 12,
  },
  thumbnail: '/images/games/checkers.svg',
  engine: 'react',
  i18nNamespace: 'checkers',
};
