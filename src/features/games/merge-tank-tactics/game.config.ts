import { GameConfig } from '../registry/types';

export const mergeTankTacticsConfig: GameConfig = {
  slug: 'merge-tank-tactics',
  title: {
    en: 'Merge Tank Tactics',
    he: 'טקטיקת טנקים',
    zh: '合并坦克战术',
    es: 'Táctica de Tanques',
  },
  description: {
    en: 'Merge tanks, build your army, crush the enemy!',
    he: 'מזגו טנקים, בנו צבא, ומחצו את האויב!',
    zh: '合并坦克，组建军队，粉碎敌人！',
    es: '¡Fusiona tanques, construye tu ejército y aplasta al enemigo!',
  },
  categories: ['reaction', 'ages-6-8'],
  ageRange: { min: 7, max: 14 },
  icon: '🪖',
  thumbnail: '/images/games/merge-tank-tactics.svg',
  engine: 'r3f',
  i18nNamespace: 'mergeTankTactics',
};
