import { GameConfig } from '../registry/types';

export const chickenInvadersConfig: GameConfig = {
  slug: 'chicken-invaders',
  title: {
    en: 'Chicken Invaders',
    he: 'פולשי התרנגולות',
  },
  description: {
    en: 'Defend Earth from waves of invading chickens!',
    he: 'הגנו על כדור הארץ מגלי פלישה של תרנגולות!',
  },
  categories: ['reaction', 'ages-6-8'],
  ageRange: { min: 6, max: 12 },
  thumbnail: '/images/games/chicken-invaders.svg',
  engine: 'canvas',
  i18nNamespace: 'chickenInvaders',
};
