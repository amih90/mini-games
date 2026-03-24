import { GameConfig } from '../registry/types';

export const sprintRacePhaserConfig: GameConfig = {
  slug: 'sprint-race-phaser',
  title: {
    en: 'Olympic Sprint',
    he: 'ספרינט אולימפי',
    zh: '奥运短跑',
    es: 'Sprint Olímpico',
  },
  description: {
    en: '4 Olympic track events: 100m, 200m, 400m & 110m Hurdles. Tap to sprint, jump over hurdles, manage your stamina!',
    he: '4 תחרויות אולימפיות: 100 מ׳, 200 מ׳, 400 מ׳ ומשוכות 110 מ׳. הקישו לספרינט, קפצו מעל משוכות, נהלו סיבולת!',
    zh: '4项奥运田径赛事：100米、200米、400米和110米跨栏。点击冲刺，跨越栏架，管理体力！',
    es: '4 eventos olímpicos: 100m, 200m, 400m y 110m Vallas. ¡Toca para correr, salta vallas, gestiona tu energía!',
  },
  categories: ['reaction', 'ages-6-8'],
  ageRange: { min: 5, max: 12 },
  icon: '🏅',
  thumbnail: '/images/games/screenshots/sprint-race-phaser.png',
  engine: 'phaser',
  i18nNamespace: 'sprintRacePhaser',
};
