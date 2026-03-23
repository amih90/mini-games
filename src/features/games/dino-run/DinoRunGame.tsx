'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'menu' | 'playing' | 'gameover';

interface DinoRunGameProps {
  locale?: string;
}

interface Obstacle {
  x: number;
  width: number;
  height: number;
  type: 'cactus-small' | 'cactus-large' | 'cactus-cluster' | 'bird';
  y: number;
  passed: boolean;
}

interface Cloud {
  x: number;
  y: number;
  r1: number;
  r2: number;
  r3: number;
}

interface DifficultySettings {
  baseSpeed: number;
  maxSpeed: number;
  speedIncrement: number;
  speedInterval: number;
  minObstacleGap: number;
  maxObstacleGap: number;
  birdChanceThreshold: number;
  birdScoreMin: number;
  gravity: number;
  jumpForce: number;
  clusterChance: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 300;
const GROUND_Y = CANVAS_HEIGHT - 50;
const DINO_WIDTH = 44;
const DINO_HEIGHT = 50;

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    baseSpeed: 4,
    maxSpeed: 9,
    speedIncrement: 0.3,
    speedInterval: 600,
    minObstacleGap: 80,
    maxObstacleGap: 160,
    birdChanceThreshold: 0.9,
    birdScoreMin: 400,
    gravity: 0.7,
    jumpForce: -14,
    clusterChance: 0,
  },
  medium: {
    baseSpeed: 6,
    maxSpeed: 13,
    speedIncrement: 0.5,
    speedInterval: 500,
    minObstacleGap: 55,
    maxObstacleGap: 120,
    birdChanceThreshold: 0.75,
    birdScoreMin: 200,
    gravity: 0.8,
    jumpForce: -15,
    clusterChance: 0.15,
  },
  hard: {
    baseSpeed: 8,
    maxSpeed: 16,
    speedIncrement: 0.6,
    speedInterval: 400,
    minObstacleGap: 40,
    maxObstacleGap: 90,
    birdChanceThreshold: 0.6,
    birdScoreMin: 100,
    gravity: 0.9,
    jumpForce: -16,
    clusterChance: 0.3,
  },
};

const MILESTONE_INTERVAL = 500;

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

const translations: Record<string, Record<string, string>> = {
  en: {
    title: 'Dino Run',
    score: 'Score',
    highScore: 'Best',
    gameOver: 'Game Over!',
    playAgain: 'Play Again',
    newHighScore: '🏆 New High Score!',
    tapToStart: 'Press Space or Click to Jump',
    duck: 'Duck',
    selectDifficulty: 'Select Difficulty',
    easy: '🟢 Easy',
    medium: '🟡 Medium',
    hard: '🔴 Hard',
    easyDesc: 'Slower pace, great for beginners',
    mediumDesc: 'Balanced challenge',
    hardDesc: 'Fast & intense!',
    jumpBtn: 'Jump',
    duckBtn: 'Duck',
    milestone: 'Nice! +500!',
    level: 'Level',
    speed: 'Speed',
  },
  he: {
    title: 'דינו רץ',
    score: 'ניקוד',
    highScore: 'שיא',
    gameOver: '!המשחק נגמר',
    playAgain: 'שחק שוב',
    newHighScore: '🏆 !שיא חדש',
    tapToStart: 'לחץ רווח או לחץ כדי לקפוץ',
    duck: 'התכופף',
    selectDifficulty: 'בחר רמת קושי',
    easy: '🟢 קל',
    medium: '🟡 בינוני',
    hard: '🔴 קשה',
    easyDesc: 'קצב איטי, מצוין למתחילים',
    mediumDesc: 'אתגר מאוזן',
    hardDesc: '!מהיר ואינטנסיבי',
    jumpBtn: 'קפוץ',
    duckBtn: 'התכופף',
    milestone: '!יפה! 500+',
    level: 'שלב',
    speed: 'מהירות',
  },
  zh: {
    title: '恐龙快跑',
    score: '得分',
    highScore: '最高分',
    gameOver: '游戏结束！',
    playAgain: '再玩一次',
    newHighScore: '🏆 新纪录！',
    tapToStart: '按空格键或点击跳跃',
    duck: '蹲下',
    selectDifficulty: '选择难度',
    easy: '🟢 简单',
    medium: '🟡 中等',
    hard: '🔴 困难',
    easyDesc: '节奏较慢，适合初学者',
    mediumDesc: '平衡的挑战',
    hardDesc: '快速且激烈！',
    jumpBtn: '跳',
    duckBtn: '蹲',
    milestone: '不错！+500！',
    level: '关卡',
    speed: '速度',
  },
  es: {
    title: 'Dino Run',
    score: 'Puntuación',
    highScore: 'Récord',
    gameOver: '¡Fin del juego!',
    playAgain: 'Jugar de nuevo',
    newHighScore: '🏆 ¡Nuevo récord!',
    tapToStart: 'Presiona Espacio o Haz clic para saltar',
    duck: 'Agacharse',
    selectDifficulty: 'Selecciona dificultad',
    easy: '🟢 Fácil',
    medium: '🟡 Medio',
    hard: '🔴 Difícil',
    easyDesc: 'Más lento, ideal para principiantes',
    mediumDesc: 'Desafío equilibrado',
    hardDesc: '¡Rápido e intenso!',
    jumpBtn: 'Saltar',
    duckBtn: 'Agachar',
    milestone: '¡Bien! +500!',
    level: 'Nivel',
    speed: 'Velocidad',
  },
};

// ---------------------------------------------------------------------------
// Instructions data (Feynman style)
// ---------------------------------------------------------------------------

const instructionsData: Record<
  string,
  {
    instructions: { icon: string; title: string; description: string }[];
    controls: { icon: string; description: string }[];
    tip: string;
  }
> = {
  en: {
    instructions: [
      {
        icon: '🦖',
        title: 'Run!',
        description:
          'You are a little dinosaur running through the desert. The ground scrolls automatically — you just need to survive!',
      },
      {
        icon: '🌵',
        title: 'Avoid Obstacles',
        description:
          'Cacti and flying birds will try to stop you. Jump over cacti, and duck under birds. If you hit one, the game is over!',
      },
      {
        icon: '⚡',
        title: 'It Gets Faster',
        description:
          'The longer you survive, the faster things move. Each difficulty level starts at a different speed and gets even faster!',
      },
      {
        icon: '⭐',
        title: 'Scoring',
        description:
          'You earn 1 point every frame you survive. Try to beat your high score! Every 500 points is a milestone.',
      },
    ],
    controls: [
      { icon: '⬆️', description: 'Space / Arrow Up / W — Jump' },
      { icon: '⬇️', description: 'Arrow Down / S — Duck' },
      { icon: '🖱️', description: 'Click or Tap — Jump' },
      { icon: '📱', description: 'Use on-screen buttons on mobile' },
    ],
    tip: 'Time your jumps carefully — jumping too early or too late will get you caught!',
  },
  he: {
    instructions: [
      {
        icon: '🦖',
        title: '!רוץ',
        description:
          'אתה דינוזאור קטן שרץ במדבר. הקרקע זזה אוטומטית — אתה רק צריך לשרוד!',
      },
      {
        icon: '🌵',
        title: 'הימנע ממכשולים',
        description:
          'קקטוסים וציפורים מעופפות ינסו לעצור אותך. קפוץ מעל קקטוסים, והתכופף מתחת לציפורים. אם תפגע באחד, המשחק נגמר!',
      },
      {
        icon: '⚡',
        title: 'זה הולך מהר יותר',
        description:
          'ככל ששורד יותר זמן, הכל זז מהר יותר. כל רמת קושי מתחילה במהירות שונה!',
      },
      {
        icon: '⭐',
        title: 'ניקוד',
        description:
          'מרוויחים נקודה אחת על כל פריים ששורדים. נסה לשבור את השיא שלך! כל 500 נקודות זה אבן דרך.',
      },
    ],
    controls: [
      { icon: '⬆️', description: 'רווח / חץ למעלה / W — קפיצה' },
      { icon: '⬇️', description: 'חץ למטה / S — התכופפות' },
      { icon: '🖱️', description: 'לחיצה או נגיעה — קפיצה' },
      { icon: '📱', description: 'השתמש בכפתורים על המסך בנייד' },
    ],
    tip: 'תזמן את הקפיצות בזהירות — קפיצה מוקדמת או מאוחרת מדי תתפוס אותך!',
  },
  zh: {
    instructions: [
      {
        icon: '🦖',
        title: '快跑！',
        description:
          '你是一只在沙漠中奔跑的小恐龙。地面会自动滚动——你只需要活下来！',
      },
      {
        icon: '🌵',
        title: '避开障碍物',
        description:
          '仙人掌和飞鸟会挡住你的路。跳过仙人掌，蹲下躲过飞鸟。撞上任何一个就游戏结束！',
      },
      {
        icon: '⚡',
        title: '越来越快',
        description:
          '你存活的时间越长，速度就越快。每个难度级别的起始速度不同，还会越来越快！',
      },
      {
        icon: '⭐',
        title: '得分',
        description:
          '每存活一帧就得1分。试试打破你的最高分！每500分是一个里程碑。',
      },
    ],
    controls: [
      { icon: '⬆️', description: '空格键 / 上箭头 / W — 跳跃' },
      { icon: '⬇️', description: '下箭头 / S — 蹲下' },
      { icon: '🖱️', description: '点击或触摸 — 跳跃' },
      { icon: '📱', description: '在手机上使用屏幕按钮' },
    ],
    tip: '仔细把握跳跃时机——跳得太早或太晚都会被抓住！',
  },
  es: {
    instructions: [
      {
        icon: '🦖',
        title: '¡Corre!',
        description:
          'Eres un pequeño dinosaurio corriendo por el desierto. El suelo se desplaza automáticamente — ¡solo necesitas sobrevivir!',
      },
      {
        icon: '🌵',
        title: 'Evita Obstáculos',
        description:
          'Cactus y pájaros intentarán detenerte. Salta sobre los cactus y agáchate bajo los pájaros. ¡Si chocas, se acaba el juego!',
      },
      {
        icon: '⚡',
        title: 'Cada Vez Más Rápido',
        description:
          'Cuanto más sobrevivas, más rápido se mueve todo. ¡Cada nivel de dificultad empieza a diferente velocidad!',
      },
      {
        icon: '⭐',
        title: 'Puntuación',
        description:
          'Ganas 1 punto por cada cuadro que sobrevives. ¡Intenta superar tu récord! Cada 500 puntos es un hito.',
      },
    ],
    controls: [
      { icon: '⬆️', description: 'Espacio / Flecha Arriba / W — Saltar' },
      { icon: '⬇️', description: 'Flecha Abajo / S — Agacharse' },
      { icon: '🖱️', description: 'Clic o Toque — Saltar' },
      { icon: '📱', description: 'Usa los botones en pantalla en móvil' },
    ],
    tip: '¡Calcula bien tus saltos — saltar muy pronto o muy tarde te atrapará!',
  },
};

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

function drawSky(ctx: CanvasRenderingContext2D) {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  skyGradient.addColorStop(0, '#87CEEB');
  skyGradient.addColorStop(1, '#E0F7FA');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawGround(ctx: CanvasRenderingContext2D, groundOffset: number) {
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 5);
  ctx.strokeStyle = '#A0522D';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const lx = ((i * 80 - groundOffset * 0.5) % (CANVAS_WIDTH + 80)) - 40;
    ctx.beginPath();
    ctx.moveTo(lx, GROUND_Y + 15);
    ctx.lineTo(lx + 20, GROUND_Y + 15);
    ctx.stroke();
  }
}

function drawClouds(ctx: CanvasRenderingContext2D, clouds: Cloud[], frameCount: number) {
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (const cloud of clouds) {
    const cx = ((cloud.x - frameCount * 0.3) % (CANVAS_WIDTH + 200)) - 100;
    ctx.beginPath();
    ctx.arc(cx, cloud.y, cloud.r1, 0, Math.PI * 2);
    ctx.arc(cx + 25, cloud.y - 5, cloud.r2, 0, Math.PI * 2);
    ctx.arc(cx + 50, cloud.y, cloud.r3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDino(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isDucking: boolean,
  isJumping: boolean,
  frame: number
) {
  ctx.save();
  ctx.translate(x, y);

  if (isDucking) {
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(0, DINO_HEIGHT / 2, DINO_WIDTH + 10, DINO_HEIGHT / 2 - 5, 10);
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(DINO_WIDTH + 5, DINO_HEIGHT / 2 + 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(DINO_WIDTH + 8, DINO_HEIGHT / 2 + 7, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(DINO_WIDTH + 9, DINO_HEIGHT / 2 + 7, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(5, 15, 30, 35, 8);
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.roundRect(20, 0, 24, 20, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(34, 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(35, 8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(38, 14);
    ctx.lineTo(44, 14);
    ctx.stroke();
    ctx.fillStyle = '#16a34a';
    if (isJumping) {
      ctx.fillRect(10, 45, 8, 10);
      ctx.fillRect(25, 45, 8, 10);
    } else {
      const legOffset = frame === 0 ? 0 : 5;
      ctx.fillRect(10, 45 + legOffset, 8, 10 - legOffset);
      ctx.fillRect(25, 45 + (5 - legOffset), 8, 10 - (5 - legOffset));
    }
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(5, 25);
    ctx.lineTo(-10, 20);
    ctx.lineTo(-5, 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(28, 28, 5, 8);
  }

  ctx.restore();
}

function drawCactus(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const bx = obs.x;
  const by = GROUND_Y - obs.height;
  ctx.fillStyle = '#228B22';
  ctx.fillRect(bx, by, obs.width, obs.height);
  ctx.fillRect(bx - 8, by + 15, 10, 8);
  ctx.fillRect(bx + obs.width - 2, by + 10, 10, 8);
  ctx.fillStyle = '#006400';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(bx + obs.width / 2, by - 5 + i * 15);
    ctx.lineTo(bx + obs.width / 2 - 3, by + i * 15);
    ctx.lineTo(bx + obs.width / 2 + 3, by + i * 15);
    ctx.fill();
  }
}

function drawBird(ctx: CanvasRenderingContext2D, obs: Obstacle, frameCount: number) {
  ctx.save();
  ctx.translate(obs.x, obs.y);
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.ellipse(20, 15, 20, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(40, 10, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(48, 10);
  ctx.lineTo(55, 12);
  ctx.lineTo(48, 14);
  ctx.fill();
  ctx.fillStyle = '#818cf8';
  const wingAngle = Math.sin(frameCount * 0.3) * 0.5;
  ctx.save();
  ctx.translate(20, 15);
  ctx.rotate(wingAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-15, -20);
  ctx.lineTo(15, -20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(42, 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(43, 8, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number,
  highScore: number,
  tScore: string,
  tHighScore: string,
  isRtl: boolean
) {
  ctx.save();
  ctx.font = 'bold 14px monospace';
  ctx.textBaseline = 'top';

  if (isRtl) {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(`${tHighScore}: ${String(highScore).padStart(5, '0')}`, 10, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillText(`${tScore}: ${String(score).padStart(5, '0')}`, 10, 28);
  } else {
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(`${tHighScore}: ${String(highScore).padStart(5, '0')}`, CANVAS_WIDTH - 10, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillText(`${tScore}: ${String(score).padStart(5, '0')}`, CANVAS_WIDTH - 10, 28);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DinoRunGame({ locale = 'en' }: DinoRunGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);

  const t = translations[locale] || translations.en;
  const isRtl = locale === 'he';
  const instrData = instructionsData[locale] || instructionsData.en;

  const {
    playClick,
    playSuccess,
    playLevelUp,
    playGameOver,
    playHit,
    playJump,
  } = useRetroSounds();

  // ---- React state (triggers re-render) ----
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dino-run-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [showInstructions, setShowInstructions] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('dino-run-instructions-seen');
    }
    return true;
  });
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showMilestone, setShowMilestone] = useState(false);

  // ---- Mutable refs (no re-render) ----
  const dinoRef = useRef({
    x: 80,
    y: GROUND_Y - DINO_HEIGHT,
    vy: 0,
    isJumping: false,
    isDucking: false,
    frame: 0,
  });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const gameSpeedRef = useRef(6);
  const frameCountRef = useRef(0);
  const nextObstacleRef = useRef(100);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(highScore);
  const lastMilestoneRef = useRef(0);
  const levelRef = useRef(1);
  const groundOffsetRef = useRef(0);
  const cloudsRef = useRef<Cloud[]>([]);
  const settingsRef = useRef<DifficultySettings>(DIFFICULTY_SETTINGS.medium);
  const gameStateRef = useRef<GameState>('menu');
  const isDuckingKeyHeld = useRef(false);

  // Keep refs synced
  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Generate randomised clouds
  const generateClouds = useCallback((): Cloud[] => {
    const c: Cloud[] = [];
    for (let i = 0; i < 6; i++) {
      c.push({
        x: Math.random() * (CANVAS_WIDTH + 200),
        y: 30 + Math.random() * 60,
        r1: 20 + Math.random() * 15,
        r2: 15 + Math.random() * 12,
        r3: 20 + Math.random() * 15,
      });
    }
    return c;
  }, []);

  // Spawn obstacle based on difficulty
  const spawnObstacle = useCallback(
    (settings: DifficultySettings, currentScore: number) => {
      const rand = Math.random();
      let type: Obstacle['type'];

      if (rand > settings.birdChanceThreshold && currentScore > settings.birdScoreMin) {
        type = 'bird';
      } else if (rand > 1 - settings.clusterChance && currentScore > 300) {
        type = 'cactus-cluster';
      } else if (Math.random() > 0.5) {
        type = 'cactus-large';
      } else {
        type = 'cactus-small';
      }

      let width: number;
      let height: number;
      let y: number;

      switch (type) {
        case 'bird':
          width = 40;
          height = 30;
          y = GROUND_Y - DINO_HEIGHT - 10 - Math.random() * 40;
          break;
        case 'cactus-cluster':
          width = 50 + Math.random() * 15;
          height = 35 + Math.random() * 15;
          y = GROUND_Y;
          break;
        case 'cactus-large':
          width = 25 + Math.random() * 10;
          height = 50 + Math.random() * 15;
          y = GROUND_Y;
          break;
        default:
          width = 18 + Math.random() * 10;
          height = 30 + Math.random() * 15;
          y = GROUND_Y;
          break;
      }

      obstaclesRef.current.push({ x: CANVAS_WIDTH + 50, width, height, type, y, passed: false });
    },
    []
  );

  // Start / restart game
  const startGame = useCallback(
    (diff: Difficulty) => {
      const settings = DIFFICULTY_SETTINGS[diff];
      settingsRef.current = settings;
      setDifficulty(diff);
      setScore(0);
      scoreRef.current = 0;
      setCurrentLevel(1);
      levelRef.current = 1;
      lastMilestoneRef.current = 0;
      setShowMilestone(false);

      dinoRef.current = {
        x: 80,
        y: GROUND_Y - DINO_HEIGHT,
        vy: 0,
        isJumping: false,
        isDucking: false,
        frame: 0,
      };
      obstaclesRef.current = [];
      gameSpeedRef.current = settings.baseSpeed;
      frameCountRef.current = 0;
      nextObstacleRef.current = 80;
      groundOffsetRef.current = 0;
      cloudsRef.current = generateClouds();
      isDuckingKeyHeld.current = false;

      playClick();
      setGameState('playing');
    },
    [generateClouds, playClick]
  );

  usePlayAgainKey(gameState === 'gameover', useCallback(() => startGame(difficulty), [startGame, difficulty]));

  // Jump
  const jump = useCallback(() => {
    const dino = dinoRef.current;
    if (gameStateRef.current === 'playing' && !dino.isJumping) {
      dino.vy = settingsRef.current.jumpForce;
      dino.isJumping = true;
      dino.isDucking = false;
      isDuckingKeyHeld.current = false;
      playJump();
    }
  }, [playJump]);

  // Duck
  const setDucking = useCallback((ducking: boolean) => {
    isDuckingKeyHeld.current = ducking;
    if (!dinoRef.current.isJumping) {
      dinoRef.current.isDucking = ducking;
    }
  }, []);

  // Close instructions
  const closeInstructions = useCallback(() => {
    setShowInstructions(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dino-run-instructions-seen', 'true');
    }
  }, []);

  // -----------------------------------------------------------------------
  // Input handlers
  // -----------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (gameStateRef.current === 'playing') jump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        if (gameStateRef.current === 'playing') setDucking(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        setDucking(false);
      }
    };

    const handleCanvasClick = (e: Event) => {
      e.preventDefault();
      if (gameStateRef.current === 'playing') jump();
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (gameStateRef.current === 'playing') jump();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (canvas) {
      canvas.addEventListener('click', handleCanvasClick);
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        canvas.removeEventListener('click', handleCanvasClick);
        canvas.removeEventListener('touchstart', handleTouchStart);
      }
    };
  }, [jump, setDucking]);

  // -----------------------------------------------------------------------
  // Game loop
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const settings = settingsRef.current;

    const loop = () => {
      frameCountRef.current++;
      const fc = frameCountRef.current;
      const dino = dinoRef.current;

      // Physics
      dino.vy += settings.gravity;
      dino.y += dino.vy;
      const dinoH = dino.isDucking ? DINO_HEIGHT / 2 : DINO_HEIGHT;
      if (dino.y >= GROUND_Y - dinoH) {
        dino.y = GROUND_Y - dinoH;
        dino.vy = 0;
        if (dino.isJumping) {
          dino.isJumping = false;
          if (isDuckingKeyHeld.current) dino.isDucking = true;
        }
      }

      // Animation
      if (fc % 6 === 0) dino.frame = (dino.frame + 1) % 2;

      // Ground scroll
      groundOffsetRef.current += gameSpeedRef.current;

      // Spawn
      nextObstacleRef.current--;
      if (nextObstacleRef.current <= 0) {
        spawnObstacle(settings, scoreRef.current);
        nextObstacleRef.current =
          settings.minObstacleGap + Math.random() * (settings.maxObstacleGap - settings.minObstacleGap);
      }

      // Move obstacles
      obstaclesRef.current = obstaclesRef.current.filter((obs) => {
        obs.x -= gameSpeedRef.current;
        return obs.x > -100;
      });

      // Collision
      const dinoBox = {
        x: dino.x + 8,
        y: dino.y + (dino.isDucking ? DINO_HEIGHT / 2 : 5),
        width: DINO_WIDTH - 16,
        height: dinoH - 10,
      };

      let collided = false;
      for (const obs of obstaclesRef.current) {
        const obsBox =
          obs.type === 'bird'
            ? { x: obs.x + 5, y: obs.y + 3, width: obs.width - 10, height: obs.height - 6 }
            : { x: obs.x + 3, y: GROUND_Y - obs.height + 3, width: obs.width - 6, height: obs.height - 6 };

        if (
          dinoBox.x < obsBox.x + obsBox.width &&
          dinoBox.x + dinoBox.width > obsBox.x &&
          dinoBox.y < obsBox.y + obsBox.height &&
          dinoBox.y + dinoBox.height > obsBox.y
        ) {
          collided = true;
          break;
        }
      }

      if (collided) {
        playHit();
        setTimeout(() => playGameOver(), 200);
        const finalScore = scoreRef.current;
        if (finalScore > highScoreRef.current) {
          setHighScore(finalScore);
          localStorage.setItem('dino-run-highscore', String(finalScore));
        }
        setGameState('gameover');
        return;
      }

      // Score
      scoreRef.current++;
      setScore(scoreRef.current);

      // Milestone
      if (
        scoreRef.current > 0 &&
        scoreRef.current % MILESTONE_INTERVAL === 0 &&
        scoreRef.current !== lastMilestoneRef.current
      ) {
        lastMilestoneRef.current = scoreRef.current;
        playSuccess();
        setShowMilestone(true);
        setTimeout(() => setShowMilestone(false), 1500);
      }

      // Speed increase & level
      if (fc % settings.speedInterval === 0) {
        const newSpeed = Math.min(gameSpeedRef.current + settings.speedIncrement, settings.maxSpeed);
        if (newSpeed !== gameSpeedRef.current) {
          gameSpeedRef.current = newSpeed;
          const newLevel =
            Math.floor((gameSpeedRef.current - settings.baseSpeed) / (settings.speedIncrement * 2)) + 1;
          if (newLevel > levelRef.current) {
            levelRef.current = newLevel;
            setCurrentLevel(newLevel);
            playLevelUp();
          }
        }
      }

      // Draw
      drawSky(ctx);
      drawClouds(ctx, cloudsRef.current, fc);
      drawGround(ctx, groundOffsetRef.current);

      for (const obs of obstaclesRef.current) {
        if (obs.type === 'bird') {
          drawBird(ctx, obs, fc);
        } else {
          drawCactus(ctx, obs);
        }
      }

      drawDino(ctx, dino.x, dino.y, dino.isDucking, dino.isJumping, dino.frame);
      drawHUD(ctx, scoreRef.current, highScoreRef.current, t.score, t.highScore, isRtl);

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameState, spawnObstacle, t.score, t.highScore, isRtl, playHit, playGameOver, playSuccess, playLevelUp]);

  // -----------------------------------------------------------------------
  // Static screen draw (menu / gameover)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (gameState !== 'menu' && gameState !== 'gameover') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (cloudsRef.current.length === 0) {
      cloudsRef.current = [
        { x: 100, y: 40, r1: 25, r2: 20, r3: 25 },
        { x: 350, y: 55, r1: 30, r2: 18, r3: 28 },
        { x: 600, y: 35, r1: 22, r2: 25, r3: 22 },
      ];
    }

    drawSky(ctx);
    drawClouds(ctx, cloudsRef.current, 0);
    drawGround(ctx, 0);
    drawDino(ctx, 80, GROUND_Y - DINO_HEIGHT, false, false, 0);
  }, [gameState]);

  // -----------------------------------------------------------------------
  // Difficulty selector handler
  // -----------------------------------------------------------------------
  const handleSelectDifficulty = useCallback(
    (diff: Difficulty) => {
      playClick();
      startGame(diff);
    },
    [startGame, playClick]
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <GameWrapper title={t.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="flex flex-col items-center gap-4" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Score + Level bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
          <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center">
            <div className="text-sm text-slate-500 font-medium">{t.score}</div>
            <div className="text-2xl font-bold text-[#22c55e] font-mono">
              {String(score).padStart(5, '0')}
            </div>
          </div>
          <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center">
            <div className="text-sm text-slate-500 font-medium">{t.highScore}</div>
            <div className="text-2xl font-bold text-[#f97316] font-mono">
              {String(highScore).padStart(5, '0')}
            </div>
          </div>
          {gameState === 'playing' && (
            <LevelDisplay level={currentLevel} isRtl={isRtl} locale={locale} />
          )}
        </div>

        {/* Canvas */}
        <div className="relative w-full max-w-[800px]">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-xl shadow-2xl border-4 border-[#22c55e]/30 cursor-pointer w-full"
            style={{ touchAction: 'none' }}
          />

          {/* Milestone toast */}
          <AnimatePresence>
            {showMilestone && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-yellow-400 text-slate-900 font-bold rounded-full shadow-lg text-lg"
              >
                {t.milestone}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Menu overlay — difficulty selector */}
          <AnimatePresence>
            {gameState === 'menu' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-xl"
              >
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="text-5xl mb-3"
                >
                  🦖
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{t.title}</h2>
                <p className="text-white/80 text-sm mb-4">{t.selectDifficulty}</p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectDifficulty('easy')}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full shadow-lg min-h-[48px] min-w-[48px] flex flex-col items-center"
                  >
                    <span className="text-base">{t.easy}</span>
                    <span className="text-xs font-normal opacity-80">{t.easyDesc}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectDifficulty('medium')}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-full shadow-lg min-h-[48px] min-w-[48px] flex flex-col items-center"
                  >
                    <span className="text-base">{t.medium}</span>
                    <span className="text-xs font-normal opacity-80">{t.mediumDesc}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectDifficulty('hard')}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full shadow-lg min-h-[48px] min-w-[48px] flex flex-col items-center"
                  >
                    <span className="text-base">{t.hard}</span>
                    <span className="text-xs font-normal opacity-80">{t.hardDesc}</span>
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
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl"
              >
                <div className="bg-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl max-w-xs w-full mx-4">
                  <div className="text-5xl mb-3">💥</div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.gameOver}</h2>
                  <div className="text-4xl font-bold text-[#22c55e] mb-1 font-mono">{score}</div>
                  {score >= highScore && score > 0 && (
                    <div className="text-base text-[#f97316] font-bold mb-2">{t.newHighScore}</div>
                  )}
                  <div className="flex flex-col gap-2 mt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startGame(difficulty)}
                      className="px-8 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                    >
                      {t.playAgain}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        playClick();
                        setGameState('menu');
                      }}
                      className="px-8 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-full shadow min-h-[48px]"
                    >
                      {t.selectDifficulty}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* On-screen mobile control buttons */}
        {gameState === 'playing' && (
          <div className="flex gap-6 sm:hidden">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onTouchStart={(e) => {
                e.preventDefault();
                jump();
              }}
              className="px-8 py-4 bg-[#22c55e] hover:bg-[#16a34a] text-white text-lg font-bold rounded-2xl shadow-lg min-h-[56px] min-w-[56px] active:bg-[#16a34a] select-none"
            >
              ⬆️ {t.jumpBtn}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onTouchStart={(e) => {
                e.preventDefault();
                setDucking(true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setDucking(false);
              }}
              className="px-8 py-4 bg-[#f97316] hover:bg-[#ea580c] text-white text-lg font-bold rounded-2xl shadow-lg min-h-[56px] min-w-[56px] active:bg-[#ea580c] select-none"
            >
              ⬇️ {t.duckBtn}
            </motion.button>
          </div>
        )}

        {/* Control hints */}
        <div className="flex flex-wrap justify-center gap-2 text-slate-600 text-sm">
          <span className="px-3 py-1 bg-white/80 rounded-full">🖱️ Click = {t.jumpBtn}</span>
          <span className="px-3 py-1 bg-white/80 rounded-full">Space/↑/W = {t.jumpBtn}</span>
          <span className="px-3 py-1 bg-white/80 rounded-full">↓/S = {t.duckBtn}</span>
        </div>
      </div>

      {/* Instructions Modal */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={closeInstructions}
        title={t.title}
        instructions={instrData.instructions}
        controls={instrData.controls}
        tip={instrData.tip}
        locale={locale}
      />
    </GameWrapper>
  );
}
