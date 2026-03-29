import { GameConfig } from '../registry/types';

export const mirrorDrawConfig: GameConfig = {
  slug: 'mirror-draw',
  title: { en: 'Mirror Draw', he: 'ציור מראה', zh: '镜像绘画', es: 'Dibujo Espejo' },
  description: { en: 'Complete the mirror image! Match the pattern!', he: 'השלימו את תמונת המראה!', zh: '完成镜像图案！', es: '¡Completa la imagen espejo!' },
  categories: ['shapes', 'ages-3-5', 'ages-6-8'],
  ageRange: { min: 4, max: 8 },
  icon: '🪞',
  thumbnail: '/images/games/mirror-draw.svg',
  engine: 'react',
  i18nNamespace: 'mirrorDraw',
};
