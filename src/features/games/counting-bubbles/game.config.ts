import { GameConfig } from '../registry/types';

export const countingBubblesConfig: GameConfig = {
  slug: 'counting-bubbles',
  title: {
    en: 'Counting Bubbles',
    he: 'ספירת בועות',
    zh: '数泡泡',
    es: 'Contar Burbujas',
  },
  description: {
    en: 'Pop the right number of bubbles! Learn to count while having fun!',
    he: 'פוצצו את מספר הבועות הנכון! למדו לספור תוך כדי כיף!',
    zh: '戳破正确数量的泡泡！边玩边学数数！',
    es: '¡Revienta el número correcto de burbujas! ¡Aprende a contar divirtiéndote!',
  },
  categories: ['math', 'ages-3-5'],
  ageRange: { min: 3, max: 6 },
  icon: '🫧',
  thumbnail: '/images/games/counting-bubbles.svg',
  engine: 'react',
  i18nNamespace: 'countingBubbles',
};
