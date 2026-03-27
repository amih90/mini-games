import { GameConfig } from '../registry/types';

export const solarSystem3DConfig: GameConfig = {
  slug: 'solar-system-3d',
  title: {
    en: 'Solar System Explorer',
    he: 'חוקר מערכת השמש',
    zh: '太阳系探索者',
    es: 'Explorador del Sistema Solar',
  },
  description: {
    en: 'Explore the solar system! Click glowing planets to learn amazing facts!',
    he: 'חקרו את מערכת השמש! לחצו על כוכבי לכת זוהרים ולמדו עובדות מדהימות!',
    zh: '探索太阳系！点击发光的行星学习惊人的事实！',
    es: '¡Explora el sistema solar! ¡Haz clic en los planetas brillantes para aprender hechos increíbles!',
  },
  categories: ['science', 'ages-6-8'],
  ageRange: { min: 6, max: 10 },
  icon: '🪐',
  thumbnail: '/images/games/screenshots/solar-system-3d.png',
  engine: 'r3f',
  i18nNamespace: 'solarSystem3D',
};
