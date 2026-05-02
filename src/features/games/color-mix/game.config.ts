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
    en: 'Become a Master Painter! Journey through 14 levels of color theory — primaries, tints, shades, neutrals, and tertiaries.',
    he: '!הפכו לציירים מומחים! מסע של 14 שלבים בתורת הצבע — צבעי יסוד, גוונים, אפורים וצבעים שלישוניים',
    zh: '成为色彩大师！穿越 14 个色彩理论关卡——原色、浅色调、深色调、中性色和复色。',
    es: '¡Conviértete en Maestro Pintor! Un viaje de 14 niveles por la teoría del color — primarios, tintes, tonos, neutros y terciarios.',
  },
  categories: ['colors', 'ages-3-5'],
  ageRange: { min: 3, max: 7 },
  icon: '🧪',
  thumbnail: '/images/games/color-mix.svg',
  engine: 'react',
  i18nNamespace: 'colorMix',
};
