import { GameConfig } from '../registry/types';

export const patternMakerConfig: GameConfig = {
  slug: 'pattern-maker',
  title: { en: 'Pattern Maker', he: 'יוצר דפוסים', zh: '图案制作', es: 'Creador de Patrones' },
  description: { en: 'Complete the pattern! What comes next?', he: 'השלימו את הדפוס! מה בא הלאה?', zh: '完成图案！下一个是什么？', es: '¡Completa el patrón! ¿Qué sigue?' },
  categories: ['patterns', 'ages-3-5'],
  ageRange: { min: 3, max: 7 },
  thumbnail: '/images/games/pattern-maker.svg',
  engine: 'react',
  i18nNamespace: 'patternMaker',
};
