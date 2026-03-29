import { GameConfig } from '../registry/types';

export const fractionPizzaConfig: GameConfig = {
  slug: 'fraction-pizza',
  title: { en: 'Fraction Pizza', he: 'פיצה שברים', zh: '分数披萨', es: 'Pizza de Fracciones' },
  description: { en: 'Slice the pizza into the right fractions!', he: 'חתכו את הפיצה לשברים הנכונים!', zh: '把披萨切成正确的分数！', es: '¡Corta la pizza en las fracciones correctas!' },
  categories: ['math', 'ages-6-8'],
  ageRange: { min: 5, max: 9 },
  icon: '🍕',
  thumbnail: '/images/games/fraction-pizza.svg',
  engine: 'react',
  i18nNamespace: 'fractionPizza',
};
