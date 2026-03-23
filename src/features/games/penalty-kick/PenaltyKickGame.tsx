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
// Types
// ---------------------------------------------------------------------------
type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'aiming' | 'shooting' | 'result';
type ShotResult = 'goal' | 'saved' | 'missed' | null;
type GameState = 'levelSelect' | 'playing' | 'gameover';

interface PenaltyKickGameProps {
  locale?: string;
}

interface DifficultySettings {
  keeperSpeed: number;
  keeperGuessAccuracy: number;
  goalWidth: number;
  keeperWidth: number;
  label: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const GOAL_HEIGHT = 100;
const GOAL_Y = 30;
const BALL_RADIUS = 15;
const KEEPER_HEIGHT = 80;
const MAX_ATTEMPTS = 5;

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    keeperSpeed: 6,
    keeperGuessAccuracy: 0.25,
    goalWidth: 320,
    keeperWidth: 50,
    label: 'easy',
  },
  medium: {
    keeperSpeed: 10,
    keeperGuessAccuracy: 0.5,
    goalWidth: 300,
    keeperWidth: 60,
    label: 'medium',
  },
  hard: {
    keeperSpeed: 16,
    keeperGuessAccuracy: 0.75,
    goalWidth: 270,
    keeperWidth: 70,
    label: 'hard',
  },
};

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------
const translations: Record<string, Record<string, string>> = {
  en: {
    title: 'Penalty Kick',
    score: 'Goals',
    attempts: 'Attempts',
    highScore: 'Best',
    goal: 'GOAL!',
    saved: 'SAVED!',
    missed: 'MISSED!',
    gameOver: 'Game Over!',
    playAgain: 'Play Again',
    tapToStart: 'Click to Start',
    holdToShoot: 'Hold to power up, release to shoot',
    aimWithMouse: 'Aim with mouse',
    newHighScore: 'New High Score!',
    selectDifficulty: 'Select Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    easyDesc: 'Big goal, slow keeper',
    mediumDesc: 'Balanced challenge',
    hardDesc: 'Small goal, fast keeper',
    power: 'Power',
    arrowsAim: 'Arrows = Aim',
    spaceShoot: 'Space = Shoot',
    perfect: 'Perfect!',
  },
  he: {
    title: 'בעיטת עונשין',
    score: 'שערים',
    attempts: 'ניסיונות',
    highScore: 'שיא',
    goal: '!גול',
    saved: '!נעצר',
    missed: '!החטאה',
    gameOver: '!המשחק נגמר',
    playAgain: 'שחק שוב',
    tapToStart: 'לחץ להתחלה',
    holdToShoot: 'לחץ והחזק לכוח, שחרר לבעוט',
    aimWithMouse: 'כוון עם העכבר',
    newHighScore: '!שיא חדש',
    selectDifficulty: 'בחר רמת קושי',
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
    easyDesc: 'שער רחב, שוער איטי',
    mediumDesc: 'אתגר מאוזן',
    hardDesc: 'שער צר, שוער מהיר',
    power: 'כוח',
    arrowsAim: 'חצים = כיוון',
    spaceShoot: 'רווח = בעיטה',
    perfect: '!מושלם',
  },
  zh: {
    title: '点球大战',
    score: '进球',
    attempts: '尝试',
    highScore: '最佳',
    goal: '进球！',
    saved: '被扑！',
    missed: '偏了！',
    gameOver: '游戏结束！',
    playAgain: '再玩一次',
    tapToStart: '点击开始',
    holdToShoot: '按住蓄力，松开射门',
    aimWithMouse: '鼠标瞄准',
    newHighScore: '新纪录！',
    selectDifficulty: '选择难度',
    easy: '简单',
    medium: '中等',
    hard: '困难',
    easyDesc: '大球门、慢守门员',
    mediumDesc: '平衡挑战',
    hardDesc: '小球门、快守门员',
    power: '力量',
    arrowsAim: '方向键 = 瞄准',
    spaceShoot: '空格 = 射门',
    perfect: '完美！',
  },
  es: {
    title: 'Tiro Penal',
    score: 'Goles',
    attempts: 'Intentos',
    highScore: 'Mejor',
    goal: '¡GOL!',
    saved: '¡ATAJADO!',
    missed: '¡FALLADO!',
    gameOver: '¡Fin del juego!',
    playAgain: 'Jugar de nuevo',
    tapToStart: 'Haz clic para empezar',
    holdToShoot: 'Mantén para cargar, suelta para disparar',
    aimWithMouse: 'Apunta con el ratón',
    newHighScore: '¡Nuevo récord!',
    selectDifficulty: 'Elegir dificultad',
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
    easyDesc: 'Portería grande, portero lento',
    mediumDesc: 'Desafío equilibrado',
    hardDesc: 'Portería pequeña, portero rápido',
    power: 'Potencia',
    arrowsAim: 'Flechas = Apuntar',
    spaceShoot: 'Espacio = Disparar',
    perfect: '¡Perfecto!',
  },
};

// ---------------------------------------------------------------------------
// Instructions data (Feynman-style)
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
        icon: '⚽',
        title: 'Goal',
        description:
          'You have 5 penalty kicks. Aim at the goal and try to score as many as you can — like a real penalty shootout!',
      },
      {
        icon: '🎯',
        title: 'How to Aim',
        description:
          'Move your mouse (or drag on mobile, or press arrow keys) to move the crosshair inside the goal. That\'s where the ball will fly.',
      },
      {
        icon: '💪',
        title: 'Power Up',
        description:
          'Hold down the mouse button (or Space) to charge your shot. A bar fills up — the fuller it is, the harder you kick. Release to shoot!',
      },
      {
        icon: '🧤',
        title: 'The Goalkeeper',
        description:
          'The goalkeeper will dive to stop your shot. On Easy he is slow, on Hard he is fast and smart. Try to outsmart him!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Mouse: move to aim, hold click to charge, release to shoot' },
      { icon: '📱', description: 'Touch: tap & drag to aim, release to shoot' },
      { icon: '⌨️', description: 'Arrow keys to aim, hold Space to charge, release to shoot' },
    ],
    tip: 'Don\'t always aim at the corners — sometimes the middle catches the keeper off guard!',
  },
  he: {
    instructions: [
      {
        icon: '⚽',
        title: 'מטרה',
        description:
          'יש לך 5 בעיטות עונשין. כוון לשער ונסה להבקיע כמה שיותר — בדיוק כמו פנדלים אמיתיים!',
      },
      {
        icon: '🎯',
        title: 'איך לכוון',
        description:
          'הזז את העכבר (או גרור במובייל, או לחץ חצים) כדי להזיז את הכוונת בתוך השער. לשם הכדור יעוף.',
      },
      {
        icon: '💪',
        title: 'טעינת כוח',
        description:
          'החזק את כפתור העכבר (או רווח) כדי לטעון את הבעיטה. פס מתמלא — ככל שהוא מלא יותר, הבעיטה חזקה יותר. שחרר לבעוט!',
      },
      {
        icon: '🧤',
        title: 'השוער',
        description:
          'השוער יקפוץ כדי לעצור את הבעיטה. ברמה קלה הוא איטי, ברמה קשה הוא מהיר וחכם. נסה לרמות אותו!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'עכבר: הזז לכיוון, החזק קליק לטעינה, שחרר לבעיטה' },
      { icon: '📱', description: 'מגע: הקש וגרור לכיוון, שחרר לבעיטה' },
      { icon: '⌨️', description: 'חצים לכיוון, החזק רווח לטעינה, שחרר לבעיטה' },
    ],
    tip: 'אל תכוון תמיד לפינות — לפעמים בעיטה למרכז תופסת את השוער לא מוכן!',
  },
  zh: {
    instructions: [
      {
        icon: '⚽',
        title: '目标',
        description:
          '你有5次点球机会。瞄准球门，尽可能多进球——就像真正的点球大战！',
      },
      {
        icon: '🎯',
        title: '如何瞄准',
        description:
          '移动鼠标（或在手机上拖动，或按方向键）来移动十字准星。球会飞向那个位置。',
      },
      {
        icon: '💪',
        title: '蓄力',
        description:
          '按住鼠标按钮（或空格键）来蓄力。一个条会慢慢填满——越满踢得越有力。松开射门！',
      },
      {
        icon: '🧤',
        title: '守门员',
        description:
          '守门员会扑球。简单模式他很慢，困难模式他又快又聪明。试着骗过他！',
      },
    ],
    controls: [
      { icon: '🖱️', description: '鼠标：移动瞄准，按住蓄力，松开射门' },
      { icon: '📱', description: '触屏：点击拖动瞄准，松开射门' },
      { icon: '⌨️', description: '方向键瞄准，按住空格蓄力，松开射门' },
    ],
    tip: '不要总是瞄准角落——有时踢中间反而会让守门员措手不及！',
  },
  es: {
    instructions: [
      {
        icon: '⚽',
        title: 'Objetivo',
        description:
          'Tienes 5 penales. Apunta al arco e intenta meter todos los goles — ¡como una tanda real de penales!',
      },
      {
        icon: '🎯',
        title: 'Cómo apuntar',
        description:
          'Mueve el ratón (o arrastra en el móvil, o usa las flechas) para mover la mira dentro del arco. Allí irá el balón.',
      },
      {
        icon: '💪',
        title: 'Cargar potencia',
        description:
          'Mantén pulsado el botón del ratón (o Espacio) para cargar tu disparo. Una barra se llena — cuanto más llena, más fuerte el tiro. ¡Suelta para disparar!',
      },
      {
        icon: '🧤',
        title: 'El portero',
        description:
          'El portero se lanzará para detener tu tiro. En Fácil es lento, en Difícil es rápido e inteligente. ¡Intenta engañarlo!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Ratón: mueve para apuntar, mantén clic para cargar, suelta para disparar' },
      { icon: '📱', description: 'Táctil: toca y arrastra para apuntar, suelta para disparar' },
      { icon: '⌨️', description: 'Flechas para apuntar, mantén Espacio para cargar, suelta para disparar' },
    ],
    tip: 'No siempre apuntes a las esquinas — ¡a veces el centro sorprende al portero!',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PenaltyKickGame({ locale = 'en' }: PenaltyKickGameProps) {
  const t = translations[locale] || translations.en;
  const isRtl = locale === 'he';
  const instrData = instructionsData[locale] || instructionsData.en;

  // ---- Refs ----------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const aimRef = useRef({ x: CANVAS_WIDTH / 2, y: GOAL_Y + GOAL_HEIGHT / 2 });
  const ballRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60, vx: 0, vy: 0 });
  const keeperRef = useRef({ x: 0, targetX: 0 });
  const powerRef = useRef(0);
  const isPoweringRef = useRef(false);
  const resultHandledRef = useRef(false);

  // ---- State ---------------------------------------------------------------
  const [gameState, setGameState] = useState<GameState>('levelSelect');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [phase, setPhase] = useState<GamePhase>('aiming');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [shotResult, setShotResult] = useState<ShotResult>(null);
  const [showWin, setShowWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('penalty-kick-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // ---- Sounds --------------------------------------------------------------
  const { playShoot, playSuccess, playHit, playGameOver, playWin, playClick } =
    useRetroSounds();

  // ---- Derived settings ----------------------------------------------------
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const GOAL_WIDTH = settings.goalWidth;
  const GOAL_X = (CANVAS_WIDTH - GOAL_WIDTH) / 2;
  const KEEPER_WIDTH = settings.keeperWidth;

  // ---- Helpers -------------------------------------------------------------
  const resetShot = useCallback(() => {
    ballRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60, vx: 0, vy: 0 };
    powerRef.current = 0;
    isPoweringRef.current = false;
    resultHandledRef.current = false;
    setPhase('aiming');
    setShotResult(null);

    const randomOffset = (Math.random() - 0.5) * 100;
    keeperRef.current = {
      x: CANVAS_WIDTH / 2 - KEEPER_WIDTH / 2 + randomOffset,
      targetX: CANVAS_WIDTH / 2 - KEEPER_WIDTH / 2,
    };
    aimRef.current = { x: CANVAS_WIDTH / 2, y: GOAL_Y + GOAL_HEIGHT / 2 };
  }, [KEEPER_WIDTH]);

  const startGame = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      setGameState('playing');
      setScore(0);
      setAttempts(0);
      resetShot();
      playClick();
    },
    [resetShot, playClick],
  );

  const shoot = useCallback(() => {
    if (phase !== 'aiming' || !isPoweringRef.current) return;

    const power = Math.min(powerRef.current, 100);
    const aim = aimRef.current;
    const ball = ballRef.current;

    const dx = aim.x - ball.x;
    const dy = aim.y - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const speed = 8 + (power / 100) * 8;
    ball.vx = (dx / dist) * speed;
    ball.vy = (dy / dist) * speed;

    // Keeper AI — guess based on difficulty accuracy
    const guessCorrect = Math.random() < settings.keeperGuessAccuracy;

    if (guessCorrect) {
      const aimSide = aim.x < CANVAS_WIDTH / 2 ? -1 : 1;
      keeperRef.current.targetX =
        CANVAS_WIDTH / 2 -
        settings.keeperWidth / 2 +
        aimSide * (settings.goalWidth / 2 - settings.keeperWidth / 2 + 10);
    } else {
      const wrongSide = aim.x < CANVAS_WIDTH / 2 ? 1 : -1;
      keeperRef.current.targetX =
        CANVAS_WIDTH / 2 -
        settings.keeperWidth / 2 +
        wrongSide * (settings.goalWidth / 2 - settings.keeperWidth / 2 + 10);
    }

    setPhase('shooting');
    isPoweringRef.current = false;
    playShoot();
  }, [phase, playShoot, settings]);

  // ---- Input handling ------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (gameState !== 'playing') return;

    const goalX = (CANVAS_WIDTH - settings.goalWidth) / 2;
    const goalW = settings.goalWidth;

    const clampAim = (x: number, y: number) => ({
      x: Math.max(goalX + 20, Math.min(goalX + goalW - 20, x)),
      y: Math.max(GOAL_Y + 10, Math.min(GOAL_Y + GOAL_HEIGHT - 10, y)),
    });

    const canvasCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * CANVAS_WIDTH,
        y: ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
      };
    };

    // Mouse
    const handleMouseMove = (e: MouseEvent) => {
      if (phase !== 'aiming') return;
      const { x, y } = canvasCoords(e.clientX, e.clientY);
      aimRef.current = clampAim(x, y);
    };

    const handleMouseDown = () => {
      if (phase === 'aiming') {
        isPoweringRef.current = true;
        powerRef.current = 0;
      }
    };

    const handleMouseUp = () => {
      if (isPoweringRef.current) shoot();
    };

    // Touch
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (phase === 'aiming') {
        const touch = e.touches[0];
        const { x, y } = canvasCoords(touch.clientX, touch.clientY);
        aimRef.current = clampAim(x, y);
        isPoweringRef.current = true;
        powerRef.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (phase !== 'aiming') return;
      const touch = e.touches[0];
      const { x, y } = canvasCoords(touch.clientX, touch.clientY);
      aimRef.current = clampAim(x, y);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (isPoweringRef.current) shoot();
    };

    // Keyboard
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 10;
      if (phase === 'aiming') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          aimRef.current = clampAim(aimRef.current.x - step, aimRef.current.y);
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          aimRef.current = clampAim(aimRef.current.x + step, aimRef.current.y);
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          aimRef.current = clampAim(aimRef.current.x, aimRef.current.y - step);
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          aimRef.current = clampAim(aimRef.current.x, aimRef.current.y + step);
        }

        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          if (!isPoweringRef.current) {
            isPoweringRef.current = true;
            powerRef.current = 0;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'Enter') && isPoweringRef.current) {
        shoot();
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, phase, shoot, settings]);

  // ---- Game loop -----------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (gameState !== 'playing') return;

    const goalX = (CANVAS_WIDTH - settings.goalWidth) / 2;
    const goalW = settings.goalWidth;
    const kw = settings.keeperWidth;
    const keeperSpd = settings.keeperSpeed;

    const gameLoop = () => {
      // Power charging
      if (isPoweringRef.current && phase === 'aiming') {
        powerRef.current = Math.min(powerRef.current + 2, 100);
      }

      // Ball physics during shooting
      if (phase === 'shooting') {
        const ball = ballRef.current;
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= 0.99;
        ball.vy *= 0.99;

        // Keeper dive
        const keeper = keeperRef.current;
        if (keeper.x < keeper.targetX) {
          keeper.x = Math.min(keeper.x + keeperSpd, keeper.targetX);
        } else if (keeper.x > keeper.targetX) {
          keeper.x = Math.max(keeper.x - keeperSpd, keeper.targetX);
        }

        // Check result
        if (!resultHandledRef.current && ball.y <= GOAL_Y + GOAL_HEIGHT + BALL_RADIUS) {
          const inGoalX = ball.x > goalX && ball.x < goalX + goalW;
          const inGoalY = ball.y > GOAL_Y && ball.y < GOAL_Y + GOAL_HEIGHT;
          const keeperSave =
            ball.x > keeper.x - BALL_RADIUS &&
            ball.x < keeper.x + kw + BALL_RADIUS &&
            ball.y > GOAL_Y &&
            ball.y < GOAL_Y + KEEPER_HEIGHT;

          if (inGoalX && inGoalY && !keeperSave) {
            resultHandledRef.current = true;
            setShotResult('goal');
            setScore((s) => s + 1);
            playSuccess();
            setPhase('result');
            setAttempts((a) => a + 1);
          } else if (keeperSave) {
            resultHandledRef.current = true;
            setShotResult('saved');
            playHit();
            setPhase('result');
            setAttempts((a) => a + 1);
          } else if (!inGoalX || ball.y <= GOAL_Y) {
            resultHandledRef.current = true;
            setShotResult('missed');
            playHit();
            setPhase('result');
            setAttempts((a) => a + 1);
          }
        }

        // Ball went off screen
        if (
          !resultHandledRef.current &&
          (ball.y < -50 || ball.x < -50 || ball.x > CANVAS_WIDTH + 50)
        ) {
          resultHandledRef.current = true;
          setShotResult('missed');
          playHit();
          setPhase('result');
          setAttempts((a) => a + 1);
        }
      }

      // ---------- Draw -------------------------------------------------------
      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#1e88e5');
      skyGrad.addColorStop(1, '#64b5f6');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grass
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
      ctx.fillStyle = '#388e3c';
      for (let i = 0; i < CANVAS_WIDTH; i += 60) {
        ctx.fillRect(i, CANVAS_HEIGHT - 100, 30, 100);
      }

      // Penalty spot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 55, 4, 0, Math.PI * 2);
      ctx.fill();

      // Goal posts
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 3;
      ctx.fillRect(goalX - 8, GOAL_Y, 8, GOAL_HEIGHT);
      ctx.strokeRect(goalX - 8, GOAL_Y, 8, GOAL_HEIGHT);
      ctx.fillRect(goalX + goalW, GOAL_Y, 8, GOAL_HEIGHT);
      ctx.strokeRect(goalX + goalW, GOAL_Y, 8, GOAL_HEIGHT);
      ctx.fillRect(goalX - 8, GOAL_Y - 8, goalW + 16, 8);
      ctx.strokeRect(goalX - 8, GOAL_Y - 8, goalW + 16, 8);

      // Net
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      for (let x = goalX; x <= goalX + goalW; x += 15) {
        ctx.beginPath();
        ctx.moveTo(x, GOAL_Y);
        ctx.lineTo(x, GOAL_Y + GOAL_HEIGHT);
        ctx.stroke();
      }
      for (let y = GOAL_Y; y <= GOAL_Y + GOAL_HEIGHT; y += 15) {
        ctx.beginPath();
        ctx.moveTo(goalX, y);
        ctx.lineTo(goalX + goalW, y);
        ctx.stroke();
      }

      // Goalkeeper
      const keeper = keeperRef.current;
      ctx.fillStyle = '#ff9800';
      ctx.beginPath();
      ctx.roundRect(keeper.x, GOAL_Y + 10, kw, KEEPER_HEIGHT - 20, 10);
      ctx.fill();
      // Head
      ctx.fillStyle = '#ffcc80';
      ctx.beginPath();
      ctx.arc(keeper.x + kw / 2, GOAL_Y + 5, 12, 0, Math.PI * 2);
      ctx.fill();
      // Gloves
      ctx.fillStyle = '#4caf50';
      ctx.beginPath();
      ctx.arc(keeper.x + 5, GOAL_Y + 30, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(keeper.x + kw - 5, GOAL_Y + 30, 8, 0, Math.PI * 2);
      ctx.fill();

      // Aim reticle
      if (phase === 'aiming') {
        const aim = aimRef.current;
        ctx.strokeStyle = '#ff5722';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(aim.x, aim.y, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(aim.x - 25, aim.y);
        ctx.lineTo(aim.x + 25, aim.y);
        ctx.moveTo(aim.x, aim.y - 25);
        ctx.lineTo(aim.x, aim.y + 25);
        ctx.stroke();
      }

      // Ball
      const ball = ballRef.current;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(ball.x - 5, ball.y - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ball.x + 6, ball.y + 2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Power bar
      if ((isPoweringRef.current || powerRef.current > 0) && phase === 'aiming') {
        const barW = 150;
        const barH = 20;
        const barX = CANVAS_WIDTH / 2 - barW / 2;
        const barY = CANVAS_HEIGHT - 30;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);

        const pw = (powerRef.current / 100) * barW;
        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        grad.addColorStop(0, '#4caf50');
        grad.addColorStop(0.5, '#ffeb3b');
        grad.addColorStop(1, '#f44336');
        ctx.fillStyle = grad;
        ctx.fillRect(barX, barY, pw, barH);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barW, barH);

        // Label
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`${t.power}: ${Math.round(powerRef.current)}%`, CANVAS_WIDTH / 2, barY - 5);
      }

      // Result text
      if (phase === 'result' && shotResult) {
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;

        const label =
          shotResult === 'goal' ? t.goal : shotResult === 'saved' ? t.saved : t.missed;
        const color =
          shotResult === 'goal' ? '#4caf50' : shotResult === 'saved' ? '#ff9800' : '#f44336';

        ctx.fillStyle = color;
        ctx.strokeText(label, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.fillText(label, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      }

      // HUD — score & attempts on canvas
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      const hudText = `${t.score}: ${score}/${MAX_ATTEMPTS}   ${t.attempts}: ${attempts}/${MAX_ATTEMPTS}`;
      ctx.strokeText(hudText, 10, CANVAS_HEIGHT - 108);
      ctx.fillText(hudText, 10, CANVAS_HEIGHT - 108);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [
    gameState,
    phase,
    score,
    attempts,
    shotResult,
    settings,
    t,
    playSuccess,
    playHit,
  ]);

  // ---- Auto-advance after result -------------------------------------------
  useEffect(() => {
    if (phase !== 'result' || gameState !== 'playing') return;

    const timer = setTimeout(() => {
      if (attempts >= MAX_ATTEMPTS) {
        // Game over
        setGameState('gameover');
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('penalty-kick-highscore', String(score));
        }
        if (score >= MAX_ATTEMPTS) {
          playWin();
          setShowWin(true);
        } else {
          playGameOver();
        }
      } else {
        resetShot();
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [phase, attempts, score, highScore, gameState, resetShot, playWin, playGameOver]);

  // ---- Restart -------------------------------------------------------------
  const restartGame = useCallback(() => {
    setShowWin(false);
    setGameState('levelSelect');
    setScore(0);
    setAttempts(0);
    setShotResult(null);
    setPhase('aiming');
    playClick();
  }, [playClick]);

  usePlayAgainKey(gameState === 'gameover' && !showWin, restartGame);

  // ---- Difficulty level number (for LevelDisplay) --------------------------
  const levelNum = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;

  // ---- Render ---------------------------------------------------------------
  return (
    <GameWrapper title={t.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="flex flex-col items-center gap-4" ref={containerRef}>
        {/* Level display + score bar */}
        {gameState === 'playing' && (
          <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
            <LevelDisplay level={levelNum} locale={locale} isRtl={isRtl} />
            <div className="bg-white/90 rounded-2xl px-6 py-2 shadow-lg text-center">
              <div className="text-sm text-slate-500 font-medium">{t.score}</div>
              <div className="text-2xl font-bold text-[#4caf50]">
                {score}/{MAX_ATTEMPTS}
              </div>
            </div>
            <div className="bg-white/90 rounded-2xl px-6 py-2 shadow-lg text-center">
              <div className="text-sm text-slate-500 font-medium">{t.attempts}</div>
              <div className="text-2xl font-bold text-[#1e88e5]">
                {attempts}/{MAX_ATTEMPTS}
              </div>
            </div>
            <div className="bg-white/90 rounded-2xl px-6 py-2 shadow-lg text-center">
              <div className="text-sm text-slate-500 font-medium">{t.highScore}</div>
              <div className="text-2xl font-bold text-[#ff9800]">{highScore}</div>
            </div>
          </div>
        )}

        <div className="relative">
          {/* Canvas is always mounted so refs stay valid */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-xl shadow-2xl border-4 border-[#4caf50]/30 cursor-crosshair"
            style={{
              touchAction: 'none',
              maxWidth: '100%',
              display: gameState === 'playing' ? 'block' : 'none',
            }}
          />

          {/* ---- Level selector ---- */}
          <AnimatePresence>
            {gameState === 'levelSelect' && (
              <motion.div
                key="level-select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 px-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-7xl mb-4"
                >
                  ⚽
                </motion.div>
                <h2 className="text-3xl font-bold text-slate-800 mb-6 drop-shadow">
                  {t.title}
                </h2>
                <p className="text-lg text-slate-600 mb-6 font-medium">
                  {t.selectDifficulty}
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  {(
                    [
                      { key: 'easy' as Difficulty, emoji: '🟢', color: 'bg-green-500 hover:bg-green-600' },
                      { key: 'medium' as Difficulty, emoji: '🟡', color: 'bg-yellow-500 hover:bg-yellow-600' },
                      { key: 'hard' as Difficulty, emoji: '🔴', color: 'bg-red-500 hover:bg-red-600' },
                    ] as const
                  ).map((d) => (
                    <motion.button
                      key={d.key}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startGame(d.key)}
                      className={`${d.color} text-white font-bold rounded-2xl px-8 py-4 shadow-lg min-w-[140px] min-h-[48px] flex flex-col items-center gap-1 transition-colors`}
                    >
                      <span className="text-2xl">{d.emoji}</span>
                      <span className="text-lg">{t[d.key]}</span>
                      <span className="text-xs opacity-80">
                        {t[`${d.key}Desc` as keyof typeof t]}
                      </span>
                    </motion.button>
                  ))}
                </div>

                {highScore > 0 && (
                  <p className="mt-6 text-slate-500 font-medium">
                    🏆 {t.highScore}: {highScore}/{MAX_ATTEMPTS}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---- Game over overlay ---- */}
          <AnimatePresence>
            {gameState === 'gameover' && !showWin && (
              <motion.div
                key="gameover"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 px-4"
              >
                <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full">
                  <div className="text-5xl mb-4">🏆</div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-3">{t.gameOver}</h2>
                  <div className="text-4xl font-bold text-[#4caf50] mb-2">
                    {score}/{MAX_ATTEMPTS}
                  </div>
                  {score > 0 && score === highScore && (
                    <div className="text-lg text-[#ff9800] font-bold mb-3">
                      🌟 {t.newHighScore}
                    </div>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={restartGame}
                    className="mt-4 px-8 py-3 bg-[#4caf50] hover:bg-[#388e3c] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    {t.playAgain}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Control hints */}
        {gameState === 'playing' && (
          <div className="flex flex-wrap justify-center gap-3 text-slate-600 text-sm">
            <span className="px-3 py-1 bg-white/80 rounded-full">🖱️ {t.aimWithMouse}</span>
            <span className="px-3 py-1 bg-white/80 rounded-full">⌨️ {t.arrowsAim}</span>
            <span className="px-3 py-1 bg-white/80 rounded-full">🎯 {t.holdToShoot}</span>
          </div>
        )}
      </div>

      {/* Win modal */}
      <WinModal
        isOpen={showWin}
        onClose={() => setShowWin(false)}
        onPlayAgain={restartGame}
        score={score}
      />

      {/* Instructions modal */}
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
