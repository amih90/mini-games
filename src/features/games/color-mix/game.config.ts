import { GameConfig } from '../registry/types';

export const colorMixConfig: GameConfig = {
  slug: 'color-mix',
  title: {
    en: 'Color Lab',
    he: 'מעבדת הצבעים',
    zh: '色彩实验室',
    es: 'Laboratorio de Colores',
  },
  description: {
    en: 'Mix paint colors to discover new ones! Learn how colors combine!',
    he: 'ערבבו צבעים וגלו צבעים חדשים! למדו איך צבעים מתחברים!',
    zh: '混合颜料颜色，发现新颜色！学习颜色如何组合！',
    es: '¡Mezcla colores de pintura para descubrir nuevos! ¡Aprende cómo se combinan!',
  },
  categories: ['colors', 'ages-3-5'],
  ageRange: { min: 3, max: 7 },
  thumbnail: '/images/games/color-mix.svg',
  engine: 'react',
  i18nNamespace: 'colorMix',
};
