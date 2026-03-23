'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CANVAS_SIZE = 480;
const DEFAULT_GRID_SIZE = 20;
const DEFAULT_CELL_SIZE = 24;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Difficulty = 'learn' | 'easy' | 'medium' | 'hard';

interface Position {
  x: number;
  y: number;
}

interface DifficultySettings {
  initialSpeed: number;
  minSpeed: number;
  obstacleMul: number;
  gridSize: number;
  cellSize: number;
  speedIncrease: number;
  winScore: number;
  maxLevel: number;
}

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  learn:  { initialSpeed: 400, minSpeed: 350, obstacleMul: 0, gridSize: 10, cellSize: 48, speedIncrease: 1, winScore: 50,  maxLevel: 1 },
  easy:   { initialSpeed: 200, minSpeed: 100, obstacleMul: 0.5, gridSize: 20, cellSize: 24, speedIncrease: 5, winScore: 250, maxLevel: 5 },
  medium: { initialSpeed: 150, minSpeed: 60,  obstacleMul: 1.0, gridSize: 20, cellSize: 24, speedIncrease: 5, winScore: 250, maxLevel: 5 },
  hard:   { initialSpeed: 100, minSpeed: 40,  obstacleMul: 1.5, gridSize: 20, cellSize: 24, speedIncrease: 5, winScore: 250, maxLevel: 5 },
};

// ---------------------------------------------------------------------------
// 4-locale translations
// ---------------------------------------------------------------------------
const translations: Record<string, Record<string, string>> = {
  en: {
    title: 'Snake',
    instructions: 'Arrows/WASD to move, Mouse to steer',
    score: 'Score',
    highScore: 'Best',
    length: 'Length',
    level: 'Level',
    gameOver: 'Game Over!',
    playAgain: 'Play Again',
    tapToStart: 'Click to Start',
    paused: 'Paused',
    levelUp: 'Level Up!',
    resume: 'Resume',
    difficulty: 'Choose Difficulty',
    learn: 'Learn',
    learnDesc: 'Big & slow, perfect for little kids!',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    easyDesc: 'Slower speed, fewer obstacles',
    mediumDesc: 'Balanced challenge',
    hardDesc: 'Fast speed, more obstacles',
    controlsKeyboard: 'WASD / Arrows',
    controlsMouse: 'Mouse = Steer',
    controlsSwipe: 'Swipe = Move',
    controlsPause: 'P/Esc = Pause',
    howToPlay: 'How to Play Snake',
  },
  he: {
    title: 'נחש',
    instructions: 'חצים/WASD להזיז, עכבר לכוון',
    score: 'ניקוד',
    highScore: 'שיא',
    length: 'אורך',
    level: 'שלב',
    gameOver: 'המשחק נגמר!',
    playAgain: 'שחק שוב',
    tapToStart: 'לחץ להתחלה',
    paused: 'מושהה',
    levelUp: 'שלב חדש!',
    resume: 'המשך',
    difficulty: 'בחרו רמת קושי',
    learn: 'למידה',
    learnDesc: 'גדול ואיטי, מושלם לילדים קטנים!',
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
    easyDesc: 'מהירות איטית, פחות מכשולים',
    mediumDesc: 'אתגר מאוזן',
    hardDesc: 'מהירות גבוהה, יותר מכשולים',
    controlsKeyboard: 'WASD / חצים',
    controlsMouse: 'עכבר = כיוון',
    controlsSwipe: 'החלקה = תזוזה',
    controlsPause: 'P/Esc = השהיה',
    howToPlay: 'איך לשחק בנחש',
  },
  zh: {
    title: '贪吃蛇',
    instructions: '方向键/WASD 移动，鼠标控制方向',
    score: '得分',
    highScore: '最高分',
    length: '长度',
    level: '关卡',
    gameOver: '游戏结束！',
    playAgain: '再玩一次',
    tapToStart: '点击开始',
    paused: '已暂停',
    levelUp: '升级！',
    resume: '继续',
    difficulty: '选择难度',
    learn: '学习',
    learnDesc: '大而慢，非常适合小朋友！',
    easy: '简单',
    medium: '中等',
    hard: '困难',
    easyDesc: '速度较慢，障碍较少',
    mediumDesc: '平衡挑战',
    hardDesc: '速度快，障碍多',
    controlsKeyboard: 'WASD / 方向键',
    controlsMouse: '鼠标 = 转向',
    controlsSwipe: '滑动 = 移动',
    controlsPause: 'P/Esc = 暂停',
    howToPlay: '如何玩贪吃蛇',
  },
  es: {
    title: 'Serpiente',
    instructions: 'Flechas/WASD para mover, Ratón para dirigir',
    score: 'Puntuación',
    highScore: 'Récord',
    length: 'Longitud',
    level: 'Nivel',
    gameOver: '¡Fin del juego!',
    playAgain: 'Jugar de nuevo',
    tapToStart: 'Clic para empezar',
    paused: 'Pausado',
    levelUp: '¡Nuevo nivel!',
    resume: 'Continuar',
    difficulty: 'Elige la dificultad',
    learn: 'Aprender',
    learnDesc: 'Grande y lento, ¡perfecto para los más pequeños!',
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
    easyDesc: 'Velocidad lenta, menos obstáculos',
    mediumDesc: 'Desafío equilibrado',
    hardDesc: 'Velocidad rápida, más obstáculos',
    controlsKeyboard: 'WASD / Flechas',
    controlsMouse: 'Ratón = Dirigir',
    controlsSwipe: 'Deslizar = Mover',
    controlsPause: 'P/Esc = Pausa',
    howToPlay: 'Cómo jugar a Serpiente',
  },
};

// ---------------------------------------------------------------------------
// 4-locale instructions data
// ---------------------------------------------------------------------------
const instructionsData: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      {
        icon: '🍎',
        title: 'Eat Fruits',
        description: 'Use arrow keys or WASD to move the snake. Eat red fruits to grow and score points!',
      },
      {
        icon: '🚫',
        title: 'Avoid Obstacles',
        description: "As you level up, gray obstacles appear. Don't hit them or yourself!",
      },
      {
        icon: '⭐',
        title: 'Level Up',
        description: 'Collect 50 points each level to advance. Each level adds speed and obstacles!',
      },
      {
        icon: '🏆',
        title: 'Win',
        description: 'Reach level 5 and 250 points to win the game!',
      },
    ],
    controls: [
      { icon: '⬆️', description: 'Arrow Up / W' },
      { icon: '⬇️', description: 'Arrow Down / S' },
      { icon: '⬅️', description: 'Arrow Left / A' },
      { icon: '➡️', description: 'Arrow Right / D' },
      { icon: '🖱️', description: 'Click to steer' },
      { icon: '␣', description: 'Space to pause' },
    ],
    tip: "Pro tip: Plan your path ahead! Don't just focus on the next fruit - think about where your tail will be.",
  },
  he: {
    instructions: [
      {
        icon: '🍎',
        title: 'אכלו פירות',
        description: 'השתמשו בחצים או WASD כדי להזיז את הנחש. אכלו פירות אדומים כדי לגדול ולקבל נקודות!',
      },
      {
        icon: '🚫',
        title: 'היזהרו ממכשולים',
        description: 'ככל שתעלו רמה, יופיעו מכשולים אפורים. אל תפגעו בהם או בעצמכם!',
      },
      {
        icon: '⭐',
        title: 'עלו רמות',
        description: 'אספו 50 נקודות בכל רמה כדי לעבור לרמה הבאה. כל רמה מוסיפה מהירות ומכשולים!',
      },
      {
        icon: '🏆',
        title: 'נצחו',
        description: 'הגיעו ל-5 רמות ו-250 נקודות כדי לנצח במשחק!',
      },
    ],
    controls: [
      { icon: '⬆️', description: 'חץ למעלה / W' },
      { icon: '⬇️', description: 'חץ למטה / S' },
      { icon: '⬅️', description: 'חץ שמאלה / A' },
      { icon: '➡️', description: 'חץ ימינה / D' },
      { icon: '🖱️', description: 'לחיצה לשינוי כיוון' },
      { icon: '␣', description: 'רווח להשהיה' },
    ],
    tip: 'טיפ למומחים: תכננו את המסלול שלכם מראש! אל תתמקדו רק בפרי הבא - חשבו איפה הזנב שלכם יהיה.',
  },
  zh: {
    instructions: [
      {
        icon: '🍎',
        title: '吃水果',
        description: '使用方向键或 WASD 移动蛇。吃红色水果来成长并获得分数！',
      },
      {
        icon: '🚫',
        title: '避开障碍',
        description: '随着等级提升，灰色障碍物会出现。不要撞到它们或自己！',
      },
      {
        icon: '⭐',
        title: '升级',
        description: '每关收集 50 分即可升级。每一关都会增加速度和障碍！',
      },
      {
        icon: '🏆',
        title: '获胜',
        description: '达到第 5 关并获得 250 分即可赢得游戏！',
      },
    ],
    controls: [
      { icon: '⬆️', description: '上箭头 / W' },
      { icon: '⬇️', description: '下箭头 / S' },
      { icon: '⬅️', description: '左箭头 / A' },
      { icon: '➡️', description: '右箭头 / D' },
      { icon: '🖱️', description: '点击控制方向' },
      { icon: '␣', description: '空格暂停' },
    ],
    tip: '小技巧：提前规划路线！不要只盯着下一个水果——想想你的尾巴会在哪里。',
  },
  es: {
    instructions: [
      {
        icon: '🍎',
        title: 'Come frutas',
        description: 'Usa las flechas o WASD para mover la serpiente. ¡Come frutas rojas para crecer y ganar puntos!',
      },
      {
        icon: '🚫',
        title: 'Evita obstáculos',
        description: 'Al subir de nivel, aparecen obstáculos grises. ¡No choques con ellos ni contigo mismo!',
      },
      {
        icon: '⭐',
        title: 'Sube de nivel',
        description: '¡Recoge 50 puntos en cada nivel para avanzar. Cada nivel añade velocidad y obstáculos!',
      },
      {
        icon: '🏆',
        title: 'Gana',
        description: '¡Llega al nivel 5 y 250 puntos para ganar el juego!',
      },
    ],
    controls: [
      { icon: '⬆️', description: 'Flecha arriba / W' },
      { icon: '⬇️', description: 'Flecha abajo / S' },
      { icon: '⬅️', description: 'Flecha izquierda / A' },
      { icon: '➡️', description: 'Flecha derecha / D' },
      { icon: '🖱️', description: 'Clic para dirigir' },
      { icon: '␣', description: 'Espacio para pausar' },
    ],
    tip: 'Consejo: ¡Planifica tu ruta con antelación! No te fijes solo en la siguiente fruta — piensa dónde estará tu cola.',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface SnakeGameProps {
  locale?: string;
}

export default function SnakeGame({ locale = 'en' }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastMoveRef = useRef<number>(0);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('snake-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [showWin, setShowWin] = useState(false);
  const [snakeLength, setSnakeLength] = useState(1);
  const [level, setLevel] = useState(1);
  const [showInstructions, setShowInstructions] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const snakeRef = useRef<Position[]>([{ x: 10, y: 10 }]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Position>({ x: 15, y: 10 });
  const speedRef = useRef(DIFFICULTY_SETTINGS.medium.initialSpeed);
  const obstaclesRef = useRef<Position[]>([]);
  const difficultyRef = useRef<Difficulty>('medium');

  const { playClick, playLevelUp, playGameOver, playHit, playPowerUp, playWin } = useRetroSounds();

  // Resolve locale strings
  const t = translations[locale] || translations.en;
  const isRtl = locale === 'he';
  const instrData = instructionsData[locale] || instructionsData.en;

  // ------------------------------------------------------------------
  // Difficulty helpers
  // ------------------------------------------------------------------
  const getDiffSettings = useCallback((): DifficultySettings => {
    return DIFFICULTY_SETTINGS[difficultyRef.current];
  }, []);

  // ------------------------------------------------------------------
  // Spawn obstacles based on level + difficulty
  // ------------------------------------------------------------------
  const spawnObstacles = useCallback((currentLevel: number) => {
    const settings = getDiffSettings();
    if (currentLevel <= 1) {
      obstaclesRef.current = [];
      return;
    }

    const snake = snakeRef.current;
    const food = foodRef.current;
    const gs = settings.gridSize;
    const numObstacles = Math.min(
      Math.round((currentLevel - 1) * 2 * settings.obstacleMul),
      12,
    );
    const obstacles: Position[] = [];

    for (let i = 0; i < numObstacles; i++) {
      let newObstacle: Position;
      let attempts = 0;

      do {
        newObstacle = {
          x: Math.floor(Math.random() * gs),
          y: Math.floor(Math.random() * gs),
        };
        attempts++;
      } while (
        attempts < 50 &&
        (snake.some(seg => seg.x === newObstacle.x && seg.y === newObstacle.y) ||
          obstacles.some(obs => obs.x === newObstacle.x && obs.y === newObstacle.y) ||
          (newObstacle.x === food.x && newObstacle.y === food.y) ||
          (Math.abs(newObstacle.x - snake[0].x) < 3 && Math.abs(newObstacle.y - snake[0].y) < 3))
      );

      if (attempts < 50) {
        obstacles.push(newObstacle);
      }
    }

    obstaclesRef.current = obstacles;
  }, [getDiffSettings]);

  const spawnFood = useCallback(() => {
    const snake = snakeRef.current;
    const obstacles = obstaclesRef.current;
    const gs = getDiffSettings().gridSize;
    let newFood: Position;

    do {
      newFood = {
        x: Math.floor(Math.random() * gs),
        y: Math.floor(Math.random() * gs),
      };
    } while (
      snake.some(seg => seg.x === newFood.x && seg.y === newFood.y) ||
      obstacles.some(obs => obs.x === newFood.x && obs.y === newFood.y)
    );

    foodRef.current = newFood;
  }, [getDiffSettings]);

  const resetGame = useCallback(() => {
    const settings = getDiffSettings();
    const center = Math.floor(settings.gridSize / 2);
    snakeRef.current = [{ x: center, y: center }];
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    speedRef.current = settings.initialSpeed;
    setScore(0);
    setSnakeLength(1);
    setLevel(1);
    obstaclesRef.current = [];
    spawnFood();
  }, [spawnFood, getDiffSettings]);

  const startGame = useCallback(() => {
    resetGame();
    setGameState('playing');
    playClick();
  }, [resetGame, playClick]);

  const startWithDifficulty = useCallback((diff: Difficulty) => {
    difficultyRef.current = diff;
    setDifficulty(diff);
    resetGame();
    setGameState('playing');
    playClick();
  }, [resetGame, playClick]);

  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    playGameOver();
    const settings = DIFFICULTY_SETTINGS[difficultyRef.current];
    setScore(currentScore => {
      if (currentScore > highScore) {
        setHighScore(currentScore);
        localStorage.setItem('snake-highscore', currentScore.toString());
        if (currentScore >= settings.winScore) {
          setShowWin(true);
          playWin();
        }
      }
      return currentScore;
    });
  }, [highScore, playWin, playGameOver]);

  const moveSnake = useCallback(() => {
    const snake = snakeRef.current;
    const direction = nextDirectionRef.current;
    directionRef.current = direction;
    const settings = getDiffSettings();

    const head = { ...snake[0] };

    switch (direction) {
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'RIGHT':
        head.x += 1;
        break;
    }

    // Wall collision (wrap around)
    if (head.x < 0) head.x = settings.gridSize - 1;
    if (head.x >= settings.gridSize) head.x = 0;
    if (head.y < 0) head.y = settings.gridSize - 1;
    if (head.y >= settings.gridSize) head.y = 0;

    // Self collision
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      playHit();
      handleGameOver();
      return;
    }

    // Obstacle collision
    const obstacles = obstaclesRef.current;
    if (obstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
      playHit();
      handleGameOver();
      return;
    }

    // Add new head
    snake.unshift(head);

    // Check food collision
    const food = foodRef.current;
    if (head.x === food.x && head.y === food.y) {
      const newScore = score + 10;
      setScore(newScore);
      setSnakeLength(snake.length);
      speedRef.current = Math.max(settings.minSpeed, speedRef.current - settings.speedIncrease);
      spawnFood();
      playPowerUp();

      // Level up every 50 points
      const newLevel = Math.floor(newScore / 50) + 1;
      if (newLevel > level && newLevel <= settings.maxLevel) {
        setLevel(newLevel);
        playLevelUp();
        spawnObstacles(newLevel);
      }
    } else {
      snake.pop();
    }
    setSnakeLength(snake.length);
  }, [handleGameOver, spawnFood, playPowerUp, playHit, playLevelUp, score, level, spawnObstacles, getDiffSettings]);

  const setDirection = useCallback((newDir: Direction) => {
    const current = directionRef.current;

    if (
      (newDir === 'UP' && current === 'DOWN') ||
      (newDir === 'DOWN' && current === 'UP') ||
      (newDir === 'LEFT' && current === 'RIGHT') ||
      (newDir === 'RIGHT' && current === 'LEFT')
    ) {
      return;
    }

    nextDirectionRef.current = newDir;
  }, []);

  // ------------------------------------------------------------------
  // Draw game
  // ------------------------------------------------------------------
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const settings = getDiffSettings();
    const gs = settings.gridSize;
    const cs = settings.cellSize;
    const width = gs * cs;
    const height = gs * cs;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1e3a2f');
    gradient.addColorStop(1, '#0d1f17');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= gs; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cs, 0);
      ctx.lineTo(x * cs, height);
      ctx.stroke();
    }
    for (let y = 0; y <= gs; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cs);
      ctx.lineTo(width, y * cs);
      ctx.stroke();
    }

    // Draw food (apple)
    const food = foodRef.current;
    const foodX = food.x * cs + cs / 2;
    const foodY = food.y * cs + cs / 2;
    const foodRadius = cs / 2 - 3;

    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(foodX - 3, foodY - 3, foodRadius / 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(foodX - 1, foodY - foodRadius - 4, 3, 6);

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(foodX + 4, foodY - foodRadius - 2, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw snake
    const snake = snakeRef.current;
    const dir = directionRef.current;

    snake.forEach((segment, index) => {
      const x = segment.x * cs;
      const y = segment.y * cs;
      const padding = 2;

      const hue = 120 + (index * 2) % 40;
      const lightness = 50 - (index / snake.length) * 15;

      ctx.shadowColor = index === 0 ? '#22c55e' : 'transparent';
      ctx.shadowBlur = index === 0 ? 10 : 0;
      ctx.fillStyle = `hsl(${hue}, 70%, ${lightness}%)`;

      if (index === 0) {
        const headSize = cs - padding * 2;
        ctx.beginPath();
        ctx.roundRect(x + padding, y + padding, headSize, headSize, 6);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'white';
        const eyeSize = Math.max(3, cs / 6);
        const eyeOffset = Math.max(4, cs / 5);

        let eye1X = x + cs / 2 - eyeOffset;
        let eye1Y = y + cs / 2 - 2;
        let eye2X = x + cs / 2 + eyeOffset;
        let eye2Y = y + cs / 2 - 2;

        if (dir === 'UP') {
          eye1Y = y + cs * 0.25;
          eye2Y = y + cs * 0.25;
        } else if (dir === 'DOWN') {
          eye1Y = y + cs * 0.75;
          eye2Y = y + cs * 0.75;
        } else if (dir === 'LEFT') {
          eye1X = x + cs * 0.25;
          eye2X = x + cs * 0.25;
          eye1Y = y + cs / 2 - eyeOffset;
          eye2Y = y + cs / 2 + eyeOffset;
        } else {
          eye1X = x + cs * 0.75;
          eye2X = x + cs * 0.75;
          eye1Y = y + cs / 2 - eyeOffset;
          eye2Y = y + cs / 2 + eyeOffset;
        }

        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeSize / 2, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, eyeSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const segSize = cs - padding * 2 - 1;
        ctx.beginPath();
        ctx.roundRect(x + padding + 0.5, y + padding + 0.5, segSize, segSize, 4);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x + padding + 2, y + padding + 2, segSize - 4, 3);
      }
    });

    // Draw obstacles
    const obstacles = obstaclesRef.current;
    obstacles.forEach((obstacle) => {
      const x = obstacle.x * cs;
      const y = obstacle.y * cs;
      const padding = 2;
      const obstacleSize = cs - padding * 2;

      ctx.shadowColor = '#64748b';
      ctx.shadowBlur = 8;

      const obstGradient = ctx.createRadialGradient(
        x + cs / 2, y + cs / 2, 0,
        x + cs / 2, y + cs / 2, obstacleSize / 2,
      );
      obstGradient.addColorStop(0, '#64748b');
      obstGradient.addColorStop(1, '#334155');
      ctx.fillStyle = obstGradient;

      ctx.beginPath();
      ctx.roundRect(x + padding, y + padding, obstacleSize, obstacleSize, 4);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + padding, y + padding);
      ctx.lineTo(x + padding + obstacleSize, y + padding + obstacleSize);
      ctx.moveTo(x + padding + obstacleSize, y + padding);
      ctx.lineTo(x + padding, y + padding + obstacleSize);
      ctx.stroke();
    });

    ctx.shadowBlur = 0;
  }, [getDiffSettings]);

  // ------------------------------------------------------------------
  // Keyboard controls
  // ------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') {
        if ((e.code === 'Space' || e.code === 'Enter') && gameState === 'idle' && difficulty) {
          e.preventDefault();
          startGame();
        }
        if (e.code === 'Space' && gameState === 'paused') {
          e.preventDefault();
          setGameState('playing');
        }
        return;
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          setDirection('UP');
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          setDirection('RIGHT');
          break;
        case 'KeyP':
        case 'Escape':
          e.preventDefault();
          setGameState('paused');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, difficulty, startGame, setDirection]);

  // ------------------------------------------------------------------
  // Mouse controls
  // ------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (gameState !== 'playing') return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      const snake = snakeRef.current;
      if (snake.length === 0) return;

      const head = snake[0];
      const cs = getDiffSettings().cellSize;
      const headCenterX = (head.x + 0.5) * cs;
      const headCenterY = (head.y + 0.5) * cs;

      const dx = mouseX - headCenterX;
      const dy = mouseY - headCenterY;

      const currentDir = directionRef.current;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && currentDir !== 'LEFT') setDirection('RIGHT');
        else if (dx < 0 && currentDir !== 'RIGHT') setDirection('LEFT');
      } else {
        if (dy > 0 && currentDir !== 'UP') setDirection('DOWN');
        else if (dy < 0 && currentDir !== 'DOWN') setDirection('UP');
      }
    };

    const handleClick = () => {
      if (gameState === 'idle' && difficulty) {
        startGame();
      } else if (gameState === 'paused') {
        setGameState('playing');
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameState, difficulty, startGame, setDirection, getDiffSettings]);

  // ------------------------------------------------------------------
  // Touch / swipe controls
  // ------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (gameState === 'idle' && difficulty) {
        startGame();
        e.preventDefault();
        return;
      }
      if (gameState === 'paused') {
        setGameState('playing');
        e.preventDefault();
        return;
      }

      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameState !== 'playing') return;
      e.preventDefault();

      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;

      const dx = touchX - touchStartX;
      const dy = touchY - touchStartY;

      const threshold = 20;

      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) setDirection('RIGHT');
          else setDirection('LEFT');
        } else {
          if (dy > 0) setDirection('DOWN');
          else setDirection('UP');
        }
        touchStartX = touchX;
        touchStartY = touchY;
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameState, difficulty, startGame, setDirection]);

  // ------------------------------------------------------------------
  // Game loop
  // ------------------------------------------------------------------
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (timestamp: number) => {
      if (timestamp - lastMoveRef.current > speedRef.current) {
        moveSnake();
        lastMoveRef.current = timestamp;
      }

      draw(ctx);
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, moveSnake, draw]);

  // ------------------------------------------------------------------
  // Draw idle screen
  // ------------------------------------------------------------------
  useEffect(() => {
    if (gameState !== 'idle') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cs = DEFAULT_CELL_SIZE;
    const gs = DEFAULT_GRID_SIZE;
    const width = CANVAS_SIZE;
    const height = CANVAS_SIZE;

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1e3a2f');
    gradient.addColorStop(1, '#0d1f17');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= gs; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cs, 0);
      ctx.lineTo(x * cs, height);
      ctx.stroke();
    }
    for (let y = 0; y <= gs; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cs);
      ctx.lineTo(width, y * cs);
      ctx.stroke();
    }

    // Demo snake
    const center = Math.floor(gs / 2);
    const demoSnake = [
      { x: center, y: center },
      { x: center - 1, y: center },
      { x: center - 2, y: center },
      { x: center - 3, y: center },
      { x: center - 4, y: center },
      { x: center - 5, y: center },
    ];

    demoSnake.forEach((segment, index) => {
      const x = segment.x * cs;
      const y = segment.y * cs;
      const padding = 2;
      const hue = 120 + index * 5;
      const lightness = 50 - (index / demoSnake.length) * 15;

      ctx.fillStyle = `hsl(${hue}, 70%, ${lightness}%)`;
      ctx.beginPath();
      ctx.roundRect(x + padding, y + padding, cs - padding * 2, cs - padding * 2, index === 0 ? 6 : 4);
      ctx.fill();

      if (index === 0) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x + cs - 10, y + cs / 2 - 4, 4, 0, Math.PI * 2);
        ctx.arc(x + cs - 10, y + cs / 2 + 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(x + cs - 10, y + cs / 2 - 4, 2, 0, Math.PI * 2);
        ctx.arc(x + cs - 10, y + cs / 2 + 4, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Apple
    const appleX = (center + 4) * cs + cs / 2;
    const appleY = center * cs + cs / 2;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(appleX, appleY, cs / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(appleX - 1, appleY - cs / 2 + 2, 3, 5);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(appleX + 4, appleY - cs / 2 + 4, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }, [gameState]);

  const restartGame = () => {
    setGameState('idle');
    resetGame();
  };

  usePlayAgainKey(gameState === 'gameover' && !showWin, restartGame);

  // ------------------------------------------------------------------
  // On-screen direction button handler
  // ------------------------------------------------------------------
  const handleDirButton = useCallback(
    (dir: Direction) => {
      if (gameState === 'playing') {
        setDirection(dir);
      }
    },
    [gameState, setDirection],
  );

  // ------------------------------------------------------------------
  // Difficulty label with emoji
  // ------------------------------------------------------------------
  const difficultyLabel = difficulty
    ? `${difficulty === 'learn' ? '🌟' : difficulty === 'easy' ? '🟢' : difficulty === 'medium' ? '🟡' : '🔴'} ${t[difficulty]}`
    : '';

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <GameWrapper
      title={t.title}
      onInstructionsClick={() => setShowInstructions(true)}
    >
      <div className="flex flex-col md:flex-row items-start justify-center gap-6">
        {/* Game Board */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-xl shadow-2xl border-4 border-[#22c55e]/30 cursor-pointer max-w-full"
            style={{ touchAction: 'none' }}
          />

          {/* Overlays */}
          <AnimatePresence>
            {/* ---- Difficulty selector (shown when idle + no difficulty chosen) ---- */}
            {gameState === 'idle' && !difficulty && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl"
              >
                <motion.div
                  animate={{ x: [0, 10, 0], rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-3"
                >
                  🐍
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                  {t.title}
                </h2>
                <p className="text-white/80 text-sm mb-4">{t.difficulty}</p>
                <div className="flex flex-col gap-3 w-56">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startWithDifficulty('learn')}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-full shadow-lg text-lg min-h-[48px]"
                  >
                    🌟 {t.learn}
                    <span className="block text-xs font-normal opacity-80">{t.learnDesc}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startWithDifficulty('easy')}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full shadow-lg text-lg min-h-[48px]"
                  >
                    🟢 {t.easy}
                    <span className="block text-xs font-normal opacity-80">{t.easyDesc}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startWithDifficulty('medium')}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-full shadow-lg text-lg min-h-[48px]"
                  >
                    🟡 {t.medium}
                    <span className="block text-xs font-normal opacity-80">{t.mediumDesc}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startWithDifficulty('hard')}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full shadow-lg text-lg min-h-[48px]"
                  >
                    🔴 {t.hard}
                    <span className="block text-xs font-normal opacity-80">{t.hardDesc}</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ---- Idle with difficulty chosen (ready to start) ---- */}
            {gameState === 'idle' && difficulty && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl"
              >
                <motion.div
                  animate={{ x: [0, 10, 0], rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🐍
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                  {t.title}
                </h2>
                <p className="text-white/70 text-sm mb-4">{difficultyLabel}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                  className="px-8 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                >
                  {t.tapToStart}
                </motion.button>
              </motion.div>
            )}

            {/* ---- Paused ---- */}
            {gameState === 'paused' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl"
              >
                <h2 className="text-3xl font-bold text-white mb-4">⏸️ {t.paused}</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGameState('playing')}
                  className="px-8 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                >
                  ▶️ {t.resume}
                </motion.button>
              </motion.div>
            )}

            {/* ---- Game Over ---- */}
            {gameState === 'gameover' && !showWin && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl"
              >
                <div className="bg-white rounded-3xl p-6 text-center shadow-2xl">
                  <div className="text-4xl mb-3">💀</div>
                  <h2 className="text-xl font-bold text-slate-800 mb-3">{t.gameOver}</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <div className="text-slate-500">{t.score}</div>
                      <div className="text-xl font-bold text-[#22c55e]">{score}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">{t.highScore}</div>
                      <div className="text-xl font-bold text-[#ec4399]">{highScore}</div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={restartGame}
                    className="px-6 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    {t.playAgain}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side Panel */}
        <div className="flex flex-row md:flex-col gap-4">
          <LevelDisplay level={level} isRtl={isRtl} locale={locale} />

          {difficulty && (
            <div className="bg-white/90 rounded-2xl px-5 py-3 shadow-lg text-center">
              <div className="text-sm text-slate-500 font-medium">{t.difficulty}</div>
              <div className="text-lg font-bold text-slate-700">{difficultyLabel}</div>
            </div>
          )}

          <div className="bg-white/90 rounded-2xl px-5 py-3 shadow-lg text-center">
            <div className="text-sm text-slate-500 font-medium">{t.score}</div>
            <div className="text-2xl font-bold text-[#22c55e]">{score}</div>
          </div>

          <div className="bg-white/90 rounded-2xl px-5 py-3 shadow-lg text-center">
            <div className="text-sm text-slate-500 font-medium">{t.length}</div>
            <div className="text-2xl font-bold text-[#00a4e4]">{snakeLength}</div>
          </div>

          <div className="bg-white/90 rounded-2xl px-5 py-3 shadow-lg text-center">
            <div className="text-sm text-slate-500 font-medium">{t.highScore}</div>
            <div className="text-2xl font-bold text-[#ec4399]">{highScore}</div>
          </div>
        </div>
      </div>

      {/* On-screen direction buttons (mobile-friendly) */}
      <div className="flex justify-center mt-4 md:hidden" aria-label="On-screen controls">
        <div className="grid grid-cols-3 gap-1 w-fit">
          <div /> {/* empty top-left */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onPointerDown={() => handleDirButton('UP')}
            className="min-h-[48px] min-w-[48px] bg-white/90 rounded-xl shadow-md flex items-center justify-center text-2xl active:bg-green-200"
            aria-label="Up"
          >
            ⬆️
          </motion.button>
          <div /> {/* empty top-right */}

          <motion.button
            whileTap={{ scale: 0.85 }}
            onPointerDown={() => handleDirButton('LEFT')}
            className="min-h-[48px] min-w-[48px] bg-white/90 rounded-xl shadow-md flex items-center justify-center text-2xl active:bg-green-200"
            aria-label="Left"
          >
            ⬅️
          </motion.button>
          <div className="min-h-[48px] min-w-[48px] flex items-center justify-center text-xl text-white/60">
            🐍
          </div>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onPointerDown={() => handleDirButton('RIGHT')}
            className="min-h-[48px] min-w-[48px] bg-white/90 rounded-xl shadow-md flex items-center justify-center text-2xl active:bg-green-200"
            aria-label="Right"
          >
            ➡️
          </motion.button>

          <div /> {/* empty bottom-left */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onPointerDown={() => handleDirButton('DOWN')}
            className="min-h-[48px] min-w-[48px] bg-white/90 rounded-xl shadow-md flex items-center justify-center text-2xl active:bg-green-200"
            aria-label="Down"
          >
            ⬇️
          </motion.button>
          <div /> {/* empty bottom-right */}
        </div>
      </div>

      {/* Controls hint */}
      <div className="flex flex-wrap justify-center gap-3 mt-4 text-slate-600 text-sm">
        <span className="px-3 py-1 bg-white/80 rounded-full">⌨️ {t.controlsKeyboard}</span>
        <span className="px-3 py-1 bg-white/80 rounded-full">🖱️ {t.controlsMouse}</span>
        <span className="px-3 py-1 bg-white/80 rounded-full">📱 {t.controlsSwipe}</span>
        <span className="px-3 py-1 bg-white/80 rounded-full">{t.controlsPause}</span>
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
        title={t.howToPlay}
        instructions={instrData.instructions}
        controls={instrData.controls}
        tip={instrData.tip}
        locale={locale}
      />
    </GameWrapper>
  );
}
