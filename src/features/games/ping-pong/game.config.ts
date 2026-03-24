import { GameConfig } from '../registry/types';

export const pingPongConfig: GameConfig = {
  slug: 'ping-pong',
  title: {
    en: 'Ping Pong 3D',
    he: 'פינג פונג 3D',
  },
  description: {
    en: 'Play 3D table tennis against the computer with realistic physics!',
    he: 'שחקו טניס שולחן תלת-ממדי נגד המחשב עם פיזיקה מציאותית!',
  },
  categories: ['reaction', 'ages-6-8'],
  ageRange: { min: 5, max: 12 },
  icon: '🏓',
  thumbnail: '/images/games/screenshots/ping-pong.png',
  engine: 'r3f',
  i18nNamespace: 'pingPong',
};
