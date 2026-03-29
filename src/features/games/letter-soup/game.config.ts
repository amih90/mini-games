import { GameConfig } from '../registry/types';

export const letterSoupConfig: GameConfig = {
  slug: 'letter-soup',
  title: { en: 'Letter Soup', he: 'מרק אותיות', zh: '字母汤', es: 'Sopa de Letras' },
  description: { en: 'Find letters to spell the word!', he: 'מצאו אותיות לאיית המילה!', zh: '找到字母来拼写单词！', es: '¡Encuentra letras para deletrear la palabra!' },
  categories: ['language', 'ages-3-5', 'ages-6-8'],
  ageRange: { min: 4, max: 8 },
  icon: '🍜',
  thumbnail: '/images/games/letter-soup.svg',
  engine: 'react',
  i18nNamespace: 'letterSoup',
};
