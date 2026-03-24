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
  icon: '⚫',
  thumbnail: '/images/games/screenshots/reversi.png',
  engine: 'react',
  i18nNamespace: 'reversi',
};
