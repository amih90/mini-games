import { Animal } from '../types';

// ─── African Savanna Animals ─────────────────────────────────

const lion: Animal = {
  id: 'lion',
  emoji: '🦁',
  continent: 'africa',
  name: {
    en: 'Lion',
    he: 'אריה',
    zh: '狮子',
    es: 'León',
  },
  fact: {
    en: 'Lions live in families called prides!',
    he: 'אריות חיים במשפחות שנקראות להקות!',
    zh: '狮子生活在叫做狮群的家庭里！',
    es: '¡Los leones viven en familias llamadas manadas!',
  },
  challengeType: 'sound_match',
  challengeConfig: { sounds: ['roar', 'trumpet', 'chirp'] },
};

const elephant: Animal = {
  id: 'elephant',
  emoji: '🐘',
  continent: 'africa',
  name: {
    en: 'Elephant',
    he: 'פיל',
    zh: '大象',
    es: 'Elefante',
  },
  fact: {
    en: 'Elephants use their trunks to drink and say hello!',
    he: 'פילים משתמשים בחדק שלהם כדי לשתות ולהגיד שלום!',
    zh: '大象用鼻子喝水和打招呼！',
    es: '¡Los elefantes usan su trompa para beber y saludar!',
  },
  challengeType: 'size_sort',
  challengeConfig: { items: ['baby', 'mama', 'papa'], order: 'ascending' },
};

const giraffe: Animal = {
  id: 'giraffe',
  emoji: '🦒',
  continent: 'africa',
  name: {
    en: 'Giraffe',
    he: 'ג׳ירפה',
    zh: '长颈鹿',
    es: 'Jirafa',
  },
  fact: {
    en: 'Giraffes are the tallest animals — they eat leaves from treetops!',
    he: 'ג׳ירפות הן החיות הגבוהות ביותר — הן אוכלות עלים מצמרות העצים!',
    zh: '长颈鹿是最高的动物——它们吃树顶上的叶子！',
    es: '¡Las jirafas son los animales más altos — comen hojas de las copas de los árboles!',
  },
  challengeType: 'reach_and_feed',
  challengeConfig: { levels: 3, targetHeight: [2, 4, 6] },
};

// ─── Amazon Rainforest Animals ───────────────────────────────

const frog: Animal = {
  id: 'frog',
  emoji: '🐸',
  continent: 'amazon',
  name: {
    en: 'Poison Dart Frog',
    he: 'צפרדע חץ רעל',
    zh: '箭毒蛙',
    es: 'Rana Dardo Venenosa',
  },
  fact: {
    en: 'These tiny frogs are super colorful to warn others: don\'t eat me!',
    he: 'הצפרדעים הקטנות האלה צבעוניות מאוד כדי להזהיר אחרים: אל תאכלו אותי!',
    zh: '这些小青蛙颜色鲜艳是为了警告别人：不要吃我！',
    es: '¡Estas ranitas son súper coloridas para avisar: no me comas!',
  },
  challengeType: 'color_match',
  challengeConfig: { colors: ['red', 'blue', 'yellow', 'green'] },
};

const sloth: Animal = {
  id: 'sloth',
  emoji: '🦥',
  continent: 'amazon',
  name: {
    en: 'Sloth',
    he: 'עצלן',
    zh: '树懒',
    es: 'Perezoso',
  },
  fact: {
    en: 'Sloths move sooo slowly — they sleep 15 hours a day!',
    he: 'עצלנים זזים לאאאט — הם ישנים 15 שעות ביום!',
    zh: '树懒动作超级慢——它们一天睡15个小时！',
    es: '¡Los perezosos se mueven muuuy lento — duermen 15 horas al día!',
  },
  challengeType: 'patience_hold',
  challengeConfig: { durationByDifficulty: { easy: 2, medium: 3, hard: 5 } },
};

const toucan: Animal = {
  id: 'toucan',
  emoji: '🦜',
  continent: 'amazon',
  name: {
    en: 'Toucan',
    he: 'טוקן',
    zh: '巨嘴鸟',
    es: 'Tucán',
  },
  fact: {
    en: 'Toucans have big beaks to reach fruit on thin branches!',
    he: 'לטוקנים יש מקור גדול כדי להגיע לפירות על ענפים דקים!',
    zh: '巨嘴鸟有大嘴巴，可以够到细树枝上的水果！',
    es: '¡Los tucanes tienen picos grandes para alcanzar frutas en ramas delgadas!',
  },
  challengeType: 'fruit_catch',
  challengeConfig: { rounds: 3, fruitsPerRound: { easy: 3, medium: 4, hard: 5 } },
};

// ─── Arctic Wonderland Animals ───────────────────────────────

const penguin: Animal = {
  id: 'penguin',
  emoji: '🐧',
  continent: 'arctic',
  name: {
    en: 'Penguin',
    he: 'פינגווין',
    zh: '企鹅',
    es: 'Pingüino',
  },
  fact: {
    en: 'Penguins can\'t fly but they\'re amazing swimmers!',
    he: 'פינגווינים לא יכולים לעוף אבל הם שחיינים מדהימים!',
    zh: '企鹅不会飞，但它们是游泳高手！',
    es: '¡Los pingüinos no pueden volar pero son nadadores increíbles!',
  },
  challengeType: 'penguin_slide',
  challengeConfig: { gridSize: { easy: 3, medium: 4, hard: 5 } },
};

const polarBear: Animal = {
  id: 'polarBear',
  emoji: '🐻‍❄️',
  continent: 'arctic',
  name: {
    en: 'Polar Bear',
    he: 'דוב קוטב',
    zh: '北极熊',
    es: 'Oso Polar',
  },
  fact: {
    en: 'Polar bears have black skin under white fur to stay warm!',
    he: 'לדובי קוטב יש עור שחור מתחת לפרווה לבנה כדי להישאר חמים!',
    zh: '北极熊白毛下面的皮肤是黑色的，这样可以保暖！',
    es: '¡Los osos polares tienen piel negra bajo su pelaje blanco para mantenerse calientes!',
  },
  challengeType: 'hide_and_seek',
  challengeConfig: { timeLimit: { easy: 10, medium: 7, hard: 5 } },
};

const seal: Animal = {
  id: 'seal',
  emoji: '🦭',
  continent: 'arctic',
  name: {
    en: 'Seal',
    he: 'כלב ים',
    zh: '海豹',
    es: 'Foca',
  },
  fact: {
    en: 'Seals clap their flippers to talk to each other!',
    he: 'כלבי ים מוחאים כפיים עם הסנפירים שלהם כדי לדבר!',
    zh: '海豹拍打鳍来和同伴说话！',
    es: '¡Las focas aplauden con sus aletas para hablar entre ellas!',
  },
  challengeType: 'rhythm_clap',
  challengeConfig: { patternLength: { easy: 3, medium: 4, hard: 5 } },
};

// ─── Australian Outback Animals ──────────────────────────────

const kangaroo: Animal = {
  id: 'kangaroo',
  emoji: '🦘',
  continent: 'australia',
  name: {
    en: 'Kangaroo',
    he: 'קנגורו',
    zh: '袋鼠',
    es: 'Canguro',
  },
  fact: {
    en: 'Baby kangaroos (joeys) live in their mama\'s pouch!',
    he: 'קנגורונים חיים בכיס של אמא שלהם!',
    zh: '小袋鼠住在妈妈的口袋里！',
    es: '¡Los bebés canguro viven en la bolsa de su mamá!',
  },
  challengeType: 'jump_count',
  challengeConfig: { maxJumps: { easy: 3, medium: 5, hard: 7 } },
};

const koala: Animal = {
  id: 'koala',
  emoji: '🐨',
  continent: 'australia',
  name: {
    en: 'Koala',
    he: 'קואלה',
    zh: '考拉',
    es: 'Koala',
  },
  fact: {
    en: 'Koalas sleep 22 hours a day and eat only eucalyptus leaves!',
    he: 'קואלות ישנות 22 שעות ביום ואוכלות רק עלי אקליפטוס!',
    zh: '考拉一天睡22个小时，只吃桉树叶！',
    es: '¡Los koalas duermen 22 horas al día y solo comen hojas de eucalipto!',
  },
  challengeType: 'leaf_match',
  challengeConfig: { leafTypes: ['eucalyptus', 'oak', 'maple', 'palm'] },
};

const platypus: Animal = {
  id: 'platypus',
  emoji: '🦆',
  continent: 'australia',
  name: {
    en: 'Platypus',
    he: 'ברווזן',
    zh: '鸭嘴兽',
    es: 'Ornitorrinco',
  },
  fact: {
    en: 'Platypus is special — it has a duck bill AND a beaver tail!',
    he: 'ברווזן הוא מיוחד — יש לו מקור של ברווז וזנב של בונה!',
    zh: '鸭嘴兽很特别——它有鸭子的嘴和海狸的尾巴！',
    es: '¡El ornitorrinco es especial — tiene pico de pato Y cola de castor!',
  },
  challengeType: 'mix_and_match',
  challengeConfig: { parts: ['bill', 'body', 'tail', 'feet'] },
};

// ─── Ocean Deep Animals ──────────────────────────────────────

const dolphin: Animal = {
  id: 'dolphin',
  emoji: '🐬',
  continent: 'ocean',
  name: {
    en: 'Dolphin',
    he: 'דולפין',
    zh: '海豚',
    es: 'Delfín',
  },
  fact: {
    en: 'Dolphins are super smart — they talk with clicks and whistles!',
    he: 'דולפינים חכמים מאוד — הם מדברים עם נקישות ושריקות!',
    zh: '海豚超级聪明——它们用咔嗒声和口哨声说话！',
    es: '¡Los delfines son súper inteligentes — hablan con clics y silbidos!',
  },
  challengeType: 'bubble_pop',
  challengeConfig: { sequenceLength: { easy: 2, medium: 3, hard: 4 } },
};

const seaTurtle: Animal = {
  id: 'seaTurtle',
  emoji: '🐢',
  continent: 'ocean',
  name: {
    en: 'Sea Turtle',
    he: 'צב ים',
    zh: '海龟',
    es: 'Tortuga Marina',
  },
  fact: {
    en: 'Sea turtles travel thousands of miles across the ocean!',
    he: 'צבי ים נוסעים אלפי קילומטרים לרוחב האוקיינוס!',
    zh: '海龟在海洋中旅行数千英里！',
    es: '¡Las tortugas marinas viajan miles de kilómetros por el océano!',
  },
  challengeType: 'path_trace',
  challengeConfig: { mazeTurns: { easy: 3, medium: 4, hard: 5 } },
};

const blueWhale: Animal = {
  id: 'blueWhale',
  emoji: '🐋',
  continent: 'ocean',
  name: {
    en: 'Blue Whale',
    he: 'לוויתן כחול',
    zh: '蓝鲸',
    es: 'Ballena Azul',
  },
  fact: {
    en: 'Blue whales are the biggest animals EVER — bigger than dinosaurs!',
    he: 'לוויתנים כחולים הם החיות הגדולות ביותר אי פעם — גדולים יותר מדינוזאורים!',
    zh: '蓝鲸是有史以来最大的动物——比恐龙还大！',
    es: '¡Las ballenas azules son los animales más grandes de TODOS — más grandes que los dinosaurios!',
  },
  challengeType: 'size_compare',
  challengeConfig: {
    comparisons: [
      ['blueWhale', 'bus'],
      ['blueWhale', 'elephant'],
      ['blueWhale', 'house'],
    ],
  },
};

// ─── Animals Registry ────────────────────────────────────────

export const ANIMALS: Record<string, Animal> = {
  lion,
  elephant,
  giraffe,
  frog,
  sloth,
  toucan,
  penguin,
  polarBear,
  seal,
  kangaroo,
  koala,
  platypus,
  dolphin,
  seaTurtle,
  blueWhale,
};

export const ANIMALS_BY_CONTINENT: Record<string, Animal[]> = {
  africa: [lion, elephant, giraffe],
  amazon: [frog, sloth, toucan],
  arctic: [penguin, polarBear, seal],
  australia: [kangaroo, koala, platypus],
  ocean: [dolphin, seaTurtle, blueWhale],
};
