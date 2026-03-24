import { GameConfig } from '../registry/types';

export const tetrisConfig: GameConfig = {
  slug: 'tetris',
  icon: '🧱',
  title: {
    en: 'Tetris',
    he: 'טטריס',
  },
  description: {
    en: 'Stack falling blocks to clear lines!',
    he: 'סדרו בלוקים נופלים כדי למחוק שורות!',
  },
  categories: ['reaction', 'ages-6-8'],
  ageRange: { min: 6, max: 12 },
  thumbnail: '/images/games/tetris.svg',
  engine: 'canvas',
  i18nNamespace: 'tetris',
};
