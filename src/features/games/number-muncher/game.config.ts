import { GameConfig } from '../registry/types';

export const numberMuncherConfig: GameConfig = {
  slug: 'number-muncher',
  title: { en: 'Number Muncher', he: 'אוכל המספרים', zh: '数字大胃王', es: 'Devorador de Números' },
  description: { en: 'Find numbers that add up to the target!', he: 'מצאו מספרים שמסתכמים למטרה!', zh: '找到相加等于目标的数字！', es: '¡Encuentra números que sumen el objetivo!' },
  categories: ['math', 'ages-3-5', 'ages-6-8'],
  ageRange: { min: 4, max: 8 },
  icon: '🔢',
  thumbnail: '/images/games/number-muncher.svg',
  engine: 'react',
  i18nNamespace: 'numberMuncher',
};
