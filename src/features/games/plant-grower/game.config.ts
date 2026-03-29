import { GameConfig } from '../registry/types';

export const plantGrowerConfig: GameConfig = {
  slug: 'plant-grower',
  title: { en: 'Plant Grower', he: 'מגדל צמחים', zh: '植物种植', es: 'Cultivador de Plantas' },
  description: { en: 'Give your plant water and sun to help it grow!', he: 'תנו לצמח מים ושמש כדי שיגדל!', zh: '给植物浇水和阳光帮助它成长！', es: '¡Dale agua y sol a tu planta para que crezca!' },
  categories: ['science', 'ages-3-5'],
  ageRange: { min: 3, max: 7 },
  icon: '🌱',
  thumbnail: '/images/games/plant-grower.svg',
  engine: 'react',
  i18nNamespace: 'plantGrower',
};
