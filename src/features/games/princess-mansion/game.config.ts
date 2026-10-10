import type { GameConfig } from '../registry/types';

export const princessMansionConfig: GameConfig = {
  slug: 'princess-mansion',
  title: { en: 'Royal Princess Mansion', he: 'אחוזת הנסיכות המלכותית', zh: '皇家公主庄园', es: 'Mansión Real de Princesas' },
  description: {
    en: 'Care for eight original princesses, visit the mall and beach, enjoy a storybook playground, and make magical potions!',
    he: 'טפלו בשמונה נסיכות מקוריות, בקרו בקניון ובחוף, שחקו בגן מהאגדות וצרו שיקויים קסומים!',
    zh: '照顾八位原创公主，游逛商场和海滩，在童话游乐园玩耍，制作魔法药水！',
    es: '¡Cuida a ocho princesas originales, visita las tiendas y la playa, juega en un parque de cuento y crea pociones mágicas!',
  },
  categories: ['ages-3-5', 'ages-6-8'],
  ageRange: { min: 4, max: 10 },
  icon: '👑',
  thumbnail: '/images/games/screenshots/princess-mansion.png',
  engine: 'phaser',
  i18nNamespace: 'princessMansion',
};
