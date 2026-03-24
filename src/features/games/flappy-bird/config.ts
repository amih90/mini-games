import { GameConfig } from '../registry/types';

export const flappyBirdConfig: GameConfig = {
  slug: 'flappy-bird',
  icon: '🐦',
  title: {
    en: 'Flappy Bird',
    he: 'ציפור מעופפת',
    zh: '像素小鸟',
    es: 'Flappy Bird',
  },
  description: {
    en: 'Tap to fly through the pipes! How far can you go?',
    he: 'הקישו כדי לעוף בין הצינורות! כמה רחוק תגיעו?',
    zh: '点击飞越管道！你能飞多远？',
    es: '¡Toca para volar entre las tuberías! ¿Hasta dónde llegarás?',
  },
  categories: ['reaction', 'ages-6-8'],
  ageRange: { min: 5, max: 12 },
  thumbnail: '/images/games/flappy-bird.svg',
  engine: 'canvas',
  i18nNamespace: 'flappyBird',
};
