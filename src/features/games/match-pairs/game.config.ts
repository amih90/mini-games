import { GameConfig } from '../registry/types';

export const matchPairsConfig: GameConfig = {
  slug: 'match-pairs',
  title: { en: 'Match Pairs', he: 'התאם זוגות', zh: '配对匹配', es: 'Emparejar Parejas' },
  description: { en: 'Match animals to their homes and food!', he: 'התאימו חיות לבתים ולאוכל שלהן!', zh: '将动物与它们的家和食物配对！', es: '¡Empareja animales con sus hogares y comida!' },
  categories: ['science', 'memory', 'ages-3-5'],
  ageRange: { min: 3, max: 7 },
  icon: '🔗',
  thumbnail: '/images/games/screenshots/match-pairs.png',
  engine: 'react',
  i18nNamespace: 'matchPairs',
};
