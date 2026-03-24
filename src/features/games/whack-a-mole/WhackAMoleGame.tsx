'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { TextDirection } from '@/i18n/routing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'menu' | 'playing' | 'gameover';

interface DifficultySettings {
  timeLimit: number;
  spawnRate: number;      // base frames between spawns (lower = faster)
  moleShowTime: number;   // frames a mole stays visible
  goldenShowTime: number;
  bombShowTime: number;
  maxVisible: number;     // max simultaneous moles
  bombChance: number;     // 0‑1
  goldenChance: number;   // 0‑1
}

interface Mole {
  row: number;
  col: number;
  visible: boolean;
  showTime: number;
  type: 'mole' | 'golden' | 'bomb';
  hitAnimation: number;
}

interface WhackAMoleGameProps {
  locale?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 400;
const GRID_COLS = 3;
const GRID_ROWS = 3;
const HOLE_RADIUS = 45;
const MOLE_RADIUS = 35;
const HIGH_SCORE_KEY = 'whack-a-mole-highscore';

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    timeLimit: 45,
    spawnRate: 70,
    moleShowTime: 110,
    goldenShowTime: 70,
    bombShowTime: 90,
    maxVisible: 2,
    bombChance: 0.0,
    goldenChance: 0.15,
  },
  medium: {
    timeLimit: 35,
    spawnRate: 50,
    moleShowTime: 80,
    goldenShowTime: 45,
    bombShowTime: 65,
    maxVisible: 3,
    bombChance: 0.1,
    goldenChance: 0.12,
  },
  hard: {
    timeLimit: 25,
    spawnRate: 35,
    moleShowTime: 55,
    goldenShowTime: 30,
    bombShowTime: 50,
    maxVisible: 4,
    bombChance: 0.2,
    goldenChance: 0.1,
  },
};

// ---------------------------------------------------------------------------
// Translations (4 locales)
// ---------------------------------------------------------------------------

const translations: Record<string, Record<string, string>> = {
  en: {
    title: 'Whack-a-Mole',
    score: 'Score',
    time: 'Time',
    combo: 'Combo',
    highScore: 'Best',
    gameOver: "Time's Up!",
    playAgain: 'Play Again',
    newHighScore: '🏆 New High Score!',
    selectDifficulty: 'Choose Difficulty',
    easy: '🟢 Easy',
    medium: '🟡 Medium',
    hard: '🔴 Hard',
    easyDesc: 'For little ones — slower moles, no bombs',
    mediumDesc: 'Balanced fun — some bombs appear',
    hardDesc: 'Super fast — lots of bombs!',
    miss: 'MISS!',
    molePoints: '🐹 Mole = +10 pts',
    goldenPoints: '👑 Golden = +50 pts',
    bombPoints: '💣 Bomb = −50 pts',
    comboPoints: '🔥 Combo = ×multiplier',
    difficulty: 'Difficulty',
    level: 'Level',
  },
  he: {
    title: 'הכה את השומה',
    score: 'ניקוד',
    time: 'זמן',
    combo: 'קומבו',
    highScore: 'שיא',
    gameOver: '!נגמר הזמן',
    playAgain: 'שחק שוב',
    newHighScore: '🏆 !שיא חדש',
    selectDifficulty: 'בחר רמת קושי',
    easy: '🟢 קל',
    medium: '🟡 בינוני',
    hard: '🔴 קשה',
    easyDesc: 'לקטנטנים — שומות איטיות, בלי פצצות',
    mediumDesc: 'מאוזן — כמה פצצות מופיעות',
    hardDesc: '!סופר מהיר — הרבה פצצות',
    miss: '!פספוס',
    molePoints: '🐹 שומה = +10 נק׳',
    goldenPoints: '👑 זהב = +50 נק׳',
    bombPoints: '💣 פצצה = −50 נק׳',
    comboPoints: '🔥 קומבו = ×מכפיל',
    difficulty: 'קושי',
    level: 'שלב',
  },
  zh: {
    title: '打地鼠',
    score: '得分',
    time: '时间',
    combo: '连击',
    highScore: '最高分',
    gameOver: '时间到！',
    playAgain: '再玩一次',
    newHighScore: '🏆 新纪录！',
    selectDifficulty: '选择难度',
    easy: '🟢 简单',
    medium: '🟡 中等',
    hard: '🔴 困难',
    easyDesc: '适合小朋友——地鼠慢，没有炸弹',
    mediumDesc: '平衡模式——偶尔出现炸弹',
    hardDesc: '超级快——很多炸弹！',
    miss: '没打中！',
    molePoints: '🐹 地鼠 = +10 分',
    goldenPoints: '👑 金色 = +50 分',
    bombPoints: '💣 炸弹 = −50 分',
    comboPoints: '🔥 连击 = ×倍数',
    difficulty: '难度',
    level: '关卡',
  },
  es: {
    title: 'Golpea al Topo',
    score: 'Puntos',
    time: 'Tiempo',
    combo: 'Combo',
    highScore: 'Récord',
    gameOver: '¡Se acabó el tiempo!',
    playAgain: 'Jugar de nuevo',
    newHighScore: '🏆 ¡Nuevo récord!',
    selectDifficulty: 'Elige dificultad',
    easy: '🟢 Fácil',
    medium: '🟡 Medio',
    hard: '🔴 Difícil',
    easyDesc: 'Para peques — topos lentos, sin bombas',
    mediumDesc: 'Equilibrado — algunas bombas',
    hardDesc: '¡Súper rápido — muchas bombas!',
    miss: '¡Fallo!',
    molePoints: '🐹 Topo = +10 pts',
    goldenPoints: '👑 Dorado = +50 pts',
    bombPoints: '💣 Bomba = −50 pts',
    comboPoints: '🔥 Combo = ×multiplicador',
    difficulty: 'Dificultad',
    level: 'Nivel',
  },
};

// ---------------------------------------------------------------------------
// Instructions data (Feynman-style, 4 locales)
// ---------------------------------------------------------------------------

const instructionsData: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      {
        icon: '🐹',
        title: 'Moles pop up!',
        description:
          'Little moles peek out of holes in the ground. Your job is to bonk them on the head before they hide again!',
      },
      {
        icon: '🔨',
        title: 'Whack them!',
        description:
          'Click or tap a mole to whack it. Each mole you hit gives you points. Golden moles are worth extra!',
      },
      {
        icon: '💣',
        title: 'Watch out for bombs!',
        description:
          'Black round things with a fuse are bombs — do NOT hit them or you lose 50 points. Only whack the moles!',
      },
      {
        icon: '⏰',
        title: 'Beat the clock',
        description:
          'You have limited time. Whack as many moles as you can before the timer runs out. Hit moles in a row for combo bonus!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Click or tap on moles to whack them' },
      { icon: '🔢', description: 'Keys 1-9 whack holes (top-left to bottom-right)' },
      { icon: '⏸️', description: 'Escape to go back to menu' },
    ],
    tip: 'Keep your eyes on the whole field — don\'t focus on just one hole. Quick combos multiply your score!',
  },
  he: {
    instructions: [
      {
        icon: '🐹',
        title: '!שומות מציצות',
        description:
          'שומות קטנות מציצות מחורים באדמה. המשימה שלך היא לתפוס אותן לפני שהן מתחבאות!',
      },
      {
        icon: '🔨',
        title: '!הכה אותן',
        description:
          'לחץ או הקש על שומה כדי להכות אותה. כל שומה שאתה פוגע בה נותנת ניקוד. שומות זהב שוות יותר!',
      },
      {
        icon: '💣',
        title: '!היזהר מפצצות',
        description:
          'דברים שחורים עגולים עם פתיל הם פצצות — אל תפגע בהם או שתאבד 50 נקודות!',
      },
      {
        icon: '⏰',
        title: 'נצח את השעון',
        description:
          'יש לך זמן מוגבל. הכה כמה שיותר שומות לפני שהטיימר נגמר. פגיעות רצופות נותנות בונוס קומבו!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'לחץ או הקש על שומות כדי להכות' },
      { icon: '🔢', description: 'מקשים 1-9 מכים חורים (שמאל-למעלה עד ימין-למטה)' },
      { icon: '⏸️', description: 'Escape לחזרה לתפריט' },
    ],
    tip: 'שמור עיניים על כל השטח — אל תתמקד בחור אחד. קומבו מהיר מכפיל ניקוד!',
  },
  zh: {
    instructions: [
      {
        icon: '🐹',
        title: '地鼠冒出来！',
        description:
          '小地鼠会从地上的洞里探出头来。你的任务是在它们藏起来之前敲中它们！',
      },
      {
        icon: '🔨',
        title: '敲打它们！',
        description:
          '点击或轻触地鼠来敲打它。每打中一只地鼠都能得分。金色地鼠分数更高！',
      },
      {
        icon: '💣',
        title: '小心炸弹！',
        description:
          '黑色圆形带引线的是炸弹——千万不要打它们，否则会扣50分！',
      },
      {
        icon: '⏰',
        title: '跑赢时间',
        description:
          '时间有限。在计时结束前尽可能多地敲打地鼠。连续命中可获得连击加成！',
      },
    ],
    controls: [
      { icon: '🖱️', description: '点击或轻触地鼠来敲打' },
      { icon: '🔢', description: '按1-9键敲打对应位置的洞（左上到右下）' },
      { icon: '⏸️', description: 'Escape键返回菜单' },
    ],
    tip: '注意整个场地——不要只盯着一个洞。快速连击可以翻倍得分！',
  },
  es: {
    instructions: [
      {
        icon: '🐹',
        title: '¡Los topos aparecen!',
        description:
          'Pequeños topos asoman por los agujeros del suelo. ¡Tu misión es golpearlos antes de que se escondan!',
      },
      {
        icon: '🔨',
        title: '¡Golpéalos!',
        description:
          'Haz clic o toca un topo para golpearlo. Cada topo te da puntos. ¡Los topos dorados valen más!',
      },
      {
        icon: '💣',
        title: '¡Cuidado con las bombas!',
        description:
          'Las cosas negras redondas con mecha son bombas — ¡NO las golpees o perderás 50 puntos!',
      },
      {
        icon: '⏰',
        title: 'Gana al reloj',
        description:
          'Tienes tiempo limitado. Golpea tantos topos como puedas antes de que acabe el tiempo. ¡Los combos multiplican tu puntuación!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Haz clic o toca los topos para golpear' },
      { icon: '🔢', description: 'Teclas 1-9 golpean los agujeros (arriba-izq a abajo-der)' },
      { icon: '⏸️', description: 'Escape para volver al menú' },
    ],
    tip: 'Mira todo el campo — no te fijes en un solo agujero. ¡Los combos rápidos multiplican tu puntuación!',
  },
};

// ---------------------------------------------------------------------------
// Difficulty level mapping for LevelDisplay
// ---------------------------------------------------------------------------

const difficultyLevel: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WhackAMoleGame({ locale = 'en' }: WhackAMoleGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);

  // --- state ---
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35);
  const [combo, setCombo] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // --- refs ---
  const molesRef = useRef<Mole[]>([]);
  const lastSpawnRef = useRef(0);
  const frameCountRef = useRef(0);
  const hammerPosRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });
  const hammerSwingRef = useRef(0);
  const missAnimationRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const lastMilestoneRef = useRef(0);
  const countdownPlayedRef = useRef(false);

  // --- sounds ---
  const { playClick, playSuccess, playGameOver, playHit, playCountdown, playPowerUp } =
    useRetroSounds();

  // --- i18n ---
  const t = translations[locale] || translations.en;
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const instrData = instructionsData[locale] || instructionsData.en;

  // Keep refs in sync with state for use in canvas loop
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const settings = DIFFICULTY_SETTINGS[difficulty];

  const getHolePosition = useCallback((row: number, col: number) => {
    const startX =
      (CANVAS_WIDTH - (GRID_COLS * (HOLE_RADIUS * 2 + 30) - 30)) / 2 + HOLE_RADIUS;
    const startY = 100 + HOLE_RADIUS;
    return {
      x: startX + col * (HOLE_RADIUS * 2 + 30),
      y: startY + row * (HOLE_RADIUS * 2 + 40),
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Spawn
  // ---------------------------------------------------------------------------

  const spawnMole = useCallback(() => {
    const s = DIFFICULTY_SETTINGS[difficulty];
    if (molesRef.current.filter((m) => m.visible).length >= s.maxVisible) return;

    const occupiedHoles = new Set(
      molesRef.current.filter((m) => m.visible).map((m) => `${m.row}-${m.col}`)
    );

    const emptyHoles: { row: number; col: number }[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (!occupiedHoles.has(`${row}-${col}`)) {
          emptyHoles.push({ row, col });
        }
      }
    }
    if (emptyHoles.length === 0) return;

    const hole = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
    const rand = Math.random();
    const type: Mole['type'] =
      rand < s.bombChance ? 'bomb' : rand < s.bombChance + s.goldenChance ? 'golden' : 'mole';

    molesRef.current.push({
      row: hole.row,
      col: hole.col,
      visible: true,
      showTime:
        type === 'golden' ? s.goldenShowTime : type === 'bomb' ? s.bombShowTime : s.moleShowTime,
      type,
      hitAnimation: 0,
    });
  }, [difficulty]);

  // ---------------------------------------------------------------------------
  // Start / restart
  // ---------------------------------------------------------------------------

  const startGame = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      const s = DIFFICULTY_SETTINGS[diff];
      setGameState('playing');
      setScore(0);
      setTimeLeft(s.timeLimit);
      setCombo(0);
      setIsNewHighScore(false);
      molesRef.current = [];
      lastSpawnRef.current = 0;
      frameCountRef.current = 0;
      scoreRef.current = 0;
      comboRef.current = 0;
      lastMilestoneRef.current = 0;
      countdownPlayedRef.current = false;
      playClick();
    },
    [playClick]
  );

  usePlayAgainKey(gameState === 'gameover', useCallback(() => { playClick(); startGame(difficulty); }, [playClick, startGame, difficulty]));

  // ---------------------------------------------------------------------------
  // Whack logic
  // ---------------------------------------------------------------------------

  const whackAtPosition = useCallback(
    (x: number, y: number) => {
      if (gameState !== 'playing') return;

      hammerSwingRef.current = 10;

      let hit = false;
      molesRef.current.forEach((mole) => {
        if (!mole.visible || mole.hitAnimation > 0) return;

        const pos = getHolePosition(mole.row, mole.col);
        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);

        if (dist < MOLE_RADIUS + 15) {
          hit = true;
          mole.hitAnimation = 15;
          mole.visible = false;

          if (mole.type === 'bomb') {
            setScore((s) => Math.max(0, s - 50));
            setCombo(0);
            comboRef.current = 0;
            playHit();
          } else {
            const points = mole.type === 'golden' ? 50 : 10;
            const newCombo = comboRef.current + 1;
            comboRef.current = newCombo;
            setCombo(newCombo);
            const earned = points * Math.min(newCombo, 5);
            const newScore = scoreRef.current + earned;
            scoreRef.current = newScore;
            setScore(newScore);
            playHit();

            // Milestone sound every 100 pts
            const milestone = Math.floor(newScore / 100);
            if (milestone > lastMilestoneRef.current) {
              lastMilestoneRef.current = milestone;
              playSuccess();
            }
          }
        }
      });

      if (!hit) {
        setCombo(0);
        comboRef.current = 0;
        missAnimationRef.current = { x, y, time: 20 };
      }
    },
    [gameState, getHolePosition, playHit, playSuccess]
  );

  // Whack by grid position (keyboard 1-9)
  const whackByIndex = useCallback(
    (index: number) => {
      if (gameState !== 'playing') return;
      const row = Math.floor(index / GRID_COLS);
      const col = index % GRID_COLS;
      const pos = getHolePosition(row, col);
      whackAtPosition(pos.x, pos.y);
    },
    [gameState, getHolePosition, whackAtPosition]
  );

  // ---------------------------------------------------------------------------
  // Canvas mouse / touch input
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      hammerPosRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      whackAtPosition(
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top) * scaleY
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;
      hammerPosRef.current = { x, y };
      whackAtPosition(x, y);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [whackAtPosition]);

  // ---------------------------------------------------------------------------
  // Keyboard controls
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-9 whack holes
      if (gameState === 'playing') {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9) {
          e.preventDefault();
          whackByIndex(num - 1);
          return;
        }
      }

      if (e.code === 'Escape' && gameState === 'playing') {
        e.preventDefault();
        setGameState('menu');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, whackByIndex]);

  // ---------------------------------------------------------------------------
  // Timer
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('gameover');
          const finalScore = scoreRef.current;
          if (finalScore > highScore) {
            setHighScore(finalScore);
            setIsNewHighScore(true);
            localStorage.setItem(HIGH_SCORE_KEY, String(finalScore));
          }
          playGameOver();
          return 0;
        }
        // Countdown sound when 5 seconds left
        if (prev <= 6 && !countdownPlayedRef.current) {
          countdownPlayedRef.current = true;
          playCountdown();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, highScore, playGameOver, playCountdown]);

  // ---------------------------------------------------------------------------
  // Canvas rendering loop
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      frameCountRef.current++;

      // --- Spawn ---
      lastSpawnRef.current++;
      if (lastSpawnRef.current >= settings.spawnRate) {
        spawnMole();
        lastSpawnRef.current = 0;
      }

      // --- Update moles ---
      molesRef.current = molesRef.current.filter((mole) => {
        if (mole.hitAnimation > 0) {
          mole.hitAnimation--;
          return mole.hitAnimation > 0;
        }
        mole.showTime--;
        if (mole.showTime <= 0) {
          mole.visible = false;
          return false;
        }
        return true;
      });

      // --- Hammer swing ---
      if (hammerSwingRef.current > 0) hammerSwingRef.current--;

      // --- Miss animation ---
      if (missAnimationRef.current) {
        missAnimationRef.current.time--;
        if (missAnimationRef.current.time <= 0) missAnimationRef.current = null;
      }

      // ========== DRAW ==========

      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(0.5, '#90EE90');
      gradient.addColorStop(1, '#228B22');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grass texture
      ctx.fillStyle = '#2d5a27';
      for (let i = 0; i < 50; i++) {
        const gx = (i * 17) % CANVAS_WIDTH;
        const gy = 150 + ((i * 23) % 250);
        ctx.fillRect(gx, gy, 2, 8);
      }

      // --- Holes & moles ---
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const pos = getHolePosition(row, col);

          // Hole shadow
          ctx.fillStyle = '#1a1a1a';
          ctx.beginPath();
          ctx.ellipse(pos.x, pos.y + 10, HOLE_RADIUS, HOLE_RADIUS * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Hole
          ctx.fillStyle = '#3d2817';
          ctx.beginPath();
          ctx.ellipse(pos.x, pos.y, HOLE_RADIUS, HOLE_RADIUS * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Mole
          const mole = molesRef.current.find(
            (m) => m.row === row && m.col === col && (m.visible || m.hitAnimation > 0)
          );
          if (mole) {
            const popUpHeight =
              mole.hitAnimation > 0 ? -20 : Math.min(40, (80 - mole.showTime) * 2);

            ctx.save();
            ctx.translate(pos.x, pos.y - popUpHeight);

            if (mole.type === 'bomb') {
              // Bomb body
              ctx.fillStyle = '#1a1a1a';
              ctx.beginPath();
              ctx.arc(0, -10, MOLE_RADIUS - 5, 0, Math.PI * 2);
              ctx.fill();
              // Fuse
              ctx.strokeStyle = '#8B4513';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(0, -35);
              ctx.quadraticCurveTo(10, -45, 5, -50);
              ctx.stroke();
              // Spark
              if (frameCountRef.current % 10 < 5) {
                ctx.fillStyle = '#ff6b35';
                ctx.beginPath();
                ctx.arc(5, -52, 4, 0, Math.PI * 2);
                ctx.fill();
              }
              // Skull
              ctx.fillStyle = '#fff';
              ctx.beginPath();
              ctx.arc(-5, -12, 8, 0, Math.PI * 2);
              ctx.arc(5, -12, 8, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Mole body
              ctx.fillStyle = mole.type === 'golden' ? '#FFD700' : '#8B4513';
              ctx.beginPath();
              ctx.arc(0, -10, MOLE_RADIUS - 5, 0, Math.PI * 2);
              ctx.fill();

              // Ears
              ctx.beginPath();
              ctx.arc(-20, -30, 10, 0, Math.PI * 2);
              ctx.arc(20, -30, 10, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ffb6c1';
              ctx.beginPath();
              ctx.arc(-20, -30, 5, 0, Math.PI * 2);
              ctx.arc(20, -30, 5, 0, Math.PI * 2);
              ctx.fill();

              // Face
              ctx.fillStyle = mole.type === 'golden' ? '#FFC700' : '#a0522d';
              ctx.beginPath();
              ctx.ellipse(0, -5, 18, 15, 0, 0, Math.PI * 2);
              ctx.fill();

              // Eyes
              ctx.fillStyle = '#fff';
              ctx.beginPath();
              ctx.arc(-8, -15, 8, 0, Math.PI * 2);
              ctx.arc(8, -15, 8, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#000';
              ctx.beginPath();
              ctx.arc(-8, -15, 4, 0, Math.PI * 2);
              ctx.arc(8, -15, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#fff';
              ctx.beginPath();
              ctx.arc(-6, -17, 2, 0, Math.PI * 2);
              ctx.arc(10, -17, 2, 0, Math.PI * 2);
              ctx.fill();

              // Nose
              ctx.fillStyle = '#ff69b4';
              ctx.beginPath();
              ctx.ellipse(0, -5, 8, 5, 0, 0, Math.PI * 2);
              ctx.fill();

              // Whiskers
              ctx.strokeStyle = '#333';
              ctx.lineWidth = 1;
              for (let w = -1; w <= 1; w++) {
                ctx.beginPath();
                ctx.moveTo(-20, -5 + w * 5);
                ctx.lineTo(-35, -8 + w * 8);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(20, -5 + w * 5);
                ctx.lineTo(35, -8 + w * 8);
                ctx.stroke();
              }

              // Teeth
              ctx.fillStyle = '#fff';
              ctx.fillRect(-4, 5, 3, 5);
              ctx.fillRect(1, 5, 3, 5);

              // Crown for golden
              if (mole.type === 'golden') {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.moveTo(-15, -40);
                ctx.lineTo(-10, -50);
                ctx.lineTo(0, -42);
                ctx.lineTo(10, -50);
                ctx.lineTo(15, -40);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ff8c00';
                ctx.lineWidth = 2;
                ctx.stroke();
              }
            }

            // Hit stars
            if (mole.hitAnimation > 0) {
              ctx.fillStyle = '#FFD700';
              for (let s = 0; s < 5; s++) {
                const angle = (s / 5) * Math.PI * 2 + frameCountRef.current * 0.2;
                const dist = (15 - mole.hitAnimation) * 3;
                const sx = Math.cos(angle) * dist;
                const sy = Math.sin(angle) * dist - 20;
                ctx.beginPath();
                ctx.arc(sx, sy, 4, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            ctx.restore();
          }

          // Dirt mound
          ctx.fillStyle = '#8B4513';
          ctx.beginPath();
          ctx.ellipse(pos.x, pos.y + 15, HOLE_RADIUS + 5, 15, 0, 0, Math.PI);
          ctx.fill();

          // Keyboard hint number (small, in each hole)
          const holeIndex = row * GRID_COLS + col + 1;
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(holeIndex), pos.x, pos.y);
        }
      }

      // Miss text
      if (missAnimationRef.current) {
        const missT = translations[locale]?.miss || 'MISS!';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          missT,
          missAnimationRef.current.x,
          missAnimationRef.current.y - (20 - missAnimationRef.current.time)
        );
      }

      // Hammer cursor
      ctx.save();
      ctx.translate(hammerPosRef.current.x, hammerPosRef.current.y);
      ctx.rotate((hammerSwingRef.current > 0 ? -0.5 : 0.2) + Math.PI / 4);
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-5, 0, 10, 50);
      ctx.fillStyle = '#666';
      ctx.fillRect(-20, -15, 40, 25);
      ctx.fillStyle = '#888';
      ctx.fillRect(-18, -13, 36, 5);
      ctx.restore();

      gameLoopRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, settings, spawnMole, getHolePosition, locale]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <GameWrapper title={t.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`flex flex-col items-center gap-4 ${isRtl ? 'direction-rtl' : ''}`}>
        {/* ---------- MENU / DIFFICULTY SELECTOR ---------- */}
        <AnimatePresence>
          {gameState === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-6 py-8 w-full max-w-md"
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="text-7xl"
              >
                🐹
              </motion.div>

              <h2 className="text-3xl font-bold text-slate-800 text-center">{t.title}</h2>
              <p className="text-lg font-semibold text-slate-600 text-center">
                {t.selectDifficulty}
              </p>

              <div className="flex flex-col gap-3 w-full">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                  <motion.button
                    key={diff}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      playClick();
                      startGame(diff);
                    }}
                    className={`w-full px-6 py-4 rounded-2xl text-left shadow-lg font-bold text-lg transition-colors min-h-[56px] ${
                      diff === 'easy'
                        ? 'bg-green-100 hover:bg-green-200 text-green-800 border-2 border-green-300'
                        : diff === 'medium'
                          ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-2 border-yellow-300'
                          : 'bg-red-100 hover:bg-red-200 text-red-800 border-2 border-red-300'
                    }`}
                  >
                    <div>{t[diff]}</div>
                    <div className="text-sm font-normal opacity-75 mt-1">
                      {t[`${diff}Desc`]}
                    </div>
                  </motion.button>
                ))}
              </div>

              {highScore > 0 && (
                <div className="text-center text-slate-500 mt-2">
                  {t.highScore}: <span className="font-bold text-[#f97316]">{highScore}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------- PLAYING ---------- */}
        {gameState === 'playing' && (
          <>
            {/* HUD */}
            <div className="flex flex-wrap justify-center gap-3 mb-2">
              <LevelDisplay level={difficultyLevel[difficulty]} />

              <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center">
                <div className="text-sm text-slate-500 font-medium">{t.score}</div>
                <div className="text-2xl font-bold text-[#8B4513]">{score}</div>
              </div>
              <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center">
                <div className="text-sm text-slate-500 font-medium">{t.time}</div>
                <div
                  className={`text-2xl font-bold ${
                    timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-[#3b82f6]'
                  }`}
                >
                  {timeLeft}s
                </div>
              </div>
              <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center">
                <div className="text-sm text-slate-500 font-medium">{t.combo}</div>
                <div className="text-2xl font-bold text-[#a855f7]">
                  x{Math.min(combo, 5)}
                </div>
              </div>
              <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center">
                <div className="text-sm text-slate-500 font-medium">{t.highScore}</div>
                <div className="text-2xl font-bold text-[#f97316]">{highScore}</div>
              </div>
            </div>

            {/* Canvas */}
            <div className="relative w-full" style={{ maxWidth: CANVAS_WIDTH }}>
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="rounded-xl shadow-2xl border-4 border-[#8B4513]/30 w-full h-auto"
                style={{ touchAction: 'none', cursor: 'none' }}
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 text-slate-600 text-sm">
              <span className="px-3 py-1 bg-white/80 rounded-full">{t.molePoints}</span>
              <span className="px-3 py-1 bg-white/80 rounded-full">{t.goldenPoints}</span>
              {difficulty !== 'easy' && (
                <span className="px-3 py-1 bg-white/80 rounded-full">{t.bombPoints}</span>
              )}
              <span className="px-3 py-1 bg-white/80 rounded-full">{t.comboPoints}</span>
            </div>
          </>
        )}

        {/* ---------- GAME OVER ---------- */}
        <AnimatePresence>
          {gameState === 'gameover' && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full">
                <div className="text-5xl mb-4">⏰</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">{t.gameOver}</h2>
                <div className="text-4xl font-bold text-[#8B4513] mb-2">{score}</div>
                {isNewHighScore && (
                  <div className="text-lg text-[#f97316] font-bold mb-3">{t.newHighScore}</div>
                )}
                <div className="flex flex-col gap-3 mt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      playClick();
                      startGame(difficulty);
                    }}
                    className="px-8 py-3 bg-[#8B4513] hover:bg-[#6B3410] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
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
                    className="px-8 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-lg font-bold rounded-full shadow min-h-[48px]"
                  >
                    {t.selectDifficulty}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------- INSTRUCTIONS MODAL ---------- */}
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
