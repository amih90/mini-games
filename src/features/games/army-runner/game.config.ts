import { GameConfig } from '../registry/types';

export const armyRunnerConfig: GameConfig = {
  slug: 'army-runner',
  title: {
    en: 'Army Runner 3D',
    he: 'מרוץ הצבא 3D',
    zh: '军队跑酷3D',
    es: 'Carrera del Ejército 3D',
  },
  description: {
    en: 'Lead your army through gates, dodge obstacles, and crush enemies! How big can your army grow?',
    he: 'הובילו את הצבא דרך שערים, התחמקו ממכשולים והביסו אויבים! כמה גדול הצבא שלכם יכול לגדול?',
    zh: '带领你的军队通过大门，躲避障碍，击败敌人！你的军队能壮大到多少？',
    es: '¡Lidera tu ejército a través de puertas, esquiva obstáculos y aplasta enemigos! ¿Cuánto puede crecer tu ejército?',
  },
  categories: ['reaction', 'math', 'ages-6-8'],
  ageRange: { min: 5, max: 12 },
  icon: '⚔️',
  thumbnail: '/images/games/army-runner.svg',
  engine: 'r3f',
  i18nNamespace: 'armyRunner',
};
