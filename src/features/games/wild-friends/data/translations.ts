// ─── Wild Friends — UI Translations ──────────────────────────
// Inline translations pattern for R3F game (not next-intl)

type LocaleStrings = Record<string, string>;
type TranslationMap = Record<string, LocaleStrings>;

export const UI_STRINGS: TranslationMap = {
  // ─── Menu ────────────────────────────────────────────────
  en: {
    // Menu
    title: 'Wild Friends',
    subtitle: 'World Animal Explorer',
    play: 'Start Adventure!',
    difficultyTitle: 'Choose Your Level',
    difficultyEasy: '🌱 Little Cub',
    difficultyMedium: '🌿 Explorer',
    difficultyHard: '🌳 Ranger',
    albumButton: '📖 My Album',

    // Hub
    explore: 'Tap a continent to explore!',
    collection: 'Animal Friends',
    completedCount: '{count} / 15 Friends Found',
    backToGlobe: 'Back to Globe',

    // Gameplay
    discover: 'Tap an animal to discover it!',
    tapAnimal: 'Tap me!',
    great: 'Great job! 🌟',
    tryAgain: 'Oops! Try again!',
    nextAnimal: 'Next friend!',
    sceneComplete: 'You found all the friends here!',

    // Kiwi dialogue
    kiwiWelcome: 'Welcome to the World Garden! My friends are out there — let\'s find them!',
    kiwiEncourage1: 'You can do it!',
    kiwiEncourage2: 'Almost there!',
    kiwiEncourage3: 'Wow, you\'re so smart!',
    kiwiCelebrate: 'Yay! You found a new friend!',

    // Challenge instructions
    challengeSoundMatch: 'Which animal makes this sound?',
    challengeSizeSort: 'Put them in order: small to big!',
    challengeReachAndFeed: 'Help giraffe reach the leaves!',
    challengeColorMatch: 'Find the frog with this color!',
    challengePatienceHold: 'Hold still like a sloth!',
    challengeFruitCatch: 'Catch the falling fruits!',
    challengePenguinSlide: 'Slide penguin to the fish!',
    challengeHideAndSeek: 'Find the hidden polar bear!',
    challengeRhythmClap: 'Clap along with seal!',
    challengeJumpCount: 'How many times did kangaroo jump?',
    challengeLeafMatch: 'Find the eucalyptus leaf!',
    challengeMixAndMatch: 'Build the platypus!',
    challengeBubblePop: 'Pop the bubbles in order!',
    challengePathTrace: 'Help turtle find the way!',
    challengeSizeCompare: 'Which one is bigger?',

    // Finale
    congratulations: 'You did it! ALL of Kiwi\'s friends are home!',
    worldExplorer: '🏆 World Explorer',
    playAgain: 'Play Again',
    resetConfirm: 'Start a new adventure? Your album will be reset.',

    // Instructions Modal
    instructionsTitle: 'How to Play',
    instructionsStep1: 'Tap animals to discover them',
    instructionsStep2: 'Learn fun facts from Kiwi',
    instructionsStep3: 'Play mini-games to help',
    instructionsStep4: 'Collect all 15 friends!',
    instructionsTip: 'Tap Kiwi for hints!',
    controlsTouch: 'Touch: Tap & Swipe',
    controlsMouse: 'Mouse: Click & Drag',
    controlsKeyboard: 'Keyboard: Arrows + Enter',
  },

  he: {
    title: 'חברים פראיים',
    subtitle: 'חוקר חיות העולם',
    play: 'התחילו הרפתקה!',
    difficultyTitle: 'בחרו רמה',
    difficultyEasy: '🌱 גור קטן',
    difficultyMedium: '🌿 חוקר',
    difficultyHard: '🌳 סייר',
    albumButton: '📖 האלבום שלי',

    explore: 'הקישו על יבשת כדי לחקור!',
    collection: 'חברים חיות',
    completedCount: '{count} / 15 חברים נמצאו',
    backToGlobe: 'חזרה לגלובוס',

    discover: 'הקישו על חיה כדי לגלות אותה!',
    tapAnimal: 'הקישו עליי!',
    great: 'כל הכבוד! 🌟',
    tryAgain: 'אופס! נסו שוב!',
    nextAnimal: 'החבר הבא!',
    sceneComplete: 'מצאתם את כל החברים כאן!',

    kiwiWelcome: 'ברוכים הבאים לגן העולמי! החברים שלי בחוץ — בואו נמצא אותם!',
    kiwiEncourage1: 'אתם יכולים!',
    kiwiEncourage2: 'כמעט שם!',
    kiwiEncourage3: 'וואו, אתם כל כך חכמים!',
    kiwiCelebrate: 'יש! מצאתם חבר חדש!',

    challengeSoundMatch: 'איזו חיה עושה את הצליל הזה?',
    challengeSizeSort: 'סדרו לפי גודל: מקטן לגדול!',
    challengeReachAndFeed: 'עזרו לג׳ירפה להגיע לעלים!',
    challengeColorMatch: 'מצאו את הצפרדע בצבע הזה!',
    challengePatienceHold: 'החזיקו בשקט כמו עצלן!',
    challengeFruitCatch: 'תפסו את הפירות הנופלים!',
    challengePenguinSlide: 'החליקו את הפינגווין לדג!',
    challengeHideAndSeek: 'מצאו את דוב הקוטב המוחבא!',
    challengeRhythmClap: 'מחאו כפיים עם כלב הים!',
    challengeJumpCount: 'כמה פעמים הקנגורו קפץ?',
    challengeLeafMatch: 'מצאו את עלה האקליפטוס!',
    challengeMixAndMatch: 'בנו את הברווזן!',
    challengeBubblePop: 'פוצצו בועות לפי הסדר!',
    challengePathTrace: 'עזרו לצב למצוא את הדרך!',
    challengeSizeCompare: 'מי יותר גדול?',

    congratulations: 'עשיתם את זה! כל החברים של קיווי בבית!',
    worldExplorer: '🏆 חוקר העולם',
    playAgain: 'שחקו שוב',
    resetConfirm: 'להתחיל הרפתקה חדשה? האלבום יתאפס.',

    instructionsTitle: 'איך לשחק',
    instructionsStep1: 'הקישו על חיות כדי לגלות אותן',
    instructionsStep2: 'למדו עובדות מעניינות מקיווי',
    instructionsStep3: 'שחקו משחקונים כדי לעזור',
    instructionsStep4: 'אספו את כל 15 החברים!',
    instructionsTip: 'הקישו על קיווי לרמזים!',
    controlsTouch: 'מגע: הקשה והחלקה',
    controlsMouse: 'עכבר: לחיצה וגרירה',
    controlsKeyboard: 'מקלדת: חצים + Enter',
  },

  zh: {
    title: '野生朋友',
    subtitle: '世界动物探险家',
    play: '开始冒险！',
    difficultyTitle: '选择你的等级',
    difficultyEasy: '🌱 小幼崽',
    difficultyMedium: '🌿 探险家',
    difficultyHard: '🌳 护林员',
    albumButton: '📖 我的相册',

    explore: '点击一个大洲去探索！',
    collection: '动物朋友',
    completedCount: '{count} / 15 个朋友已找到',
    backToGlobe: '返回地球仪',

    discover: '点击动物来发现它！',
    tapAnimal: '点我！',
    great: '太棒了！🌟',
    tryAgain: '哎呀！再试一次！',
    nextAnimal: '下一个朋友！',
    sceneComplete: '你找到了这里所有的朋友！',

    kiwiWelcome: '欢迎来到世界花园！我的朋友们在外面——我们去找他们吧！',
    kiwiEncourage1: '你可以的！',
    kiwiEncourage2: '快到了！',
    kiwiEncourage3: '哇，你好聪明！',
    kiwiCelebrate: '耶！你找到了一个新朋友！',

    challengeSoundMatch: '哪个动物发出这个声音？',
    challengeSizeSort: '按顺序排列：从小到大！',
    challengeReachAndFeed: '帮长颈鹿够到树叶！',
    challengeColorMatch: '找到这个颜色的青蛙！',
    challengePatienceHold: '像树懒一样保持不动！',
    challengeFruitCatch: '接住掉落的水果！',
    challengePenguinSlide: '滑动企鹅去找鱼！',
    challengeHideAndSeek: '找到藏起来的北极熊！',
    challengeRhythmClap: '跟海豹一起拍手！',
    challengeJumpCount: '袋鼠跳了几次？',
    challengeLeafMatch: '找到桉树叶！',
    challengeMixAndMatch: '拼出鸭嘴兽！',
    challengeBubblePop: '按顺序戳泡泡！',
    challengePathTrace: '帮海龟找到路！',
    challengeSizeCompare: '哪个更大？',

    congratulations: '你做到了！奇异的所有朋友都回家了！',
    worldExplorer: '🏆 世界探险家',
    playAgain: '再玩一次',
    resetConfirm: '开始新的冒险？你的相册将被重置。',

    instructionsTitle: '怎么玩',
    instructionsStep1: '点击动物来发现它们',
    instructionsStep2: '从奇异那里学习有趣的知识',
    instructionsStep3: '玩小游戏来帮忙',
    instructionsStep4: '收集所有15个朋友！',
    instructionsTip: '点击奇异获取提示！',
    controlsTouch: '触摸：点击和滑动',
    controlsMouse: '鼠标：点击和拖动',
    controlsKeyboard: '键盘：方向键 + Enter',
  },

  es: {
    title: 'Amigos Salvajes',
    subtitle: 'Explorador de Animales del Mundo',
    play: '¡Comenzar Aventura!',
    difficultyTitle: 'Elige Tu Nivel',
    difficultyEasy: '🌱 Cachorro',
    difficultyMedium: '🌿 Explorador',
    difficultyHard: '🌳 Guardabosques',
    albumButton: '📖 Mi Álbum',

    explore: '¡Toca un continente para explorar!',
    collection: 'Amigos Animales',
    completedCount: '{count} / 15 Amigos Encontrados',
    backToGlobe: 'Volver al Globo',

    discover: '¡Toca un animal para descubrirlo!',
    tapAnimal: '¡Tócame!',
    great: '¡Muy bien! 🌟',
    tryAgain: '¡Ups! ¡Inténtalo de nuevo!',
    nextAnimal: '¡Siguiente amigo!',
    sceneComplete: '¡Encontraste todos los amigos aquí!',

    kiwiWelcome: '¡Bienvenidos al Jardín del Mundo! Mis amigos están afuera — ¡vamos a encontrarlos!',
    kiwiEncourage1: '¡Tú puedes!',
    kiwiEncourage2: '¡Casi llegas!',
    kiwiEncourage3: '¡Wow, eres muy listo!',
    kiwiCelebrate: '¡Sí! ¡Encontraste un nuevo amigo!',

    challengeSoundMatch: '¿Qué animal hace este sonido?',
    challengeSizeSort: '¡Ordénalos: de pequeño a grande!',
    challengeReachAndFeed: '¡Ayuda a la jirafa a alcanzar las hojas!',
    challengeColorMatch: '¡Encuentra la rana de este color!',
    challengePatienceHold: '¡Quédate quieto como un perezoso!',
    challengeFruitCatch: '¡Atrapa las frutas que caen!',
    challengePenguinSlide: '¡Desliza al pingüino hasta el pez!',
    challengeHideAndSeek: '¡Encuentra al oso polar escondido!',
    challengeRhythmClap: '¡Aplaude con la foca!',
    challengeJumpCount: '¿Cuántas veces saltó el canguro?',
    challengeLeafMatch: '¡Encuentra la hoja de eucalipto!',
    challengeMixAndMatch: '¡Arma al ornitorrinco!',
    challengeBubblePop: '¡Revienta las burbujas en orden!',
    challengePathTrace: '¡Ayuda a la tortuga a encontrar el camino!',
    challengeSizeCompare: '¿Cuál es más grande?',

    congratulations: '¡Lo lograste! ¡TODOS los amigos de Kiwi están en casa!',
    worldExplorer: '🏆 Explorador del Mundo',
    playAgain: 'Jugar de Nuevo',
    resetConfirm: '¿Empezar una nueva aventura? Tu álbum se reiniciará.',

    instructionsTitle: 'Cómo Jugar',
    instructionsStep1: 'Toca animales para descubrirlos',
    instructionsStep2: 'Aprende datos divertidos de Kiwi',
    instructionsStep3: 'Juega mini-juegos para ayudar',
    instructionsStep4: '¡Colecciona los 15 amigos!',
    instructionsTip: '¡Toca a Kiwi para obtener pistas!',
    controlsTouch: 'Toque: Tocar y Deslizar',
    controlsMouse: 'Ratón: Clic y Arrastrar',
    controlsKeyboard: 'Teclado: Flechas + Enter',
  },
};

/**
 * Get a translation string for a given locale and key.
 * Falls back to English if the locale or key is not found.
 */
export function t(locale: string, key: string): string {
  return UI_STRINGS[locale]?.[key] ?? UI_STRINGS.en[key] ?? key;
}
