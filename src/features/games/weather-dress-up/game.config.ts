import { GameConfig } from '../registry/types';

export const weatherDressUpConfig: GameConfig = {
  slug: 'weather-dress-up',
  title: { en: 'Weather Dress-Up', he: 'מתלבשים למזג אוויר', zh: '天气穿衣', es: 'Vestirse para el Clima' },
  description: { en: 'Pick the right clothes for the weather!', he: 'בחרו בגדים מתאימים למזג האוויר!', zh: '为天气选择合适的衣服！', es: '¡Elige la ropa correcta para el clima!' },
  categories: ['science', 'ages-3-5'],
  ageRange: { min: 3, max: 6 },
  thumbnail: '/images/games/weather-dress-up.svg',
  engine: 'react',
  i18nNamespace: 'weatherDressUp',
};
