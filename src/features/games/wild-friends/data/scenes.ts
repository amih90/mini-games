import { Scene } from '../types';

export const SCENES: Scene[] = [
  {
    id: 'africa',
    continent: {
      en: 'African Savanna',
      he: 'הסוואנה האפריקאית',
      zh: '非洲大草原',
      es: 'Sabana Africana',
    },
    biome: '🌍',
    animalIds: ['lion', 'elephant', 'giraffe'],
    order: 1,
    storyIntro: {
      en: 'Kiwi hears a roar! His friend Lion is calling from the tall grass. Can you help find him?',
      he: 'קיווי שומע שאגה! חברו האריה קורא מהעשב הגבוה. תוכלו לעזור למצוא אותו?',
      zh: '奇异听到了吼声！他的朋友狮子正在高高的草丛中呼唤。你能帮忙找到他吗？',
      es: '¡Kiwi escucha un rugido! Su amigo León llama desde la hierba alta. ¿Puedes ayudar a encontrarlo?',
    },
  },
  {
    id: 'amazon',
    continent: {
      en: 'Amazon Rainforest',
      he: 'יער הגשם של האמזונס',
      zh: '亚马逊雨林',
      es: 'Selva Amazónica',
    },
    biome: '🌴',
    animalIds: ['frog', 'sloth', 'toucan'],
    order: 2,
    storyIntro: {
      en: 'The rainforest is so green and noisy! Kiwi says his friend Toucan lives up in the tallest tree. Let\'s climb up!',
      he: 'יער הגשם כל כך ירוק ורועש! קיווי אומר שחברו הטוקן גר למעלה על העץ הגבוה ביותר. בואו נטפס!',
      zh: '雨林又绿又吵！奇异说他的朋友巨嘴鸟住在最高的树上。我们爬上去吧！',
      es: '¡La selva es tan verde y ruidosa! Kiwi dice que su amigo Tucán vive en el árbol más alto. ¡Subamos!',
    },
  },
  {
    id: 'arctic',
    continent: {
      en: 'Arctic Wonderland',
      he: 'ארץ הפלאות הארקטית',
      zh: '北极仙境',
      es: 'País de las Maravillas Ártico',
    },
    biome: '❄️',
    animalIds: ['penguin', 'polarBear', 'seal'],
    order: 3,
    storyIntro: {
      en: 'Brrr! It\'s so cold here! But look — Kiwi spots something sliding on the ice. It\'s Penguin!',
      he: 'בררר! כל כך קר פה! אבל תראו — קיווי רואה משהו מחליק על הקרח. זה פינגווין!',
      zh: '好冷啊！但是看——奇异发现有东西在冰上滑行。是企鹅！',
      es: '¡Brrr! ¡Hace mucho frío! Pero mira — Kiwi ve algo deslizándose en el hielo. ¡Es Pingüino!',
    },
  },
  {
    id: 'australia',
    continent: {
      en: 'Australian Outback',
      he: 'השטחים הפתוחים של אוסטרליה',
      zh: '澳大利亚内陆',
      es: 'Interior de Australia',
    },
    biome: '🏜️',
    animalIds: ['kangaroo', 'koala', 'platypus'],
    order: 4,
    storyIntro: {
      en: 'The Outback glows orange! Kiwi hears hopping sounds… boing, boing! It\'s Kangaroo with her joey!',
      he: 'השטחים הפתוחים זוהרים בכתום! קיווי שומע קפיצות... בוינג, בוינג! זו קנגורו עם הקנגורון שלה!',
      zh: '内陆发出橙色的光！奇异听到跳跃的声音……蹦蹦！是袋鼠妈妈和她的小袋鼠！',
      es: '¡El Outback brilla en naranja! Kiwi escucha saltos… ¡boing, boing! ¡Es Canguro con su cría!',
    },
  },
  {
    id: 'ocean',
    continent: {
      en: 'Ocean Deep',
      he: 'מעמקי האוקיינוס',
      zh: '深海世界',
      es: 'Océano Profundo',
    },
    biome: '🌊',
    animalIds: ['dolphin', 'seaTurtle', 'blueWhale'],
    order: 5,
    storyIntro: {
      en: 'Splash! We\'re underwater now! Kiwi put on tiny goggles. Look at all the colors in the coral reef!',
      he: 'שפלאש! אנחנו מתחת למים עכשיו! קיווי שם משקפי שחייה קטנטנים. תראו את כל הצבעים בשונית האלמוגים!',
      zh: '扑通！我们现在在水下了！奇异戴上了小小的护目镜。看看珊瑚礁上的所有颜色！',
      es: '¡Splash! ¡Estamos bajo el agua! Kiwi se puso gogles pequeñitos. ¡Mira todos los colores del arrecife!',
    },
  },
];

export const SCENE_BY_ID: Record<string, Scene> = Object.fromEntries(
  SCENES.map((s) => [s.id, s])
);
