import { GameConfig } from '../registry/types';

export const reversiConfig: GameConfig = {
  slug: 'reversi',
  title: {
    en: 'Reversi',
    he: 'רברסי',
  },
  description: {
    en: 'Play Reversi (Othello) with different difficulty levels',
    he: 'שחק רברסי (אותלו) עם רמות קושי שונות',
  },
  categories: ['math', 'memory'],
  ageRange: {
    min: 7,
    max: 12,
  },
  thumbnail: '/images/games/reversi.svg',
  engine: 'react',
  i18nNamespace: 'reversi',
};
