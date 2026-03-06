import { GameConfig } from '../registry/types';

export const chessConfig: GameConfig = {
  slug: 'chess',
  title: {
    en: 'Chess',
    he: 'שחמט',
  },
  description: {
    en: 'Play classic chess with different difficulty levels',
    he: 'שחק שחמט קלאסי עם רמות קושי שונות',
  },
  categories: ['math', 'memory'],
  ageRange: {
    min: 8,
    max: 12,
  },
  thumbnail: '/images/games/chess.svg',
  engine: 'react',
  i18nNamespace: 'chess',
};
