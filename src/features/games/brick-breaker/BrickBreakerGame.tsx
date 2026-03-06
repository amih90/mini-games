'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { useRetroSounds } from '@/hooks/useRetroSounds';

// ─── Constants ───────────────────────────────────────────────
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 600;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 8;
const BRICK_COLS = 8;
const BRICK_WIDTH = 54;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 4;
const BRICK_TOP_OFFSET = 60;
const BRICK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

// ─── Types ───────────────────────────────────────────────────
type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultySettings {
  ballSpeed: number;
  ballSpeedIncrement: number;
  paddleWidth: number;
  brickRows: number;
  maxBrickRows: number;
  lives: number;
}

interface Brick {
  x: number;
  y: number;
  color: string;
  visible: boolean;
  points: number;
}

interface BrickBreakerGameProps {
  locale?: string;
}

// ─── Difficulty presets ──────────────────────────────────────
const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    ballSpeed: 3,
    ballSpeedIncrement: 0.2,
    paddleWidth: 130,
    brickRows: 4,
    maxBrickRows: 6,
    lives: 5,
  },
  medium: {
    ballSpeed: 4,
    ballSpeedIncrement: 0.4,
    paddleWidth: 100,
    brickRows: 5,
    maxBrickRows: 8,
    lives: 3,
  },
  hard: {
    ballSpeed: 5.5,
    ballSpeedIncrement: 0.5,
    paddleWidth: 75,
    brickRows: 6,
    maxBrickRows: 10,
    lives: 2,
  },
};

// ─── 4-locale translations ──────────────────────────────────
const translations: Record<string, Record<string, string>> = {
  en: {
    title: 'Brick Breaker',
    score: 'Score',
    lives: 'Lives',
    level: 'Level',
    highScore: 'Best',
    gameOver: 'Game Over!',
    youWin: 'You Win!',
    playAgain: 'Play Again',
    nextLevel: 'Next Level',
    tapToStart: 'Click to Start',
    paused: 'Paused',
    resume: 'Resume',
    clickToLaunch: 'Click to Launch',
    difficulty: 'Choose Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    mouseMove: 'Mouse = Move',
    arrowMove: '←/→ Move',
    spaceLaunch: 'Space = Launch',
    escPause: 'P/Esc = Pause',
    touchMove: 'Swipe = Move',
  },
  he: {
    title: 'שובר לבנים',
    score: 'ניקוד',
    lives: 'חיים',
    level: 'שלב',
    highScore: 'שיא',
    gameOver: 'המשחק נגמר!',
    youWin: '!ניצחת',
    playAgain: 'שחק שוב',
    nextLevel: 'שלב הבא',
    tapToStart: 'לחץ להתחלה',
    paused: 'מושהה',
    resume: 'המשך',
    clickToLaunch: 'לחץ לשיגור',
    difficulty: 'בחר רמת קושי',
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
    mouseMove: 'עכבר = הזזה',
    arrowMove: '←/→ הזזה',
    spaceLaunch: 'רווח = שיגור',
    escPause: 'P/Esc = השהיה',
    touchMove: 'החלקה = הזזה',
  },
  zh: {
    title: '打砖块',
    score: '得分',
    lives: '生命',
    level: '关卡',
    highScore: '最高分',
    gameOver: '游戏结束！',
    youWin: '你赢了！',
    playAgain: '再玩一次',
    nextLevel: '下一关',
    tapToStart: '点击开始',
    paused: '已暂停',
    resume: '继续',
    clickToLaunch: '点击发射',
    difficulty: '选择难度',
    easy: '简单',
    medium: '中等',
    hard: '困难',
    mouseMove: '鼠标 = 移动',
    arrowMove: '←/→ 移动',
    spaceLaunch: '空格 = 发射',
    escPause: 'P/Esc = 暂停',
    touchMove: '滑动 = 移动',
  },
  es: {
    title: 'Rompe Ladrillos',
    score: 'Puntuación',
    lives: 'Vidas',
    level: 'Nivel',
    highScore: 'Récord',
    gameOver: '¡Fin del juego!',
    youWin: '¡Ganaste!',
    playAgain: 'Jugar de nuevo',
    nextLevel: 'Siguiente nivel',
    tapToStart: 'Haz clic para empezar',
    paused: 'Pausado',
    resume: 'Continuar',
    clickToLaunch: 'Haz clic para lanzar',
    difficulty: 'Elige dificultad',
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
    mouseMove: 'Ratón = Mover',
    arrowMove: '←/→ Mover',
    spaceLaunch: 'Espacio = Lanzar',
    escPause: 'P/Esc = Pausa',
    touchMove: 'Deslizar = Mover',
  },
};

// ─── 4-locale instructions (Feynman style) ───────────────────
const instructionsData: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      { icon: '🎯', title: 'Break Bricks', description: 'Use the paddle to bounce the ball and break all the bricks. Move the paddle with your mouse or keyboard!' },
      { icon: '💎', title: 'Point Values', description: 'Different bricks are worth different points! Top bricks (red) = 50, orange = 40, yellow = 30, green = 20, blue = 10.' },
      { icon: '⭐', title: 'Level Up', description: 'Break all bricks to advance to the next level! Each level adds more rows and the ball moves faster!' },
      { icon: '❤️', title: 'Keep Your Lives', description: "Don't let the ball fall below the paddle! If you lose all lives, game over." },
    ],
    controls: [
      { icon: '🖱️', description: 'Mouse - Move Paddle' },
      { icon: '⬅️', description: 'Left Arrow / A - Move Left' },
      { icon: '➡️', description: 'Right Arrow / D - Move Right' },
      { icon: '␣', description: 'Space / Click - Launch Ball' },
      { icon: '📱', description: 'Touch & Swipe - Move on mobile' },
    ],
    tip: 'Pro tip: Hit the ball with the edges of the paddle to change its angle. This helps reach difficult bricks!',
  },
  he: {
    instructions: [
      { icon: '🎯', title: 'שברו לבנים', description: 'השתמשו במחבט כדי להקפיץ את הכדור ולשבור את כל הלבנים. הזיזו את המחבט עם העכבר או המקלדת!' },
      { icon: '💎', title: 'שווי נקודות', description: 'לבנים שונים שווים נקודות שונות! לבנים עליונות (אדומות) = 50, כתומות = 40, צהובות = 30, ירוקות = 20, כחולות = 10.' },
      { icon: '⭐', title: 'עלו רמות', description: 'שברו את כל הלבנים כדי לעבור לרמה הבאה! כל רמה מוסיפה שורות נוספות והכדור נע מהר יותר!' },
      { icon: '❤️', title: 'שימרו על החיים', description: 'אל תתנו לכדור ליפול! אם תאבדו את כל החיים, המשחק נגמר.' },
    ],
    controls: [
      { icon: '🖱️', description: 'עכבר - הזז מחבט' },
      { icon: '⬅️', description: 'חץ שמאלה / A - הזז שמאלה' },
      { icon: '➡️', description: 'חץ ימינה / D - הזז ימינה' },
      { icon: '␣', description: 'רווח / לחיצה - שגר כדור' },
      { icon: '📱', description: 'מגע והחלקה - בנייד' },
    ],
    tip: 'טיפ למומחים: נסו לפגוע בכדור עם הקצוות של המחבט כדי לשנות את הזווית שלו. זה יעזור לכם להגיע ללבנים קשות!',
  },
  zh: {
    instructions: [
      { icon: '🎯', title: '打碎砖块', description: '用挡板弹球打碎所有砖块。用鼠标或键盘移动挡板！' },
      { icon: '💎', title: '分数值', description: '不同颜色的砖块分数不同！顶部红色 = 50，橙色 = 40，黄色 = 30，绿色 = 20，蓝色 = 10。' },
      { icon: '⭐', title: '升级', description: '打碎所有砖块即可进入下一关！每关会增加更多行，球速也会加快！' },
      { icon: '❤️', title: '保护生命', description: '不要让球掉到挡板下面！失去所有生命就会游戏结束。' },
    ],
    controls: [
      { icon: '🖱️', description: '鼠标 - 移动挡板' },
      { icon: '⬅️', description: '左箭头 / A - 向左移动' },
      { icon: '➡️', description: '右箭头 / D - 向右移动' },
      { icon: '␣', description: '空格 / 点击 - 发射球' },
      { icon: '📱', description: '触摸滑动 - 移动端操作' },
    ],
    tip: '小技巧：用挡板的边缘击球可以改变球的角度，帮助你打到难以触及的砖块！',
  },
  es: {
    instructions: [
      { icon: '🎯', title: 'Rompe ladrillos', description: 'Usa la paleta para rebotar la pelota y romper todos los ladrillos. ¡Mueve la paleta con el ratón o el teclado!' },
      { icon: '💎', title: 'Puntos', description: '¡Los ladrillos tienen diferentes valores! Rojos (arriba) = 50, naranjas = 40, amarillos = 30, verdes = 20, azules = 10.' },
      { icon: '⭐', title: 'Sube de nivel', description: '¡Rompe todos los ladrillos para avanzar al siguiente nivel! Cada nivel añade más filas y la pelota se mueve más rápido.' },
      { icon: '❤️', title: 'Cuida tus vidas', description: '¡No dejes que la pelota caiga! Si pierdes todas las vidas, se acabó el juego.' },
    ],
    controls: [
      { icon: '🖱️', description: 'Ratón - Mover paleta' },
      { icon: '⬅️', description: 'Flecha izquierda / A - Mover a la izquierda' },
      { icon: '➡️', description: 'Flecha derecha / D - Mover a la derecha' },
      { icon: '␣', description: 'Espacio / Clic - Lanzar pelota' },
      { icon: '📱', description: 'Toque y deslizar - En móvil' },
    ],
    tip: 'Consejo: ¡Golpea la pelota con los bordes de la paleta para cambiar su ángulo y alcanzar ladrillos difíciles!',
  },
};

// ─── Component ───────────────────────────────────────────────
export default function BrickBreakerGame({ locale = 'en' }: BrickBreakerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'idle' | 'playing' | 'paused' | 'gameover' | 'win'>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('brick-breaker-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [showWin, setShowWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const settingsRef = useRef<DifficultySettings>(DIFFICULTY_SETTINGS.medium);
  const paddleRef = useRef({ x: CANVAS_WIDTH / 2 - 50, y: CANVAS_HEIGHT - 40 });
  const ballRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60, dx: 4, dy: -4, launched: false });
  const bricksRef = useRef<Brick[]>([]);
  const mouseXRef = useRef(CANVAS_WIDTH / 2);
  const keysRef = useRef<Set<string>>(new Set());

  const {
    playClick, playSuccess, playLevelUp, playGameOver,
    playHit, playPowerUp, playWin,
  } = useRetroSounds();

  const t = translations[locale] || translations.en;
  const isRtl = locale === 'he';
  const instrData = instructionsData[locale] || instructionsData.en;

  // ─── Helpers ─────────────────────────────────────────────
  const updateHighScore = useCallback((newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('brick-breaker-highscore', String(newScore));
    }
  }, [highScore]);

  const createBricks = useCallback((lvl: number, settings: DifficultySettings) => {
    const bricks: Brick[] = [];
    const rows = Math.min(settings.brickRows + Math.floor(lvl / 2), settings.maxBrickRows);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        const x = col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_PADDING + 10;
        const y = row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_TOP_OFFSET;
        bricks.push({
          x,
          y,
          color: BRICK_COLORS[row % BRICK_COLORS.length],
          visible: true,
          points: (rows - row) * 10,
        });
      }
    }
    bricksRef.current = bricks;
  }, []);

  const resetBall = useCallback((lvl: number, settings: DifficultySettings) => {
    const speed = settings.ballSpeed + lvl * settings.ballSpeedIncrement;
    ballRef.current = {
      x: paddleRef.current.x + settings.paddleWidth / 2,
      y: CANVAS_HEIGHT - 60,
      dx: (Math.random() > 0.5 ? 1 : -1) * (speed * 0.8),
      dy: -speed,
      launched: false,
    };
  }, []);

  // ─── Difficulty selection ─────────────────────────────────
  const selectDifficulty = useCallback((diff: Difficulty) => {
    playClick();
    const settings = DIFFICULTY_SETTINGS[diff];
    settingsRef.current = settings;
    setDifficulty(diff);
    setGameState('idle');
    setScore(0);
    setLives(settings.lives);
    setLevel(1);
    paddleRef.current = { x: CANVAS_WIDTH / 2 - settings.paddleWidth / 2, y: CANVAS_HEIGHT - 40 };
    createBricks(1, settings);
    resetBall(1, settings);
  }, [playClick, createBricks, resetBall]);

  const startGame = useCallback(() => {
    playClick();
    setGameState('playing');
  }, [playClick]);

  const nextLevel = useCallback(() => {
    const newLevel = level + 1;
    setLevel(newLevel);
    playLevelUp();
    const settings = settingsRef.current;
    createBricks(newLevel, settings);
    resetBall(newLevel, settings);
    setGameState('playing');
  }, [level, createBricks, resetBall, playLevelUp]);

  const restartGame = useCallback(() => {
    setShowWin(false);
    setGameState('menu');
    setDifficulty(null);
  }, []);

  // ─── Mouse / Touch controls ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      mouseXRef.current = (e.clientX - rect.left) * scaleX;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      mouseXRef.current = (e.touches[0].clientX - rect.left) * scaleX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      mouseXRef.current = (e.touches[0].clientX - rect.left) * scaleX;
    };

    const handleClick = () => {
      if (gameState === 'idle') {
        startGame();
      } else if (gameState === 'playing' && !ballRef.current.launched) {
        ballRef.current.launched = true;
        playClick();
      } else if (gameState === 'paused') {
        setGameState('playing');
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (gameState === 'idle') {
        startGame();
      } else if (gameState === 'playing' && !ballRef.current.launched) {
        ballRef.current.launched = true;
        playClick();
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameState, startGame, playClick]);

  // ─── Keyboard controls ───────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);

      if (gameState === 'menu') return;

      if (gameState === 'idle' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        startGame();
        return;
      }

      if (gameState === 'playing') {
        if (e.code === 'Space' && !ballRef.current.launched) {
          e.preventDefault();
          ballRef.current.launched = true;
          playClick();
        } else if (e.code === 'Escape' || e.code === 'KeyP') {
          setGameState('paused');
        }
      } else if (gameState === 'paused' && (e.code === 'Space' || e.code === 'Escape')) {
        setGameState('playing');
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
  }, [gameState, startGame, playClick]);

  // ─── Game loop ────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const settings = settingsRef.current;
    const paddleWidth = settings.paddleWidth;

    const draw = () => {
      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#1e1e2e');
      gradient.addColorStop(1, '#2d2d44');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw bricks
      bricksRef.current.forEach(brick => {
        if (!brick.visible) return;

        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT, 4);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(brick.x + 2, brick.y + 2, BRICK_WIDTH - 4, 4);
      });

      // Draw paddle
      const paddle = paddleRef.current;
      const paddleGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + PADDLE_HEIGHT);
      paddleGradient.addColorStop(0, '#60a5fa');
      paddleGradient.addColorStop(1, '#3b82f6');
      ctx.fillStyle = paddleGradient;
      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddleWidth, PADDLE_HEIGHT, 8);
      ctx.fill();

      // Draw ball
      const ball = ballRef.current;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Launch hint
      if (!ball.launched) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t.clickToLaunch, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      }
    };

    const gameLoop = () => {
      // Continuous keyboard movement
      const keys = keysRef.current;
      if (keys.has('ArrowLeft') || keys.has('KeyA')) {
        mouseXRef.current = Math.max(paddleWidth / 2, mouseXRef.current - 8);
      }
      if (keys.has('ArrowRight') || keys.has('KeyD')) {
        mouseXRef.current = Math.min(CANVAS_WIDTH - paddleWidth / 2, mouseXRef.current + 8);
      }

      // Update paddle position
      const targetX = mouseXRef.current - paddleWidth / 2;
      paddleRef.current.x += (targetX - paddleRef.current.x) * 0.25;
      paddleRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - paddleWidth, paddleRef.current.x));

      const ball = ballRef.current;
      const paddle = paddleRef.current;

      if (ball.launched) {
        // Move ball
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall collisions
        if (ball.x - BALL_RADIUS <= 0 || ball.x + BALL_RADIUS >= CANVAS_WIDTH) {
          ball.dx = -ball.dx;
          ball.x = Math.max(BALL_RADIUS, Math.min(CANVAS_WIDTH - BALL_RADIUS, ball.x));
        }
        if (ball.y - BALL_RADIUS <= 0) {
          ball.dy = -ball.dy;
          ball.y = BALL_RADIUS;
        }

        // Paddle collision
        if (
          ball.y + BALL_RADIUS >= paddle.y &&
          ball.y - BALL_RADIUS <= paddle.y + PADDLE_HEIGHT &&
          ball.x >= paddle.x &&
          ball.x <= paddle.x + paddleWidth &&
          ball.dy > 0
        ) {
          ball.dy = -Math.abs(ball.dy);
          const hitPos = (ball.x - paddle.x) / paddleWidth;
          ball.dx = (hitPos - 0.5) * 10;
          playHit();
        }

        // Ball falls below paddle
        if (ball.y > CANVAS_HEIGHT) {
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setGameState('gameover');
              playGameOver();
              setScore(prev => {
                updateHighScore(prev);
                return prev;
              });
            } else {
              playHit();
              resetBall(level, settings);
            }
            return newLives;
          });
        }

        // Brick collisions
        let bricksHit = 0;
        bricksRef.current.forEach(brick => {
          if (!brick.visible) return;

          if (
            ball.x + BALL_RADIUS > brick.x &&
            ball.x - BALL_RADIUS < brick.x + BRICK_WIDTH &&
            ball.y + BALL_RADIUS > brick.y &&
            ball.y - BALL_RADIUS < brick.y + BRICK_HEIGHT
          ) {
            brick.visible = false;
            ball.dy = -ball.dy;
            bricksHit++;
            setScore(s => {
              const newScore = s + brick.points;
              updateHighScore(newScore);
              return newScore;
            });
          }
        });

        if (bricksHit > 0) {
          if (bricksHit > 1) {
            playPowerUp();
          } else {
            playSuccess();
          }
        }

        // Check win condition
        if (bricksRef.current.every(b => !b.visible)) {
          setGameState('win');
          playWin();
          setScore(prev => {
            updateHighScore(prev);
            return prev;
          });
          setShowWin(true);
        }
      } else {
        ball.x = paddle.x + paddleWidth / 2;
      }

      draw();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, level, resetBall, playClick, playSuccess, playPowerUp, playHit, playWin, playGameOver, updateHighScore, t.clickToLaunch]);

  // ─── Draw idle / menu screen ──────────────────────────────
  useEffect(() => {
    if (gameState !== 'idle' && gameState !== 'menu') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1e1e2e');
    gradient.addColorStop(1, '#2d2d44');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Demo bricks
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        const x = col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_PADDING + 10;
        const y = row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_TOP_OFFSET;
        ctx.fillStyle = BRICK_COLORS[row];
        ctx.beginPath();
        ctx.roundRect(x, y, BRICK_WIDTH, BRICK_HEIGHT, 4);
        ctx.fill();
      }
    }

    // Demo paddle
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.roundRect(CANVAS_WIDTH / 2 - 50, CANVAS_HEIGHT - 40, 100, PADDLE_HEIGHT, 8);
    ctx.fill();

    // Demo ball
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }, [gameState]);

  // ─── Difficulty label for display ─────────────────────────
  const difficultyLabel = difficulty ? t[difficulty] : '';
  const difficultyColor = difficulty === 'easy' ? '#22c55e' : difficulty === 'hard' ? '#ef4444' : '#eab308';

  return (
    <GameWrapper
      title={t.title}
      onInstructionsClick={() => setShowInstructions(true)}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Top stats row */}
        {gameState !== 'menu' && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <LevelDisplay level={level} locale={locale} isRtl={isRtl} />
            <div className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full shadow-md">
              <span className="text-sm font-medium text-slate-500">{t.score}:</span>
              <span className="text-lg font-bold text-[#3b82f6]">{score}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full shadow-md">
              <span className="text-sm font-medium text-slate-500">{t.lives}:</span>
              <span className="text-lg font-bold text-[#ef4444]">{'❤️'.repeat(Math.max(0, lives))}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full shadow-md">
              <span className="text-sm font-medium text-slate-500">{t.highScore}:</span>
              <span className="text-lg font-bold text-[#f97316]">{highScore}</span>
            </div>
            {difficulty && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full shadow-md" style={{ backgroundColor: difficultyColor + '22', border: `2px solid ${difficultyColor}` }}>
                <span className="text-sm font-bold" style={{ color: difficultyColor }}>{difficultyLabel}</span>
              </div>
            )}
          </div>
        )}

        {/* Canvas area */}
        <div className="relative w-full" style={{ maxWidth: CANVAS_WIDTH }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full rounded-xl shadow-2xl border-4 border-[#3b82f6]/30 cursor-pointer"
            style={{ touchAction: 'none' }}
          />

          <AnimatePresence>
            {/* Difficulty selector (menu) */}
            {gameState === 'menu' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🧱
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">{t.title}</h2>
                <p className="text-white/80 text-lg mb-6">{t.difficulty}</p>
                <div className="flex flex-col gap-3 w-56">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => selectDifficulty('easy')}
                    className="px-8 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    🟢 {t.easy}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => selectDifficulty('medium')}
                    className="px-8 py-3 bg-[#eab308] hover:bg-[#ca8a04] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    🟡 {t.medium}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => selectDifficulty('hard')}
                    className="px-8 py-3 bg-[#ef4444] hover:bg-[#dc2626] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    🔴 {t.hard}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Ready to play overlay */}
            {gameState === 'idle' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                  className="px-8 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                >
                  ▶️ {t.tapToStart}
                </motion.button>
              </motion.div>
            )}

            {/* Paused */}
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
                  className="px-8 py-3 bg-[#3b82f6] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                >
                  ▶️ {t.resume}
                </motion.button>
              </motion.div>
            )}

            {/* Game Over */}
            {gameState === 'gameover' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl"
              >
                <div className="bg-white rounded-3xl p-6 text-center shadow-2xl">
                  <div className="text-4xl mb-3">💥</div>
                  <h2 className="text-xl font-bold text-slate-800 mb-3">{t.gameOver}</h2>
                  <div className="text-2xl font-bold text-[#3b82f6] mb-4">{t.score}: {score}</div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={restartGame}
                    className="px-6 py-2 bg-[#3b82f6] text-white font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    {t.playAgain}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Level Win */}
            {gameState === 'win' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl"
              >
                <div className="bg-white rounded-3xl p-6 text-center shadow-2xl">
                  <div className="text-4xl mb-3">🎉</div>
                  <h2 className="text-xl font-bold text-slate-800 mb-3">{t.youWin}</h2>
                  <div className="text-2xl font-bold text-[#22c55e] mb-4">{t.score}: {score}</div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setShowWin(false); nextLevel(); }}
                      className="px-6 py-2 bg-[#22c55e] text-white font-bold rounded-full shadow-lg min-h-[48px]"
                    >
                      {t.nextLevel}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={restartGame}
                      className="px-6 py-2 bg-slate-500 text-white font-bold rounded-full shadow-lg min-h-[48px]"
                    >
                      {t.playAgain}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* On-screen mobile buttons */}
        {(gameState === 'playing' || gameState === 'idle') && (
          <div className="flex md:hidden items-center justify-center gap-4 mt-2">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onTouchStart={(e) => { e.preventDefault(); keysRef.current.add('ArrowLeft'); }}
              onTouchEnd={(e) => { e.preventDefault(); keysRef.current.delete('ArrowLeft'); }}
              className="min-h-[56px] min-w-[56px] bg-white/90 rounded-2xl shadow-lg flex items-center justify-center text-3xl select-none active:bg-white"
              aria-label="Move Left"
            >
              ⬅️
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onTouchStart={(e) => {
                e.preventDefault();
                if (!ballRef.current.launched) {
                  ballRef.current.launched = true;
                  playClick();
                }
              }}
              className="min-h-[56px] min-w-[72px] bg-[#3b82f6]/90 rounded-2xl shadow-lg flex items-center justify-center text-xl font-bold text-white select-none active:bg-[#3b82f6]"
              aria-label="Launch Ball"
            >
              🚀
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onTouchStart={(e) => { e.preventDefault(); keysRef.current.add('ArrowRight'); }}
              onTouchEnd={(e) => { e.preventDefault(); keysRef.current.delete('ArrowRight'); }}
              className="min-h-[56px] min-w-[56px] bg-white/90 rounded-2xl shadow-lg flex items-center justify-center text-3xl select-none active:bg-white"
              aria-label="Move Right"
            >
              ➡️
            </motion.button>
          </div>
        )}

        {/* Control hints (translated) */}
        <div className="hidden md:flex flex-wrap justify-center gap-3 text-slate-600 text-sm">
          <span className="px-3 py-1 bg-white/80 rounded-full">🖱️ {t.mouseMove}</span>
          <span className="px-3 py-1 bg-white/80 rounded-full">⌨️ {t.arrowMove}</span>
          <span className="px-3 py-1 bg-white/80 rounded-full">␣ {t.spaceLaunch}</span>
          <span className="px-3 py-1 bg-white/80 rounded-full">⏸️ {t.escPause}</span>
        </div>
      </div>

      <WinModal
        isOpen={showWin}
        onClose={() => setShowWin(false)}
        onPlayAgain={restartGame}
        score={score}
      />

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
