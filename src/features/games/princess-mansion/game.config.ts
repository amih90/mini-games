import type { GameConfig } from '../registry/types';

export const princessMansionConfig: GameConfig = {
  slug: 'princess-mansion',
  title: { en: 'Royal Princess Mansion', he: 'אחוזת הנסיכות המלכותית', zh: '皇家公主庄园', es: 'Mansión Real de Princesas' },
  description: {
    en: 'Care for eight original princesses in a beautifully illustrated, living mansion. Drag, play, rest, and welcome new friends!',
    he: 'טפלו בשמונה נסיכות מקוריות באחוזה מאוירת ומלאת חיים. גררו, שחקו, נוחו וקבלו חברות חדשות!',
    zh: '在精美而充满生机的庄园里照顾八位原创小公主。拖动、玩耍、休息，迎接新朋友！',
    es: 'Cuida a ocho princesas originales en una mansión ilustrada llena de vida. ¡Arrastra, juega, descansa y recibe nuevas amigas!',
  },
  categories: ['ages-3-5', 'ages-6-8'],
  ageRange: { min: 4, max: 10 },
  icon: '👑',
  thumbnail: '/images/games/screenshots/princess-mansion.png',
  engine: 'phaser',
  i18nNamespace: 'princessMansion',
};
