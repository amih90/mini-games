import { GameConfig } from '../registry/types';

export const shapeSorter3DConfig: GameConfig = {
  slug: 'shape-sorter-3d',
  title: {
    en: '3D Shape Sorter',
    he: 'מיון צורות תלת-ממד',
    zh: '3D形状分类器',
    es: 'Clasificador 3D',
  },
  description: {
    en: 'Sort 3D shapes into the right slots! Learn cubes, spheres, and more!',
    he: 'מיינו צורות תלת-ממד לחריצים הנכונים! למדו קוביות, כדורים ועוד!',
    zh: '将3D形状分类到正确的插槽中！学习立方体、球体等！',
    es: '¡Clasifica formas 3D en las ranuras correctas! ¡Aprende cubos, esferas y más!',
  },
  categories: ['shapes', 'ages-3-5', 'ages-6-8'],
  ageRange: { min: 4, max: 8 },
  icon: '🔷',
  thumbnail: '/images/games/shape-sorter-3d.svg',
  engine: 'r3f',
  i18nNamespace: 'shapeSorter3D',
};
