import { GameConfig } from '../registry/types';

export const rhymeTimeConfig: GameConfig = {
  slug: 'rhyme-time',
  title: { en: 'Rhyme Time', he: 'זמן חרוזים', zh: '押韵时间', es: 'Hora de Rimar' },
  description: { en: 'Match words that rhyme together!', he: 'התאימו מילים שמתחרזות!', zh: '匹配押韵的单词！', es: '¡Empareja palabras que rimen!' },
  categories: ['language', 'ages-3-5', 'ages-6-8'],
  ageRange: { min: 4, max: 8 },
  icon: '🎵',
  thumbnail: '/images/games/screenshots/rhyme-time.png',
  engine: 'react',
  i18nNamespace: 'rhymeTime',
};
