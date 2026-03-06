'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { useRetroSounds } from '@/hooks/useRetroSounds';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultySettings {
  playerSpeed: number;
  bulletSpeed: number;
  chickenSpeed: number;
  eggSpeed: number;
  eggDropChance: number;
  lives: number;
  chickenRows: number;
  chickenCols: number;
  maxWaves: number;
  shootCooldown: number;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Chicken {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'golden';
  hit: boolean;
}

interface Egg {
  x: number;
  y: number;
  radius: number;
}

interface Feather {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  color: string;
  life: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 40;
const BULLET_WIDTH = 6;
const BULLET_HEIGHT = 15;
const CHICKEN_WIDTH = 45;
const CHICKEN_HEIGHT = 40;

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    playerSpeed: 9,
    bulletSpeed: 14,
    chickenSpeed: 1.0,
    eggSpeed: 3,
    eggDropChance: 0.0015,
    lives: 5,
    chickenRows: 3,
    chickenCols: 6,
    maxWaves: 5,
    shootCooldown: 150,
  },
  medium: {
    playerSpeed: 8,
    bulletSpeed: 12,
    chickenSpeed: 1.5,
    eggSpeed: 4,
    eggDropChance: 0.003,
    lives: 3,
    chickenRows: 4,
    chickenCols: 8,
    maxWaves: 5,
    shootCooldown: 200,
  },
  hard: {
    playerSpeed: 7,
    bulletSpeed: 10,
    chickenSpeed: 2.2,
    eggSpeed: 5.5,
    eggDropChance: 0.005,
    lives: 2,
    chickenRows: 5,
    chickenCols: 8,
    maxWaves: 7,
    shootCooldown: 250,
  },
};

// ---------------------------------------------------------------------------
// i18n – 4 locales
// ---------------------------------------------------------------------------

const translations: Record<string, Record<string, string>> = {
  en: {
    title: 'Chicken Invaders',
    description: 'Defend Earth from the chickens!',
    score: 'Score',
    highScore: 'Best',
    lives: 'Lives',
    level: 'Wave',
    gameOver: 'Game Over!',
    victory: 'Victory!',
    playAgain: 'Play Again',
    tapToStart: 'Start Game',
    selectDifficulty: 'Select Difficulty',
    easy: '🟢 Easy',
    medium: '🟡 Medium',
    hard: '🔴 Hard',
    easyDesc: 'Ages 3-6',
    mediumDesc: 'Ages 6-10',
    hardDesc: 'Ages 10+',
    wave: 'Wave',
    waveCleared: 'Wave Cleared!',
    finalScore: 'Final Score',
    newHighScore: 'New High Score!',
    shoot: 'FIRE',
    left: '◀',
    right: '▶',
  },
  he: {
    title: 'פולשי התרנגולות',
    description: '!הגנו על כדור הארץ מפני התרנגולות',
    score: 'ניקוד',
    highScore: 'שיא',
    lives: 'חיים',
    level: 'גל',
    gameOver: '!המשחק נגמר',
    victory: '!ניצחון',
    playAgain: 'שחק שוב',
    tapToStart: 'התחל משחק',
    selectDifficulty: 'בחר רמת קושי',
    easy: '🟢 קל',
    medium: '🟡 בינוני',
    hard: '🔴 קשה',
    easyDesc: 'גילאי 3-6',
    mediumDesc: 'גילאי 6-10',
    hardDesc: '+גילאי 10',
    wave: 'גל',
    waveCleared: '!הגל נוקה',
    finalScore: 'ניקוד סופי',
    newHighScore: '!שיא חדש',
    shoot: 'ירי',
    left: '◀',
    right: '▶',
  },
  zh: {
    title: '小鸡入侵者',
    description: '保卫地球，击退小鸡！',
    score: '得分',
    highScore: '最高分',
    lives: '生命',
    level: '波次',
    gameOver: '游戏结束！',
    victory: '胜利！',
    playAgain: '再玩一次',
    tapToStart: '开始游戏',
    selectDifficulty: '选择难度',
    easy: '🟢 简单',
    medium: '🟡 中等',
    hard: '🔴 困难',
    easyDesc: '3-6岁',
    mediumDesc: '6-10岁',
    hardDesc: '10岁+',
    wave: '波次',
    waveCleared: '波次通过！',
    finalScore: '最终得分',
    newHighScore: '新纪录！',
    shoot: '开火',
    left: '◀',
    right: '▶',
  },
  es: {
    title: 'Invasores Pollo',
    description: '¡Defiende la Tierra de los pollos!',
    score: 'Puntos',
    highScore: 'Récord',
    lives: 'Vidas',
    level: 'Oleada',
    gameOver: '¡Fin del juego!',
    victory: '¡Victoria!',
    playAgain: 'Jugar de nuevo',
    tapToStart: 'Iniciar juego',
    selectDifficulty: 'Elige dificultad',
    easy: '🟢 Fácil',
    medium: '🟡 Medio',
    hard: '🔴 Difícil',
    easyDesc: 'Edades 3-6',
    mediumDesc: 'Edades 6-10',
    hardDesc: 'Edades 10+',
    wave: 'Oleada',
    waveCleared: '¡Oleada superada!',
    finalScore: 'Puntuación final',
    newHighScore: '¡Nuevo récord!',
    shoot: 'FUEGO',
    left: '◀',
    right: '▶',
  },
};

// ---------------------------------------------------------------------------
// Instructions (Feynman-style) – 4 locales
// ---------------------------------------------------------------------------

const instructionsData: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      {
        icon: '🐔',
        title: 'The Chickens Are Coming!',
        description:
          'Waves of angry chickens are invading from space! They march across the sky and drop eggs on you. Your job is to zap them all before they reach your spaceship.',
      },
      {
        icon: '🚀',
        title: 'You Are The Pilot',
        description:
          'Move your spaceship left and right at the bottom of the screen. Press fire to shoot lasers up at the chickens. Each chicken you hit disappears in a puff of feathers!',
      },
      {
        icon: '🥚',
        title: 'Watch Out For Eggs!',
        description:
          'Chickens drop eggs that fall toward you. If an egg hits your ship you lose a life. Dodge them by moving out of the way!',
      },
      {
        icon: '⭐',
        title: 'Scoring & Golden Chickens',
        description:
          'Normal chickens = 10 pts. Golden chickens = 50 pts! Clear all chickens in a wave to advance. Beat all waves to win!',
      },
    ],
    controls: [
      { icon: '⬅️', description: 'Arrow keys or A/D to move left/right' },
      { icon: '🔫', description: 'Space or click/tap to shoot' },
      { icon: '🖱️', description: 'Move mouse to steer ship' },
      { icon: '📱', description: 'Use on-screen buttons on mobile' },
    ],
    tip: 'Focus on dodging eggs first — you can always shoot more chickens, but you only have a few lives!',
  },
  he: {
    instructions: [
      {
        icon: '🐔',
        title: '!התרנגולות באות',
        description:
          'גלי תרנגולות כועסות פולשים מהחלל! הן צועדות על פני השמיים ומפילות ביצים. המשימה שלך היא לחסל את כולן לפני שהן מגיעות לחללית.',
      },
      {
        icon: '🚀',
        title: 'אתה הטייס',
        description:
          'הזז את החללית שלך שמאלה וימינה בתחתית המסך. לחץ על ירי כדי לשגר לייזרים לעבר התרנגולות. כל תרנגולת שפוגעים בה נעלמת בענן נוצות!',
      },
      {
        icon: '🥚',
        title: '!היזהרו מביצים',
        description:
          'תרנגולות מפילות ביצים שנופלות לעברך. אם ביצה פוגעת בחללית אתה מאבד חיים. התחמק על ידי תזוזה הצידה!',
      },
      {
        icon: '⭐',
        title: 'ניקוד ותרנגולות זהב',
        description:
          'תרנגולת רגילה = 10 נק\'. תרנגולת זהב = 50 נק\'! חסלו את כל התרנגולות בגל כדי להתקדם. נצחו את כל הגלים כדי לנצח!',
      },
    ],
    controls: [
      { icon: '⬅️', description: 'חצים או A/D לתזוזה שמאלה/ימינה' },
      { icon: '🔫', description: 'רווח או לחיצה/נגיעה לירי' },
      { icon: '🖱️', description: 'הזז את העכבר לכיוון החללית' },
      { icon: '📱', description: 'השתמש בכפתורים במסך בנייד' },
    ],
    tip: 'התמקדו קודם בהתחמקות מביצים — תמיד אפשר לירות עוד תרנגולות, אבל יש לכם רק כמה חיים!',
  },
  zh: {
    instructions: [
      {
        icon: '🐔',
        title: '小鸡来了！',
        description:
          '一波又一波愤怒的小鸡正从太空入侵！它们在天空中行军并向你扔鸡蛋。你的任务是在它们到达你的飞船之前消灭它们。',
      },
      {
        icon: '🚀',
        title: '你是飞行员',
        description:
          '在屏幕底部左右移动你的飞船。按射击键向小鸡发射激光。每只被击中的小鸡都会化为一团羽毛！',
      },
      {
        icon: '🥚',
        title: '小心鸡蛋！',
        description:
          '小鸡会扔下鸡蛋向你砸来。如果鸡蛋击中你的飞船，你会失去一条命。移动躲开它们！',
      },
      {
        icon: '⭐',
        title: '计分与金鸡',
        description:
          '普通小鸡=10分。金色小鸡=50分！消灭一波中的所有小鸡即可推进。打败所有波次即可获胜！',
      },
    ],
    controls: [
      { icon: '⬅️', description: '方向键或A/D左右移动' },
      { icon: '🔫', description: '空格键或点击/触摸射击' },
      { icon: '🖱️', description: '移动鼠标控制飞船' },
      { icon: '📱', description: '移动端使用屏幕按钮' },
    ],
    tip: '先专注于躲避鸡蛋——你总能打更多小鸡，但生命只有几条！',
  },
  es: {
    instructions: [
      {
        icon: '🐔',
        title: '¡Los pollos vienen!',
        description:
          '¡Oleadas de pollos furiosos invaden desde el espacio! Marchan por el cielo y te lanzan huevos. Tu misión es eliminarlos antes de que alcancen tu nave.',
      },
      {
        icon: '🚀',
        title: 'Tú eres el piloto',
        description:
          'Mueve tu nave a izquierda y derecha en la parte inferior de la pantalla. Pulsa disparar para lanzar láseres hacia los pollos. ¡Cada pollo alcanzado explota en una nube de plumas!',
      },
      {
        icon: '🥚',
        title: '¡Cuidado con los huevos!',
        description:
          'Los pollos lanzan huevos que caen hacia ti. Si un huevo golpea tu nave, pierdes una vida. ¡Esquívalos moviéndote!',
      },
      {
        icon: '⭐',
        title: 'Puntuación y pollos dorados',
        description:
          'Pollo normal = 10 pts. ¡Pollo dorado = 50 pts! Elimina todos los pollos de una oleada para avanzar. ¡Supera todas las oleadas para ganar!',
      },
    ],
    controls: [
      { icon: '⬅️', description: 'Flechas o A/D para mover izquierda/derecha' },
      { icon: '🔫', description: 'Espacio o clic/toque para disparar' },
      { icon: '🖱️', description: 'Mueve el ratón para dirigir la nave' },
      { icon: '📱', description: 'Usa los botones en pantalla en móvil' },
    ],
    tip: '¡Concéntrate primero en esquivar huevos — siempre puedes disparar más pollos, pero solo tienes unas pocas vidas!',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ChickenInvadersGameProps {
  locale?: string;
}

export default function ChickenInvadersGame({ locale = 'en' }: ChickenInvadersGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);

  // Sound
  const {
    playClick,
    playSuccess,
    playWin,
    playShoot,
    playHit,
    playGameOver,
    playLevelUp,
  } = useRetroSounds();

  // i18n helpers
  const t = translations[locale] || translations.en;
  const isRtl = locale === 'he';
  const instrData = instructionsData[locale] || instructionsData.en;

  // Game state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'win'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [showWin, setShowWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ w: CANVAS_WIDTH, h: CANVAS_HEIGHT });

  // High score
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chicken-invaders-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // Settings ref (derived from difficulty)
  const settingsRef = useRef<DifficultySettings>(DIFFICULTY_SETTINGS.medium);

  // Game object refs
  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  });
  const bulletsRef = useRef<Bullet[]>([]);
  const chickensRef = useRef<Chicken[]>([]);
  const eggsRef = useRef<Egg[]>([]);
  const feathersRef = useRef<Feather[]>([]);
  const chickenDirectionRef = useRef<number>(1);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseXRef = useRef<number | null>(null);
  const lastShotRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const livesRef = useRef(3);

  // Keep refs in sync with state
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  // Persist high score
  const updateHighScore = useCallback(
    (newScore: number) => {
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('chicken-invaders-highscore', String(newScore));
      }
    },
    [highScore],
  );

  // Responsive canvas
  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      const maxW = Math.min(containerRef.current.clientWidth - 16, 500);
      const ratio = CANVAS_HEIGHT / CANVAS_WIDTH;
      setCanvasSize({ w: maxW, h: Math.round(maxW * ratio) });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Initialize chickens for a wave
  const initChickens = useCallback(
    (levelNum: number) => {
      const s = settingsRef.current;
      const chickens: Chicken[] = [];
      const rows = Math.min(s.chickenRows + Math.floor(levelNum / 2), 6);
      const cols = s.chickenCols;
      const startX = (CANVAS_WIDTH - cols * (CHICKEN_WIDTH + 10)) / 2;
      const startY = 50;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          chickens.push({
            x: startX + col * (CHICKEN_WIDTH + 10),
            y: startY + row * (CHICKEN_HEIGHT + 10),
            width: CHICKEN_WIDTH,
            height: CHICKEN_HEIGHT,
            type: Math.random() < 0.1 + levelNum * 0.02 ? 'golden' : 'normal',
            hit: false,
          });
        }
      }
      chickensRef.current = chickens;
      chickenDirectionRef.current = 1;
    },
    [],
  );

  // Start game with chosen difficulty
  const startGame = useCallback(
    (diff: Difficulty) => {
      const s = DIFFICULTY_SETTINGS[diff];
      settingsRef.current = s;
      setDifficulty(diff);
      setGameState('playing');
      setScore(0);
      scoreRef.current = 0;
      setLives(s.lives);
      livesRef.current = s.lives;
      setLevel(1);
      levelRef.current = 1;
      playerRef.current = {
        x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
        y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
      };
      bulletsRef.current = [];
      eggsRef.current = [];
      feathersRef.current = [];
      initChickens(1);
      playClick();
    },
    [initChickens, playClick],
  );

  // Shoot bullet
  const shoot = useCallback(() => {
    const now = Date.now();
    if (now - lastShotRef.current < settingsRef.current.shootCooldown) return;
    lastShotRef.current = now;

    const player = playerRef.current;
    bulletsRef.current.push({
      x: player.x + player.width / 2 - BULLET_WIDTH / 2,
      y: player.y - BULLET_HEIGHT,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
    });
    playShoot();
  }, [playShoot]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'playing') {
          shoot();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, shoot]);

  // Mouse input
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scaleX = () => CANVAS_WIDTH / canvas.clientWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseXRef.current = (e.clientX - rect.left) * scaleX();
    };
    const handleMouseLeave = () => {
      mouseXRef.current = null;
    };
    const handleClick = () => {
      if (gameState === 'playing') shoot();
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameState, shoot]);

  // Touch input
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scaleX = () => CANVAS_WIDTH / canvas.clientWidth;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseXRef.current = (e.touches[0].clientX - rect.left) * scaleX();
        if (gameState === 'playing') shoot();
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseXRef.current = (e.touches[0].clientX - rect.left) * scaleX();
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      mouseXRef.current = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState, shoot]);

  // Spawn feathers
  const spawnFeathers = (x: number, y: number, isGolden: boolean) => {
    const colors = isGolden
      ? ['#FFD700', '#FFA500', '#FFFF00']
      : ['#FFFFFF', '#F5F5DC', '#FFE4C4'];
    for (let i = 0; i < 8; i++) {
      feathersRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * -4 + 2,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 60,
      });
    }
  };

  // -----------------------------------------------------------------------
  // Main game loop
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = settingsRef.current;

    let running = true;

    const gameLoop = () => {
      if (!running) return;

      const player = playerRef.current;
      const bullets = bulletsRef.current;
      const chickens = chickensRef.current;
      const eggs = eggsRef.current;
      const feathers = feathersRef.current;
      const keys = keysRef.current;
      const currentLevel = levelRef.current;

      // Player movement – keyboard
      if (keys.has('ArrowLeft') || keys.has('KeyA')) {
        player.x = Math.max(0, player.x - s.playerSpeed);
      }
      if (keys.has('ArrowRight') || keys.has('KeyD')) {
        player.x = Math.min(CANVAS_WIDTH - player.width, player.x + s.playerSpeed);
      }

      // Player movement – mouse / touch
      if (mouseXRef.current !== null) {
        const targetX = mouseXRef.current - player.width / 2;
        const clampedX = Math.max(0, Math.min(CANVAS_WIDTH - player.width, targetX));
        player.x += (clampedX - player.x) * 0.15;
      }

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= s.bulletSpeed;
        if (bullets[i].y + bullets[i].height < 0) {
          bullets.splice(i, 1);
        }
      }

      // Update chickens
      let moveDown = false;
      const speed = s.chickenSpeed + (currentLevel - 1) * 0.3;

      for (const chicken of chickens) {
        if (chicken.hit) continue;
        chicken.x += chickenDirectionRef.current * speed;
        if (chicken.x <= 0 || chicken.x + chicken.width >= CANVAS_WIDTH) {
          moveDown = true;
        }
      }

      if (moveDown) {
        chickenDirectionRef.current *= -1;
        for (const chicken of chickens) {
          if (!chicken.hit) {
            chicken.y += 20;
            if (chicken.y + chicken.height >= player.y) {
              running = false;
              updateHighScore(scoreRef.current);
              playGameOver();
              setGameState('gameover');
              return;
            }
          }
        }
      }

      // Chickens drop eggs
      for (const chicken of chickens) {
        if (!chicken.hit && Math.random() < s.eggDropChance * (1 + currentLevel * 0.2)) {
          eggs.push({
            x: chicken.x + chicken.width / 2,
            y: chicken.y + chicken.height,
            radius: 6,
          });
        }
      }

      // Update eggs
      for (let i = eggs.length - 1; i >= 0; i--) {
        eggs[i].y += s.eggSpeed;
        if (eggs[i].y > CANVAS_HEIGHT) {
          eggs.splice(i, 1);
          continue;
        }
        const egg = eggs[i];
        if (
          egg.x > player.x &&
          egg.x < player.x + player.width &&
          egg.y + egg.radius > player.y &&
          egg.y - egg.radius < player.y + player.height
        ) {
          eggs.splice(i, 1);
          playHit();
          setLives((l) => {
            const newLives = l - 1;
            livesRef.current = newLives;
            if (newLives <= 0) {
              running = false;
              updateHighScore(scoreRef.current);
              playGameOver();
              setGameState('gameover');
            }
            return newLives;
          });
        }
      }

      // Bullet-chicken collisions
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const bullet = bullets[bi];
        for (let ci = chickens.length - 1; ci >= 0; ci--) {
          const chicken = chickens[ci];
          if (chicken.hit) continue;
          if (
            bullet.x < chicken.x + chicken.width &&
            bullet.x + bullet.width > chicken.x &&
            bullet.y < chicken.y + chicken.height &&
            bullet.y + bullet.height > chicken.y
          ) {
            bullets.splice(bi, 1);
            chicken.hit = true;
            spawnFeathers(
              chicken.x + chicken.width / 2,
              chicken.y + chicken.height / 2,
              chicken.type === 'golden',
            );
            const points = chicken.type === 'golden' ? 50 : 10;
            setScore((prev) => {
              const next = prev + points;
              scoreRef.current = next;
              return next;
            });
            playSuccess();
            break;
          }
        }
      }

      // Update feathers
      for (let i = feathers.length - 1; i >= 0; i--) {
        const f = feathers[i];
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.1;
        f.rotation += 5;
        f.life--;
        if (f.life <= 0) feathers.splice(i, 1);
      }

      // Remove hit chickens
      const aliveChickens = chickens.filter((c) => !c.hit);
      chickensRef.current = aliveChickens;

      // Wave complete?
      if (aliveChickens.length === 0) {
        const newLevel = currentLevel + 1;
        if (newLevel > s.maxWaves) {
          running = false;
          updateHighScore(scoreRef.current);
          playWin();
          setGameState('win');
          setShowWin(true);
        } else {
          setLevel(newLevel);
          levelRef.current = newLevel;
          initChickens(newLevel);
          eggsRef.current = [];
          playLevelUp();
        }
      }

      // Draw
      draw(ctx, player, bullets, chickensRef.current, eggs, feathers);
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      running = false;
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // -----------------------------------------------------------------------
  // Drawing helpers
  // -----------------------------------------------------------------------

  const draw = (
    ctx: CanvasRenderingContext2D,
    player: Player,
    bullets: Bullet[],
    chickens: Chicken[],
    eggs: Egg[],
    feathers: Feather[],
  ) => {
    ctx.fillStyle = '#0a0a20';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
      const x = (i * 73) % CANVAS_WIDTH;
      const y = (i * 97 + Date.now() * 0.02) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 2, 2);
    }

    // Feathers
    for (const f of feathers) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate((f.rotation * Math.PI) / 180);
      ctx.fillStyle = f.color;
      ctx.globalAlpha = f.life / 60;
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Chickens
    for (const chicken of chickens) {
      drawChicken(ctx, chicken);
    }

    // Eggs
    ctx.fillStyle = '#F5F5DC';
    for (const egg of eggs) {
      ctx.beginPath();
      ctx.ellipse(egg.x, egg.y, egg.radius * 0.7, egg.radius, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#DDD';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Bullets
    for (const bullet of bullets) {
      const gradient = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x, bullet.y + bullet.height);
      gradient.addColorStop(0, '#00ff00');
      gradient.addColorStop(1, '#00aa00');
      ctx.fillStyle = gradient;
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 10;
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      ctx.shadowBlur = 0;
    }

    // Player ship
    drawSpaceship(ctx, player);
  };

  const drawChicken = (ctx: CanvasRenderingContext2D, chicken: Chicken) => {
    const { x, y, width, height, type } = chicken;
    const cx = x + width / 2;
    const cy = y + height / 2;

    ctx.fillStyle = type === 'golden' ? '#FFD700' : '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, width / 2 - 5, height / 2 - 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = type === 'golden' ? '#B8860B' : '#DDD';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = type === 'golden' ? '#FFD700' : '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FF4444';
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 20);
    ctx.lineTo(cx - 2, cy - 28);
    ctx.lineTo(cx + 2, cy - 25);
    ctx.lineTo(cx + 5, cy - 30);
    ctx.lineTo(cx + 8, cy - 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(cx + 10, cy - 10);
    ctx.lineTo(cx + 18, cy - 7);
    ctx.lineTo(cx + 10, cy - 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(cx + 3, cy - 12, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy - 18);
    ctx.lineTo(cx + 8, cy - 15);
    ctx.stroke();

    ctx.fillStyle = type === 'golden' ? '#DAA520' : '#EEE';
    ctx.beginPath();
    ctx.ellipse(cx - 15, cy + 5, 8, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 15, cy + 5, 8, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawSpaceship = (ctx: CanvasRenderingContext2D, player: Player) => {
    const { x, y, width, height } = player;
    const cx = x + width / 2;

    const bodyGradient = ctx.createLinearGradient(x, y, x, y + height);
    bodyGradient.addColorStop(0, '#4488ff');
    bodyGradient.addColorStop(0.5, '#2266dd');
    bodyGradient.addColorStop(1, '#1144aa');
    ctx.fillStyle = bodyGradient;

    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width - 10, y + height);
    ctx.lineTo(cx, y + height - 15);
    ctx.lineTo(x + 10, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#88ccff';
    ctx.beginPath();
    ctx.ellipse(cx, y + 15, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(cx - 8, y + height);
    ctx.lineTo(cx, y + height + 10 + Math.random() * 5);
    ctx.lineTo(cx + 8, y + height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.moveTo(cx - 4, y + height);
    ctx.lineTo(cx, y + height + 6 + Math.random() * 3);
    ctx.lineTo(cx + 4, y + height);
    ctx.closePath();
    ctx.fill();
  };

  // Draw idle / menu canvas background
  useEffect(() => {
    if (gameState !== 'menu') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a20';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
      const x = (i * 73) % CANVAS_WIDTH;
      const y = (i * 97) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 2, 2);
    }

    drawChicken(ctx, {
      x: CANVAS_WIDTH / 2 - 22,
      y: 180,
      width: CHICKEN_WIDTH,
      height: CHICKEN_HEIGHT,
      type: 'normal',
      hit: false,
    });

    drawSpaceship(ctx, {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: CANVAS_HEIGHT - PLAYER_HEIGHT - 100,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    });
  }, [gameState]);

  // Restart → back to menu
  const restartGame = useCallback(() => {
    setGameState('menu');
    setDifficulty(null);
    setScore(0);
    setLives(3);
    setLevel(1);
    setShowWin(false);
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const maxLives = difficulty ? DIFFICULTY_SETTINGS[difficulty].lives : 3;

  return (
    <GameWrapper
      title={t.title}
      onInstructionsClick={() => setShowInstructions(true)}
    >
      <div className={`flex flex-col items-center gap-4 ${isRtl ? 'direction-rtl' : ''}`} ref={containerRef}>
        {/* Stats bar — visible when playing or game over */}
        {(gameState === 'playing' || gameState === 'gameover' || gameState === 'win') && (
          <div className="flex flex-wrap justify-center gap-3 text-center">
            <div className="bg-white/90 rounded-2xl px-4 py-2 shadow-lg">
              <div className="text-xs text-slate-500 font-medium">{t.score}</div>
              <div className="text-xl font-bold text-[#00a4e4]">{score}</div>
            </div>
            <div className="bg-white/90 rounded-2xl px-4 py-2 shadow-lg">
              <div className="text-xs text-slate-500 font-medium">{t.highScore}</div>
              <div className="text-xl font-bold text-[#f7941d]">{Math.max(highScore, score)}</div>
            </div>
            <LevelDisplay level={level} locale={locale} isRtl={isRtl} />
            <div className="bg-white/90 rounded-2xl px-4 py-2 shadow-lg">
              <div className="text-xs text-slate-500 font-medium">{t.lives}</div>
              <div className="text-xl font-bold text-[#ec4399]">
                {'❤️'.repeat(Math.max(0, lives))}
                {'🖤'.repeat(Math.max(0, maxLives - Math.max(0, lives)))}
              </div>
            </div>
            {difficulty && (
              <div className="bg-white/90 rounded-2xl px-4 py-2 shadow-lg">
                <div className="text-xs text-slate-500 font-medium">
                  {difficulty === 'easy' ? t.easy : difficulty === 'medium' ? t.medium : t.hard}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Canvas */}
        <div className="relative w-full max-w-[500px]">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-3xl shadow-2xl cursor-crosshair border-4 border-[#1a1a2e] w-full h-auto"
            style={{ touchAction: 'none' }}
          />

          {/* Menu / difficulty select overlay */}
          <AnimatePresence>
            {gameState === 'menu' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-3xl"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-6xl mb-3"
                >
                  🐔
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-1 drop-shadow-lg">
                  {t.title}
                </h2>
                <p className="text-white/70 text-sm mb-5">{t.description}</p>
                <p className="text-white font-semibold mb-3 text-lg">{t.selectDifficulty}</p>
                <div className="flex flex-col gap-3 w-56">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { playClick(); startGame('easy'); }}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    {t.easy}
                    <span className="block text-xs font-normal opacity-80">{t.easyDesc}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { playClick(); startGame('medium'); }}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    {t.medium}
                    <span className="block text-xs font-normal opacity-80">{t.mediumDesc}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { playClick(); startGame('hard'); }}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    {t.hard}
                    <span className="block text-xs font-normal opacity-80">{t.hardDesc}</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Over overlay */}
          <AnimatePresence>
            {gameState === 'gameover' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-3xl"
              >
                <motion.div
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-xs w-full"
                >
                  <div className="text-5xl mb-4">💥</div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.gameOver}</h2>
                  <div className="text-lg text-slate-600 mb-1">
                    {t.finalScore}: <span className="font-bold text-[#00a4e4]">{score}</span>
                  </div>
                  {score >= highScore && score > 0 && (
                    <div className="text-sm font-bold text-[#f7941d] mb-1">{t.newHighScore}</div>
                  )}
                  <div className="text-sm text-slate-500 mb-1">
                    {t.highScore}: {Math.max(highScore, score)}
                  </div>
                  <div className="text-sm text-slate-500 mb-6">
                    {t.wave}: {level}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { playClick(); restartGame(); }}
                    className="px-8 py-3 bg-[#6cbe45] hover:bg-[#5aa838] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    {t.playAgain}
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Victory overlay (shown alongside WinModal) */}
          <AnimatePresence>
            {gameState === 'win' && !showWin && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-3xl"
              >
                <motion.div
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-xs w-full"
                >
                  <div className="text-5xl mb-4">🏆</div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.victory}</h2>
                  <div className="text-lg text-slate-600 mb-1">
                    {t.finalScore}: <span className="font-bold text-[#00a4e4]">{score}</span>
                  </div>
                  {score >= highScore && score > 0 && (
                    <div className="text-sm font-bold text-[#f7941d] mb-1">{t.newHighScore}</div>
                  )}
                  <div className="text-sm text-slate-500 mb-6">
                    {t.highScore}: {Math.max(highScore, score)}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { playClick(); restartGame(); }}
                    className="px-8 py-3 bg-[#6cbe45] hover:bg-[#5aa838] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    {t.playAgain}
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* On-screen mobile controls */}
        <div className="flex gap-4 sm:hidden">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onTouchStart={(e) => {
              e.preventDefault();
              keysRef.current.add('ArrowLeft');
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              keysRef.current.delete('ArrowLeft');
            }}
            className="min-h-[56px] min-w-[56px] rounded-2xl bg-white/90 shadow-lg text-2xl font-bold flex items-center justify-center select-none active:bg-white"
            aria-label="Move left"
          >
            {t.left}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onTouchStart={(e) => {
              e.preventDefault();
              if (gameState === 'playing') shoot();
            }}
            className="min-h-[56px] min-w-[72px] rounded-2xl bg-red-500 shadow-lg text-white text-lg font-bold flex items-center justify-center select-none active:bg-red-600"
            aria-label="Shoot"
          >
            {t.shoot}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onTouchStart={(e) => {
              e.preventDefault();
              keysRef.current.add('ArrowRight');
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              keysRef.current.delete('ArrowRight');
            }}
            className="min-h-[56px] min-w-[56px] rounded-2xl bg-white/90 shadow-lg text-2xl font-bold flex items-center justify-center select-none active:bg-white"
            aria-label="Move right"
          >
            {t.right}
          </motion.button>
        </div>

        {/* Desktop controls hint */}
        <div className="hidden sm:flex gap-4 text-slate-600 text-sm">
          <span className="px-3 py-1 bg-white/80 rounded-full">⌨️ ←/→ or A/D</span>
          <span className="px-3 py-1 bg-white/80 rounded-full">🖱️ Move & Click</span>
          <span className="px-3 py-1 bg-white/80 rounded-full">Space = Shoot</span>
        </div>
      </div>

      {/* Win Modal */}
      <WinModal
        isOpen={showWin}
        onClose={() => setShowWin(false)}
        onPlayAgain={() => {
          setShowWin(false);
          restartGame();
        }}
        score={score}
      />

      {/* Instructions Modal */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={t.title}
        instructions={instrData.instructions}
        controls={instrData.controls}
        tip={instrData.tip}
        locale={locale}
      />
    </GameWrapper>
  );
}
