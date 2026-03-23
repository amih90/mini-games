'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { useRetroSounds } from '@/hooks/useRetroSounds';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'menu' | 'countdown' | 'racing' | 'finished';

interface DifficultySettings {
  label: string;
  emoji: string;
  trackMeters: number;
  aiSpeedMultiplier: number;
  aiVariance: number;
  finishX: number;
  color: string;
}

interface Runner {
  x: number;
  y: number;
  speed: number;
  maxSpeed: number;
  frame: number;
  isPlayer: boolean;
  name: string;
  color: string;
  finished: boolean;
  finishTime: number;
}

interface SprintRaceGameProps {
  locale?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_WIDTH = 700;
const TRACK_TOP = 80;
const RUNNER_HEIGHT = 45;
const START_X = 60;
const MIN_OPPONENTS = 1;
const MAX_OPPONENTS = 8;

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    label: 'easy',
    emoji: '🟢',
    trackMeters: 50,
    aiSpeedMultiplier: 0.65,
    aiVariance: 0.15,
    finishX: CANVAS_WIDTH - 120,
    color: '#4caf50',
  },
  medium: {
    label: 'medium',
    emoji: '🟡',
    trackMeters: 100,
    aiSpeedMultiplier: 0.82,
    aiVariance: 0.2,
    finishX: CANVAS_WIDTH - 80,
    color: '#ff9800',
  },
  hard: {
    label: 'hard',
    emoji: '🔴',
    trackMeters: 200,
    aiSpeedMultiplier: 1.0,
    aiVariance: 0.25,
    finishX: CANVAS_WIDTH - 50,
    color: '#f44336',
  },
};

const AI_RUNNERS_BASE = [
  { name: 'Flash', color: '#f44336', baseMax: 4.8 },
  { name: 'Bolt', color: '#9c27b0', baseMax: 5.0 },
  { name: 'Dash', color: '#ff9800', baseMax: 4.5 },
  { name: 'Blaze', color: '#00bcd4', baseMax: 4.9 },
  { name: 'Storm', color: '#795548', baseMax: 4.7 },
  { name: 'Jet', color: '#607d8b', baseMax: 5.1 },
  { name: 'Turbo', color: '#cddc39', baseMax: 4.6 },
  { name: 'Rocket', color: '#ff5722', baseMax: 4.8 },
];

const PLAYER_COLORS = [
  { hex: '#4caf50', label: '🟢' },
  { hex: '#2196f3', label: '🔵' },
  { hex: '#e91e63', label: '🩷' },
  { hex: '#ff9800', label: '🟠' },
  { hex: '#9c27b0', label: '🟣' },
  { hex: '#00bcd4', label: '🩵' },
];

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

const translations: Record<string, Record<string, string>> = {
  en: {
    title: 'Sprint Race',
    time: 'Time',
    best: 'Best',
    position: 'Position',
    tapFast: 'TAP FAST!',
    ready: 'Ready...',
    set: 'Set...',
    go: 'GO!',
    winner: 'You Won!',
    youLost: 'Race Over',
    tryAgain: 'Race Again',
    tapToStart: 'Start Race',
    selectDifficulty: 'Choose Difficulty',
    easy: 'Easy (50 m)',
    medium: 'Medium (100 m)',
    hard: 'Hard (200 m)',
    newBest: '🌟 New Best Time!',
    clickFast: '🖱️ Click Fast!',
    keyboard: '⌨️ Space / Enter / Arrows',
    tapRapidly: '📱 Tap Rapidly!',
    meters: 'm',
    race: 'race',
    you: 'YOU',
    sprint: 'Sprint!',
    difficulty: 'Difficulty',
    playerColor: 'Your Color',
    opponents: 'Opponents',
  },
  he: {
    title: 'מרוץ ספרינט',
    time: 'זמן',
    best: 'שיא',
    position: 'מיקום',
    tapFast: '!לחץ מהר',
    ready: '...מוכנים',
    set: '...היכון',
    go: '!צא',
    winner: '!ניצחת',
    youLost: 'המרוץ נגמר',
    tryAgain: 'שוב',
    tapToStart: 'התחל מרוץ',
    selectDifficulty: 'בחר רמת קושי',
    easy: 'קל (50 מ׳)',
    medium: 'בינוני (100 מ׳)',
    hard: 'קשה (200 מ׳)',
    newBest: '🌟 !שיא חדש',
    clickFast: '🖱️ !לחץ מהר',
    keyboard: '⌨️ רווח / אנטר / חצים',
    tapRapidly: '📱 !הקש מהר',
    meters: 'מ׳',
    race: 'מרוץ',
    you: 'את/ה',
    sprint: '!רוץ',
    difficulty: 'קושי',
    playerColor: 'הצבע שלך',
    opponents: 'מתחרים',
  },
  zh: {
    title: '短跑比赛',
    time: '时间',
    best: '最佳',
    position: '名次',
    tapFast: '快速点击！',
    ready: '准备...',
    set: '预备...',
    go: '跑！',
    winner: '你赢了！',
    youLost: '比赛结束',
    tryAgain: '再来一次',
    tapToStart: '开始比赛',
    selectDifficulty: '选择难度',
    easy: '简单 (50米)',
    medium: '中等 (100米)',
    hard: '困难 (200米)',
    newBest: '🌟 新纪录！',
    clickFast: '🖱️ 快速点击！',
    keyboard: '⌨️ 空格 / 回车 / 方向键',
    tapRapidly: '📱 快速点击！',
    meters: '米',
    race: '比赛',
    you: '你',
    sprint: '冲刺！',
    difficulty: '难度',
    playerColor: '你的颜色',
    opponents: '对手',
  },
  es: {
    title: 'Carrera de Velocidad',
    time: 'Tiempo',
    best: 'Mejor',
    position: 'Posición',
    tapFast: '¡TOCA RÁPIDO!',
    ready: 'Listos...',
    set: 'Preparados...',
    go: '¡YA!',
    winner: '¡Ganaste!',
    youLost: 'Carrera terminada',
    tryAgain: 'Otra vez',
    tapToStart: 'Iniciar carrera',
    selectDifficulty: 'Elige dificultad',
    easy: 'Fácil (50 m)',
    medium: 'Medio (100 m)',
    hard: 'Difícil (200 m)',
    newBest: '🌟 ¡Nuevo récord!',
    clickFast: '🖱️ ¡Clic rápido!',
    keyboard: '⌨️ Espacio / Enter / Flechas',
    tapRapidly: '📱 ¡Toca rápido!',
    meters: 'm',
    race: 'carrera',
    you: 'TÚ',
    sprint: '¡Sprint!',
    difficulty: 'Dificultad',
    playerColor: 'Tu Color',
    opponents: 'Rivales',
  },
};

// ---------------------------------------------------------------------------
// Instructions data (Feynman-style, 4 languages)
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
        icon: '🏁',
        title: 'Goal',
        description:
          'Race against 3 computer runners! Be the first to cross the finish line. Think of it like drumming your fingers as fast as you can on a table — the faster you tap, the faster you run!',
      },
      {
        icon: '👆',
        title: 'How to Sprint',
        description:
          'After the 3-2-1-GO countdown, tap the screen, click the mouse, or mash the Space bar as fast as you can. Each tap gives your runner a burst of speed. Stop tapping and you slow down!',
      },
      {
        icon: '🏆',
        title: 'Winning',
        description:
          'Cross the finish line before all opponents. Your best time is saved so you can try to beat your own record!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Click anywhere rapidly' },
      { icon: '⌨️', description: 'Space, Enter, or Arrow keys' },
      { icon: '📱', description: 'Tap the big Sprint button' },
    ],
    tip: 'Find a steady fast rhythm instead of random mashing — consistent speed beats wild clicking!',
  },
  he: {
    instructions: [
      {
        icon: '🏁',
        title: 'מטרה',
        description:
          'רוץ נגד 3 רצים של המחשב! היה הראשון לחצות את קו הסיום. חשוב על זה כמו תיפוף של האצבעות על השולחן — ככל שאתה מקיש מהר יותר, כך אתה רץ מהר יותר!',
      },
      {
        icon: '👆',
        title: 'איך לרוץ',
        description:
          'אחרי ספירה לאחור 3-2-1-צא!, הקש על המסך, לחץ על העכבר, או לחץ על מקש הרווח כמה שיותר מהר. כל הקשה נותנת לרץ שלך דחיפת מהירות!',
      },
      {
        icon: '🏆',
        title: 'ניצחון',
        description:
          'חצה את קו הסיום לפני כל המתחרים. הזמן הטוב ביותר שלך נשמר כדי שתוכל לנסות לשבור את השיא שלך!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'לחץ בכל מקום במהירות' },
      { icon: '⌨️', description: 'רווח, אנטר, או חצים' },
      { icon: '📱', description: 'הקש על כפתור הריצה' },
    ],
    tip: 'מצא קצב מהיר ויציב במקום ללחוץ בפראות — מהירות עקבית מנצחת לחיצות אקראיות!',
  },
  zh: {
    instructions: [
      {
        icon: '🏁',
        title: '目标',
        description:
          '与3个电脑跑步者比赛！第一个冲过终点线就赢了。想象你在桌子上快速敲手指 — 敲得越快，跑得越快！',
      },
      {
        icon: '👆',
        title: '如何冲刺',
        description:
          '3-2-1-跑！倒计时结束后，尽可能快地点击屏幕、鼠标或按空格键。每次点击都会让你的跑步者加速。停止点击就会减速！',
      },
      {
        icon: '🏆',
        title: '获胜',
        description:
          '在所有对手之前冲过终点线。你的最佳时间会被保存，这样你可以尝试打破自己的记录！',
      },
    ],
    controls: [
      { icon: '🖱️', description: '快速点击任意位置' },
      { icon: '⌨️', description: '空格、回车或方向键' },
      { icon: '📱', description: '点击大冲刺按钮' },
    ],
    tip: '找到稳定的快速节奏，而不是随意乱点 — 稳定的速度胜过疯狂点击！',
  },
  es: {
    instructions: [
      {
        icon: '🏁',
        title: 'Objetivo',
        description:
          '¡Compite contra 3 corredores de la computadora! Sé el primero en cruzar la línea de meta. ¡Imagina que estás tamborileando los dedos en una mesa — cuanto más rápido toques, más rápido corres!',
      },
      {
        icon: '👆',
        title: 'Cómo Esprintar',
        description:
          'Después de la cuenta 3-2-1-¡YA!, toca la pantalla, haz clic o presiona la barra espaciadora lo más rápido posible. ¡Cada toque le da un impulso a tu corredor!',
      },
      {
        icon: '🏆',
        title: 'Ganar',
        description:
          'Cruza la meta antes que todos los oponentes. ¡Tu mejor tiempo se guarda para que puedas intentar batir tu propio récord!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Clic rápido en cualquier lugar' },
      { icon: '⌨️', description: 'Espacio, Enter o flechas' },
      { icon: '📱', description: 'Toca el botón de Sprint' },
    ],
    tip: 'Encuentra un ritmo rápido y constante en lugar de tocar al azar — ¡la velocidad constante gana!',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SprintRaceGame({ locale = 'en' }: SprintRaceGameProps) {
  const t = translations[locale] || translations.en;
  const isRtl = locale === 'he';
  const instrData = instructionsData[locale] || instructionsData.en;

  // ---- Refs ----
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const runnersRef = useRef<Runner[]>([]);
  const startTimeRef = useRef(0);
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);
  const frameCountRef = useRef(0);
  const diffRef = useRef<DifficultySettings>(DIFFICULTY_SETTINGS.medium);
  const gamePhaseRef = useRef<GamePhase>('menu');
  const canvasSizeRef = useRef({ w: CANVAS_WIDTH, h: 360 });

  // ---- State ----
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [countdown, setCountdown] = useState(3);
  const [raceTime, setRaceTime] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [playerWon, setPlayerWon] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(CANVAS_WIDTH);
  const [playerColor, setPlayerColor] = useState(PLAYER_COLORS[0].hex);
  const [opponentCount, setOpponentCount] = useState(3);

  const [bestTime, setBestTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sprint-race-highscore');
      return saved ? parseFloat(saved) : 99.99;
    }
    return 99.99;
  });

  // ---- Sounds ----
  const {
    playClick,
    playSuccess,
    playGameOver,
    playWin,
    playCountdown: playCountdownSound,
  } = useRetroSounds();

  // Keep refs in sync with state
  useEffect(() => {
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);
  useEffect(() => {
    diffRef.current = DIFFICULTY_SETTINGS[difficulty];
  }, [difficulty]);

  // ---- Derived layout values ----
  const totalLanes = opponentCount + 1;
  const LANE_HEIGHT = Math.min(50, Math.floor(280 / totalLanes));
  const CANVAS_HEIGHT = TRACK_TOP + totalLanes * LANE_HEIGHT + 80;

  // ---- Responsive canvas ----
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const cw = Math.min(containerRef.current.clientWidth - 16, CANVAS_WIDTH);
      setCanvasWidth(cw);
      canvasSizeRef.current = { w: cw, h: CANVAS_HEIGHT };
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [CANVAS_HEIGHT]);

  // ---- Initialise runners ----
  const initRunners = useCallback(
    (diff: Difficulty, color: string, numOpponents: number) => {
      const settings = DIFFICULTY_SETTINGS[diff];
      const lanes = numOpponents + 1;
      const laneH = Math.min(50, Math.floor(280 / lanes));
      const runners: Runner[] = [
        {
          x: START_X,
          y: TRACK_TOP + laneH * 0.5 - RUNNER_HEIGHT / 2,
          speed: 0,
          maxSpeed: 5.2,
          frame: 0,
          isPlayer: true,
          name: t.you,
          color,
          finished: false,
          finishTime: 0,
        },
      ];
      const shuffled = [...AI_RUNNERS_BASE].sort(() => Math.random() - 0.5);
      for (let i = 0; i < numOpponents; i++) {
        const ai = shuffled[i % shuffled.length];
        runners.push({
          x: START_X,
          y: TRACK_TOP + laneH * (i + 1.5) - RUNNER_HEIGHT / 2,
          speed: 0,
          maxSpeed: ai.baseMax * settings.aiSpeedMultiplier,
          frame: 0,
          isPlayer: false,
          name: ai.name,
          color: ai.color,
          finished: false,
          finishTime: 0,
        });
      }
      runnersRef.current = runners;
    },
    [t.you],
  );

  // ---- Start race (countdown) ----
  const startRace = useCallback(
    (diff: Difficulty) => {
      initRunners(diff, playerColor, opponentCount);
      setGamePhase('countdown');
      setCountdown(3);
      setRaceTime(0);
      setPlayerPosition(0);
      setPlayerWon(false);
      tapCountRef.current = 0;
      lastTapRef.current = 0;
      frameCountRef.current = 0;
    },
    [initRunners, playerColor, opponentCount],
  );

  // ---- Handle tap / keypress ----
  const handleTap = useCallback(() => {
    if (gamePhaseRef.current !== 'racing') return;

    playClick();

    const now = Date.now();
    const dt = now - lastTapRef.current;

    if (dt < 500) {
      tapCountRef.current = Math.min(tapCountRef.current + 1, 20);
    } else {
      tapCountRef.current = Math.max(tapCountRef.current - 2, 1);
    }
    lastTapRef.current = now;
  }, [playClick]);

  // ---- Countdown effect ----
  useEffect(() => {
    if (gamePhase !== 'countdown') return;
    if (countdown > 0) {
      playCountdownSound();
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    // countdown === 0 → GO
    playCountdownSound();
    const goTimer = setTimeout(() => {
      setGamePhase('racing');
      startTimeRef.current = Date.now();
    }, 400);
    return () => clearTimeout(goTimer);
  }, [gamePhase, countdown, playCountdownSound]);

  // ---- Input listeners ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onClick = () => handleTap();
    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      handleTap();
    };
    const onKey = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' ||
        e.code === 'Enter' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight'
      ) {
        e.preventDefault();
        handleTap();
      }
    };

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onTouch, { passive: false });
    window.addEventListener('keydown', onKey);

    return () => {
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('touchstart', onTouch);
      window.removeEventListener('keydown', onKey);
    };
  }, [handleTap]);

  // ---- Checker pattern (memoised) ----
  const checkerPatternRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const size = 10;
    const c = document.createElement('canvas');
    c.width = size * 2;
    c.height = size * 2;
    const p = c.getContext('2d')!;
    p.fillStyle = '#fff';
    p.fillRect(0, 0, size, size);
    p.fillRect(size, size, size, size);
    p.fillStyle = '#000';
    p.fillRect(size, 0, size, size);
    p.fillRect(0, size, size, size);
    checkerPatternRef.current = c;
  }, []);

  // ---- Draw a single runner ----
  const drawRunner = useCallback(
    (ctx: CanvasRenderingContext2D, runner: Runner) => {
      ctx.save();
      ctx.translate(runner.x, runner.y);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(15, 48, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = runner.color;
      ctx.beginPath();
      (ctx as CanvasRenderingContext2D).roundRect(5, 12, 20, 22, 5);
      ctx.fill();

      // Head
      ctx.fillStyle = '#ffcc80';
      ctx.beginPath();
      ctx.arc(15, 8, 8, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(18, 7, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = runner.color;
      ctx.beginPath();
      ctx.arc(15, 3, 5, Math.PI, 0);
      ctx.fill();

      // Legs (animated)
      const legSwing = Math.sin(runner.frame * Math.PI) * 12;
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(8, 33, 6, 14 + legSwing);
      ctx.fillRect(16, 33, 6, 14 - legSwing);

      // Shoes
      ctx.fillStyle = '#fff';
      ctx.fillRect(6, 46 + legSwing, 10, 4);
      ctx.fillRect(14, 46 - legSwing, 10, 4);

      // Arms (animated)
      const armSwing = Math.cos(runner.frame * Math.PI) * 8;
      ctx.fillStyle = '#ffcc80';
      ctx.fillRect(25, 16 + armSwing, 9, 5);
      ctx.fillRect(-4, 16 - armSwing, 9, 5);

      // Name tag
      ctx.fillStyle = runner.isPlayer ? '#4caf50' : 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      (ctx as CanvasRenderingContext2D).roundRect(-8, -18, 50, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(runner.isPlayer ? t.you : runner.name, 15, -6);

      ctx.restore();
    },
    [t.you],
  );

  // ---- Main game loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numLanes = totalLanes;
    const laneH = LANE_HEIGHT;
    const canvasH = CANVAS_HEIGHT;

    const loop = () => {
      frameCountRef.current++;
      const frame = frameCountRef.current;
      const phase = gamePhaseRef.current;
      const settings = diffRef.current;
      const FINISH_LINE = settings.finishX;
      const scaleX = canvasSizeRef.current.w / CANVAS_WIDTH;
      const scaleY = canvasSizeRef.current.h / canvasH;

      // ---- Update ----
      if (phase === 'racing') {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setRaceTime(elapsed);

        const runners = runnersRef.current;
        runners.forEach((runner) => {
          if (runner.finished) return;

          if (runner.isPlayer) {
            const target = (tapCountRef.current / 20) * runner.maxSpeed;
            runner.speed = runner.speed * 0.88 + target * 0.12;
            // Decay taps
            if (frame % 8 === 0) {
              tapCountRef.current = Math.max(0, tapCountRef.current - 0.6);
            }
          } else {
            const variance = settings.aiVariance;
            const variation =
              Math.sin(frame * 0.04 + runners.indexOf(runner) * 1.7) * variance;
            const base = runner.maxSpeed * (0.72 + Math.random() * 0.28);
            runner.speed = base + variation;
          }

          runner.x += runner.speed;
          if (runner.speed > 0.5) {
            runner.frame = (runner.frame + runner.speed * 0.3) % 4;
          }

          if (runner.x >= FINISH_LINE) {
            runner.finished = true;
            runner.finishTime = elapsed;
            runner.x = FINISH_LINE;
          }
        });

        // Position — finished runners ranked by finishTime, then non-finished by x
        const sorted = [...runners].sort((a, b) => {
          if (a.finished && b.finished) return a.finishTime - b.finishTime;
          if (a.finished) return -1;
          if (b.finished) return -1;
          return b.x - a.x;
        });
        const pIdx = sorted.findIndex((r) => r.isPlayer);
        setPlayerPosition(pIdx + 1);

        // Finish check
        const player = runners.find((r) => r.isPlayer);
        if (player?.finished) {
          const won = pIdx === 0;
          setPlayerWon(won);
          setGamePhase('finished');
          if (won) {
            playWin();
            if (player.finishTime < bestTime) {
              setBestTime(player.finishTime);
              localStorage.setItem(
                'sprint-race-highscore',
                player.finishTime.toFixed(2),
              );
              setShowWin(true);
            }
          } else {
            playGameOver();
          }
        } else if (
          runners.filter((r) => !r.isPlayer).every((r) => r.finished)
        ) {
          if (elapsed > 20) {
            setPlayerWon(false);
            setGamePhase('finished');
            playGameOver();
          }
        }
      }

      // ---- Draw ----
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scaleX, scaleY);

      const FINISH = settings.finishX;

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, TRACK_TOP);
      skyGrad.addColorStop(0, '#4fc3f7');
      skyGrad.addColorStop(1, '#81d4fa');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, TRACK_TOP);

      // Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 170 + frame * 0.2) % (CANVAS_WIDTH + 100)) - 50;
        const cy = 20 + (i % 3) * 18;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 30, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crowd
      const crowdColors = ['#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8'];
      for (let i = 0; i < 80; i++) {
        const cx = (i * 37) % CANVAS_WIDTH;
        const cy = 50 + (i % 4) * 7 + Math.sin(frame * 0.12 + i) * 2;
        ctx.fillStyle = crowdColors[i % crowdColors.length];
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Track
      const trackGrad = ctx.createLinearGradient(
        0,
        TRACK_TOP,
        0,
        TRACK_TOP + laneH * numLanes,
      );
      trackGrad.addColorStop(0, '#e53935');
      trackGrad.addColorStop(0.5, '#d32f2f');
      trackGrad.addColorStop(1, '#c62828');
      ctx.fillStyle = trackGrad;
      ctx.fillRect(0, TRACK_TOP, CANVAS_WIDTH, laneH * numLanes);

      // Lane lines
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      for (let i = 0; i <= numLanes; i++) {
        ctx.beginPath();
        ctx.moveTo(0, TRACK_TOP + i * laneH);
        ctx.lineTo(CANVAS_WIDTH, TRACK_TOP + i * laneH);
        ctx.stroke();
      }

      // Track dashes
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.setLineDash([10, 10]);
      for (let x = 100; x < CANVAS_WIDTH; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, TRACK_TOP);
        ctx.lineTo(x, TRACK_TOP + laneH * numLanes);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Distance markers
      ctx.font = 'bold 10px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.textAlign = 'center';
      const trackLen = FINISH - START_X;
      const meterLabel = (translations[locale] || translations.en).meters;
      for (
        let m = 0;
        m <= settings.trackMeters;
        m += settings.trackMeters / 4
      ) {
        const mx = START_X + (m / settings.trackMeters) * trackLen;
        ctx.fillText(
          `${m}${meterLabel}`,
          mx,
          TRACK_TOP + laneH * numLanes + 12,
        );
      }

      // Start line
      ctx.fillStyle = '#fff';
      ctx.fillRect(START_X - 2, TRACK_TOP, 4, laneH * numLanes);

      // Finish line checker
      if (checkerPatternRef.current) {
        const pat = ctx.createPattern(checkerPatternRef.current, 'repeat');
        if (pat) {
          ctx.fillStyle = pat;
          ctx.fillRect(FINISH - 10, TRACK_TOP, 20, laneH * numLanes);
        }
      }

      // Runners
      runnersRef.current.forEach((runner) => {
        drawRunner(ctx, runner);
      });

      // Grass
      const grassGrad = ctx.createLinearGradient(
        0,
        TRACK_TOP + laneH * numLanes,
        0,
        canvasH,
      );
      grassGrad.addColorStop(0, '#66bb6a');
      grassGrad.addColorStop(1, '#43a047');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(
        0,
        TRACK_TOP + laneH * numLanes + 16,
        CANVAS_WIDTH,
        canvasH,
      );

      // Countdown overlay
      if (phase === 'countdown') {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, canvasH);
        ctx.font = 'bold 90px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cdT = translations[locale] || translations.en;
        const cdText =
          countdown === 3
            ? cdT.ready
            : countdown === 2
              ? cdT.set
              : countdown === 1
                ? '1'
                : cdT.go;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillText(cdText, CANVAS_WIDTH / 2 + 3, canvasH / 2 + 3);
        ctx.fillStyle = countdown === 0 ? '#76ff03' : '#fff';
        ctx.fillText(cdText, CANVAS_WIDTH / 2, canvasH / 2);
        ctx.textBaseline = 'alphabetic';
      }

      // Racing HUD
      if (phase === 'racing') {
        // Tap / speed bar
        const barW = 200;
        const barH = 18;
        const barX = CANVAS_WIDTH / 2 - barW / 2;
        const barY = canvasH - 30;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        (ctx as CanvasRenderingContext2D).roundRect(
          barX - 4,
          barY - 4,
          barW + 8,
          barH + 8,
          6,
        );
        ctx.fill();

        const fillW = (tapCountRef.current / 20) * barW;
        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        grad.addColorStop(0, '#4caf50');
        grad.addColorStop(0.5, '#ffeb3b');
        grad.addColorStop(1, '#f44336');
        ctx.fillStyle = grad;
        ctx.beginPath();
        (ctx as CanvasRenderingContext2D).roundRect(barX, barY, fillW, barH, 4);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        (ctx as CanvasRenderingContext2D).roundRect(barX, barY, barW, barH, 4);
        ctx.stroke();

        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        const tapLabel = (translations[locale] || translations.en).tapFast;
        ctx.fillText(tapLabel, CANVAS_WIDTH / 2, barY - 6);

        // Mini progress bar at top
        const progY = 6;
        const progW = CANVAS_WIDTH - 40;
        const progX = 20;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        (ctx as CanvasRenderingContext2D).roundRect(progX, progY, progW, 10, 5);
        ctx.fill();

        runnersRef.current.forEach((runner) => {
          const pct = Math.min(
            (runner.x - START_X) / (FINISH - START_X),
            1,
          );
          const px = progX + pct * progW;
          ctx.fillStyle = runner.color;
          ctx.beginPath();
          ctx.arc(px, progY + 5, 5, 0, Math.PI * 2);
          ctx.fill();
          if (runner.isPlayer) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      }

      ctx.restore();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase, countdown, bestTime, canvasWidth, drawRunner, locale, totalLanes, LANE_HEIGHT, CANVAS_HEIGHT]);

  // ---- Restart ----
  const restartGame = useCallback(() => {
    setShowWin(false);
    setGamePhase('menu');
  }, []);

  // ---- Derived ----
  const player = runnersRef.current.find((r) => r.isPlayer);
  const diffSettings = DIFFICULTY_SETTINGS[difficulty];
  const difficultyLabels: Record<Difficulty, string> = {
    easy: t.easy,
    medium: t.medium,
    hard: t.hard,
  };

  return (
    <GameWrapper title={t.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="flex flex-col items-center gap-4" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Stats bar */}
        <div className="flex flex-wrap justify-center gap-3 mb-1">
          <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center min-w-[90px]">
            <div className="text-xs text-slate-500 font-medium">{t.time}</div>
            <div className="text-xl font-bold text-[#d32f2f] font-mono">
              {raceTime.toFixed(2)}s
            </div>
          </div>
          <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center min-w-[90px]">
            <div className="text-xs text-slate-500 font-medium">{t.position}</div>
            <div className="text-xl font-bold text-[#4caf50]">
              {playerPosition > 0 ? `${playerPosition}/${totalLanes}` : '-'}
            </div>
          </div>
          <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center min-w-[90px]">
            <div className="text-xs text-slate-500 font-medium">{t.best}</div>
            <div className="text-xl font-bold text-[#ff9800] font-mono">
              {bestTime < 99 ? `${bestTime.toFixed(2)}s` : '-'}
            </div>
          </div>
          {gamePhase === 'racing' && (
            <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center min-w-[90px]">
              <div className="text-xs text-slate-500 font-medium">{t.difficulty}</div>
              <div className="text-xl font-bold" style={{ color: diffSettings.color }}>
                {diffSettings.emoji} {diffSettings.trackMeters}{t.meters}
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="relative w-full max-w-[720px]">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={CANVAS_HEIGHT}
            className="rounded-xl shadow-2xl border-4 border-[#d32f2f]/30 cursor-pointer w-full"
            style={{ touchAction: 'none' }}
          />

          <AnimatePresence>
            {/* ---- Difficulty selection menu ---- */}
            {gamePhase === 'menu' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl backdrop-blur-sm"
              >
                <motion.div
                  animate={{ x: [-8, 8, -8] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-5xl mb-3"
                >
                  🏃
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
                  {t.title}
                </h2>
                <p className="text-white/80 text-sm mb-4">{t.selectDifficulty}</p>

                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-white/80 text-sm font-medium">{t.opponents}:</span>
                  {Array.from({ length: MAX_OPPONENTS - MIN_OPPONENTS + 1 }, (_, i) => i + MIN_OPPONENTS).map((n) => (
                    <button
                      key={n}
                      onClick={() => { playClick(); setOpponentCount(n); }}
                      className={`w-7 h-7 rounded-full text-sm font-bold transition-transform hover:scale-110 ${
                        opponentCount === n
                          ? 'bg-white text-slate-800 scale-110'
                          : 'bg-white/20 text-white/90'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-white/80 text-sm font-medium">{t.playerColor}:</span>
                  {PLAYER_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => { playClick(); setPlayerColor(c.hex); }}
                      className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c.hex,
                        borderColor: playerColor === c.hex ? '#fff' : 'transparent',
                        transform: playerColor === c.hex ? 'scale(1.15)' : undefined,
                      }}
                      title={c.label}
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-2 w-[260px]">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
                    const s = DIFFICULTY_SETTINGS[d];
                    return (
                      <motion.button
                        key={d}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          playClick();
                          setDifficulty(d);
                          startRace(d);
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-bold text-lg shadow-lg transition-colors min-h-[48px]"
                        style={{ backgroundColor: s.color }}
                      >
                        <span>{s.emoji}</span>
                        <span>{difficultyLabels[d]}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ---- Finished overlay (not win-modal) ---- */}
            {gamePhase === 'finished' && !showWin && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl"
              >
                <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-xs mx-auto">
                  <div className="text-5xl mb-3">
                    {playerPosition === 1
                      ? '🥇'
                      : playerPosition === 2
                        ? '🥈'
                        : playerPosition === 3
                          ? '🥉'
                          : '🏃'}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {playerWon ? t.winner : t.youLost}
                  </h2>
                  <div className="text-lg text-slate-500 mb-1">
                    {t.position}: {playerPosition}/{totalLanes}
                  </div>
                  <div className="text-3xl font-bold text-[#d32f2f] mb-2 font-mono">
                    {player?.finishTime
                      ? `${player.finishTime.toFixed(2)}s`
                      : raceTime.toFixed(2) + 's'}
                  </div>
                  {player?.finishTime !== undefined &&
                    player.finishTime > 0 &&
                    player.finishTime <= bestTime && (
                      <div className="text-base text-[#ff9800] font-bold mb-3">
                        {t.newBest}
                      </div>
                    )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      playClick();
                      restartGame();
                    }}
                    className="px-8 py-3 bg-[#d32f2f] hover:bg-[#b71c1c] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    {t.tryAgain}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Big tap button for mobile (only during racing) */}
        {gamePhase === 'racing' && (
          <motion.button
            whileTap={{ scale: 0.9, backgroundColor: '#b71c1c' }}
            onPointerDown={(e) => {
              e.preventDefault();
              handleTap();
            }}
            className="w-full max-w-[400px] py-6 bg-[#d32f2f] hover:bg-[#c62828] text-white text-2xl font-bold rounded-2xl shadow-xl active:shadow-md transition-shadow select-none min-h-[64px]"
            style={{ touchAction: 'none' }}
          >
            {t.sprint} 🏃💨
          </motion.button>
        )}

        {/* Control hints */}
        <div className="flex flex-wrap justify-center gap-3 text-slate-600 text-sm">
          <span className="px-3 py-1 bg-white/80 rounded-full">{t.clickFast}</span>
          <span className="px-3 py-1 bg-white/80 rounded-full">{t.keyboard}</span>
          <span className="px-3 py-1 bg-white/80 rounded-full">{t.tapRapidly}</span>
        </div>
      </div>

      {/* Win Modal */}
      <WinModal
        isOpen={showWin}
        onClose={() => setShowWin(false)}
        onPlayAgain={() => {
          playClick();
          restartGame();
        }}
        score={Math.round((15 - (player?.finishTime || 15)) * 100)}
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