import { GameConfig } from '../registry/types';

export const numberTower3DConfig: GameConfig = {
  slug: 'number-tower-3d',
  title: {
    en: '3D Number Tower',
    he: 'מגדל מספרים תלת-ממד',
    zh: '3D数字塔',
    es: 'Torre de Números 3D',
  },
  description: {
    en: 'Stack number blocks to reach the target sum! Build a tower with math!',
    he: 'ערמו קוביות מספרים להגעת הסכום המטרה! בנו מגדל עם מתמטיקה!',
    zh: '叠加数字方块达到目标总和！用数学建造高塔！',
    es: '¡Apila bloques de números para alcanzar la suma objetivo! ¡Construye una torre con matemáticas!',
  },
  categories: ['math', 'ages-3-5', 'ages-6-8'],
  ageRange: { min: 5, max: 9 },
  icon: '🔢',
  thumbnail: '/images/games/screenshots/number-tower-3d.png',
  engine: 'r3f',
  i18nNamespace: 'numberTower3D',
};
