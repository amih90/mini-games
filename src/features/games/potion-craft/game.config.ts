import { GameConfig } from '../registry/types';

export const potionCraftConfig: GameConfig = {
  slug: 'potion-craft',
  title: {
    en: 'Potion Craft Lab',
    he: 'מעבדת השיקויים',
    zh: '魔药工坊',
    es: 'Laboratorio de Pociones',
  },
  description: {
    en: 'Mix magical potions in your cauldron to create fantastical creatures! Experiment with ingredients, control the heat, and discover secret recipes.',
    he: 'ערבבו שיקויים קסומים בקלחת כדי ליצור יצורים פנטסטיים! התנסו במרכיבים, שלטו בחום וגלו מתכונים סודיים.',
    zh: '在大锅中混合魔法药水，创造奇幻生物！尝试不同配料，控制火候，发现秘密配方。',
    es: '¡Mezcla pociones mágicas en tu caldero para crear criaturas fantásticas! Experimenta con ingredientes, controla el calor y descubre recetas secretas.',
  },
  categories: ['science', 'patterns', 'ages-6-8'],
  ageRange: { min: 5, max: 14 },
  icon: '🧪',
  thumbnail: '/images/games/screenshots/potion-craft.png',
  engine: 'r3f',
  i18nNamespace: 'potionCraft',
};
