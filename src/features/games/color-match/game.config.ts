import { GameConfig } from '../registry/types';

export const colorMatchConfig: GameConfig = {
  slug: 'color-match',
  title: {
    en: 'Color Match',
    he: 'התאמת צבעים',
  },
  description: {
    en: 'Match colors by dragging items to the right place!',
    he: 'התאימו צבעים על ידי גרירת פריטים למקום הנכון!',
  },
  categories: ['colors', 'ages-3-5'],
  ageRange: { min: 3, max: 5 },
  thumbnail: '/images/games/color-match.svg',
  engine: 'react',
  i18nNamespace: 'colorMatch',
};
