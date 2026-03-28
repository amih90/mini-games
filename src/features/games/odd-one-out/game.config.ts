import { GameConfig } from '../registry/types';

export const oddOneOutConfig: GameConfig = {
  slug: 'odd-one-out',
  title: {
    en: 'Odd One Out',
    he: 'מי לא שייך',
    zh: '找不同',
    es: '¿Cuál no pertenece?',
  },
  description: {
    en: 'Find the one that doesn\'t belong! Train your brain to spot differences!',
    he: 'מצאו את מי שלא שייך! אמנו את המוח לזהות הבדלים!',
    zh: '找出不属于这里的那个！训练你的大脑发现不同！',
    es: '¡Encuentra el que no pertenece! ¡Entrena tu cerebro para detectar diferencias!',
  },
  categories: ['patterns', 'ages-3-5'],
  ageRange: { min: 3, max: 6 },
  icon: '🔍',
  thumbnail: '/images/games/odd-one-out.svg',
  engine: 'react',
  i18nNamespace: 'oddOneOut',
};
