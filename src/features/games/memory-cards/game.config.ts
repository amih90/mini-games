import { GameConfig } from '../registry/types';

export const memoryCardsConfig: GameConfig = {
  slug: 'memory-cards',
  title: {
    en: 'Memory Cards',
    he: 'קלפי זיכרון',
  },
  description: {
    en: 'Find all the matching pairs!',
    he: 'מצאו את כל הזוגות התואמים!',
  },
  categories: ['memory', 'ages-3-5', 'ages-6-8'],
  ageRange: { min: 4, max: 7 },
  thumbnail: '/images/games/memory-cards.svg',
  engine: 'react',
  i18nNamespace: 'memoryCards',
};
