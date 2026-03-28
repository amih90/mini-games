import { GameConfig } from '../registry/types';

export const shadowMatchConfig: GameConfig = {
  slug: 'shadow-match',
  title: {
    en: 'Shadow Match',
    he: 'התאמת צללים',
    zh: '影子配对',
    es: 'Sombras Iguales',
  },
  description: {
    en: 'Match objects to their shadows! Can you see through the darkness?',
    he: 'התאימו חפצים לצללים שלהם! האם תוכלו לראות דרך החושך?',
    zh: '将物品与它们的影子配对！你能看穿黑暗吗？',
    es: '¡Empareja objetos con sus sombras! ¿Puedes ver en la oscuridad?',
  },
  categories: ['shapes', 'ages-3-5'],
  ageRange: { min: 3, max: 6 },
  icon: '👤',
  thumbnail: '/images/games/shadow-match.svg',
  engine: 'react',
  i18nNamespace: 'shadowMatch',
};
