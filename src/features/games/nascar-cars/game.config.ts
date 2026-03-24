import { GameConfig } from '../registry/types';

export const nascarCarsConfig: GameConfig = {
  slug: 'nascar-cars',
  title: {
    en: 'NASCAR Cars 3D',
    he: 'מכוניות נסקאר 3D',
  },
  description: {
    en: 'Race Pixar-style cars on an oval track in career mode!',
    he: 'השתתפו במירוצי מכוניות בסגנון פיקסאר על מסלול אובלי במצב קריירה!',
  },
  categories: ['reaction', 'ages-3-5', 'ages-6-8'],
  ageRange: { min: 4, max: 12 },
  icon: '🏎️',
  thumbnail: '/images/games/screenshots/nascar-cars.png',
  engine: 'r3f',
  i18nNamespace: 'nascarCars',
};
