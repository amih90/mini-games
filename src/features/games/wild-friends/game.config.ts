import { GameConfig } from '../registry/types';

export const wildFriendsConfig: GameConfig = {
  slug: 'wild-friends',
  title: {
    en: 'Wild Friends — World Animal Explorer',
    he: 'חברים פראיים — חוקר חיות העולם',
    zh: '野生朋友 — 世界动物探险家',
    es: 'Amigos Salvajes — Explorador de Animales del Mundo',
  },
  description: {
    en: 'Travel 6 continents with Kiwi the parrot! Discover animals, learn fun facts, and solve puzzles!',
    he: 'טיילו ב-6 יבשות עם קיווי התוכי! גלו חיות, למדו עובדות מעניינות ופתרו חידות!',
    zh: '和鹦鹉奇异一起环游6大洲！发现动物，学习有趣的知识，解决谜题！',
    es: '¡Viaja por 6 continentes con Kiwi el loro! ¡Descubre animales, aprende datos divertidos y resuelve acertijos!',
  },
  categories: ['science', 'ages-3-5'],
  ageRange: { min: 3, max: 5 },
  icon: '🦜',
  thumbnail: '/images/games/wild-friends.svg',
  engine: 'r3f',
  i18nNamespace: 'wildFriends',
};
