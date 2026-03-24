import { GameConfig } from '../registry/types';

export const shapeBuilderConfig: GameConfig = {
  slug: 'shape-builder',
  title: { en: 'Shape Builder', he: 'בונה צורות', zh: '形状建造师', es: 'Constructor de Formas' },
  description: { en: 'Combine shapes to build fun objects!', he: 'שלבו צורות ובנו דברים מהנים!', zh: '组合形状来构建有趣的物体！', es: '¡Combina formas para construir objetos divertidos!' },
  categories: ['shapes', 'ages-3-5'],
  ageRange: { min: 3, max: 7 },
  icon: '🏗️',
  thumbnail: '/images/games/screenshots/shape-builder.png',
  engine: 'react',
  i18nNamespace: 'shapeBuilder',
};
