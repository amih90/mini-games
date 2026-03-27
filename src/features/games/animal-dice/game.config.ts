import { GameConfig } from '../registry/types';

export const animalDiceConfig: GameConfig = {
  slug: 'animal-dice',
  title: {
    en: 'Animal Dice Safari',
    he: 'ספארי הקובייה',
    zh: '动物骰子大冒险',
    es: 'Safari de Dados',
  },
  description: {
    en: 'Roll the 3D dice and count the animals! Learn numbers 1–6 with cute friends.',
    he: 'זרקו את הקובייה התלת-ממדית וספרו את החיות! למדו מספרים 1–6 עם חברים חמודים.',
    zh: '滚动3D骰子，数一数动物！和可爱的朋友们一起学习数字1-6。',
    es: '¡Tira el dado 3D y cuenta los animales! Aprende los números del 1 al 6 con amigos adorables.',
  },
  categories: ['math', 'ages-3-5'],
  ageRange: { min: 2, max: 5 },
  icon: '🎲',
  thumbnail: '/images/games/screenshots/animal-dice.png',
  engine: 'r3f',
  i18nNamespace: 'animalDice',
};
