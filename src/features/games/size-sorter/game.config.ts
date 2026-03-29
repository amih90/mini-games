import { GameConfig } from '../registry/types';

export const sizeSorterConfig: GameConfig = {
  slug: 'size-sorter',
  title: { en: 'Size Sorter', he: 'ממיין גדלים', zh: '大小排序', es: 'Ordenar por Tamaño' },
  description: { en: 'Sort items from smallest to biggest!', he: 'סדרו מהקטן לגדול!', zh: '从小到大排列物品！', es: '¡Ordena del más pequeño al más grande!' },
  categories: ['math', 'ages-3-5'],
  ageRange: { min: 3, max: 6 },
  icon: '📏',
  thumbnail: '/images/games/size-sorter.svg',
  engine: 'react',
  i18nNamespace: 'sizeSorter',
};
