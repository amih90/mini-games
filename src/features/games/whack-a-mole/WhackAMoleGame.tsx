'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { useTranslations } from 'next-intl';
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

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 540;
const GRID_COLS = 3;
const GRID_ROWS = 3;
const HOLE_RADIUS = 58;
const MOLE_RADIUS = 44;
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
  const t = useTranslations('whackAMole');
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;

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
    // Evenly divide the canvas into a 3×3 grid so holes are large and well-spaced
    const colSpacing = CANVAS_WIDTH / GRID_COLS;   // 200 px
    const rowSpacing = CANVAS_HEIGHT / (GRID_ROWS + 1); // 135 px
    return {
      x: colSpacing * (col + 0.5),
      y: rowSpacing * (row + 1),
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
        missAnimationRef.current('time')--;
        if (missAnimationRef.current('time') <= 0) missAnimationRef.current = null;
      }

      // ========== DRAW ==========

      // ── Background: sky → horizon → rich grass ──
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT * 0.38);
      skyGrad.addColorStop(0, '#5bbfe8');
      skyGrad.addColorStop(1, '#b5e0f5');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.38);

      const grassGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT * 0.38, 0, CANVAS_HEIGHT);
      grassGrad.addColorStop(0, '#5dc95d');
      grassGrad.addColorStop(0.5, '#3da83d');
      grassGrad.addColorStop(1, '#2a7a2a');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, CANVAS_HEIGHT * 0.38, CANVAS_WIDTH, CANVAS_HEIGHT * 0.62);

      // Horizon band
      ctx.fillStyle = '#4ec44e';
      ctx.fillRect(0, CANVAS_HEIGHT * 0.36, CANVAS_WIDTH, CANVAS_HEIGHT * 0.06);

      // Grass blades
      ctx.fillStyle = '#1f6e1f';
      for (let i = 0; i < 90; i++) {
        const gx = ((i * 23 + frameCountRef.current * 0.3) % CANVAS_WIDTH);
        const gy = CANVAS_HEIGHT * 0.38 + ((i * 31) % (CANVAS_HEIGHT * 0.56));
        ctx.fillRect(gx, gy, 2, 9);
      }

      // Small clouds
      const drawCloud = (cx: number, cy: number, r: number) => {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (const [dx, dy, dr] of [[-r*0.6,0,r*0.65],[0,-r*0.3,r],[r*0.6,0,r*0.65],[0,r*0.1,r*0.7]] as [number,number,number][]) {
          ctx.beginPath();
          ctx.arc(cx+dx, cy+dy, dr, 0, Math.PI*2);
          ctx.fill();
        }
      };
      drawCloud(80, 38, 22);
      drawCloud(320, 25, 28);
      drawCloud(530, 42, 20);

      // --- Holes & moles ---
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const pos = getHolePosition(row, col);

          // Dirt platform behind hole
          ctx.fillStyle = '#8B5e3c';
          ctx.beginPath();
          ctx.ellipse(pos.x, pos.y + 18, HOLE_RADIUS + 14, HOLE_RADIUS * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#a06840';
          ctx.beginPath();
          ctx.ellipse(pos.x, pos.y + 16, HOLE_RADIUS + 10, HOLE_RADIUS * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();

          // Deep hole shadow
          ctx.fillStyle = '#111';
          ctx.beginPath();
          ctx.ellipse(pos.x, pos.y + 4, HOLE_RADIUS - 2, HOLE_RADIUS * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();

          // Hole rim highlight
          ctx.strokeStyle = '#5a3015';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(pos.x, pos.y, HOLE_RADIUS, HOLE_RADIUS * 0.42, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Hole
          ctx.fillStyle = '#2a1a0a';
          ctx.beginPath();
          ctx.ellipse(pos.x, pos.y, HOLE_RADIUS - 3, (HOLE_RADIUS - 3) * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();

          // Mole
          const mole = molesRef.current.find(
            (m) => m.row === row && m.col === col && (m.visible || m.hitAnimation > 0)
          );
          if (mole) {
            const maxPop = HOLE_RADIUS * 0.88;
            // Instant pop-up; sink smoothly in last 14 frames
            const popUpHeight =
              mole.hitAnimation > 0
                ? -12
                : mole.showTime <= 14
                  ? Math.max(0, (mole.showTime / 14) * maxPop)
                  : maxPop;

            ctx.save();
            ctx.translate(pos.x, pos.y - popUpHeight);

            const R = MOLE_RADIUS;
            if (mole.type === 'bomb') {
              // Bomb body with gradient
              const bombGrad = ctx.createRadialGradient(-R*0.25, -R*0.9, R*0.05, 0, -R*0.7, R);
              bombGrad.addColorStop(0, '#555');
              bombGrad.addColorStop(0.4, '#111');
              bombGrad.addColorStop(1, '#000');
              ctx.fillStyle = bombGrad;
              ctx.beginPath();
              ctx.arc(0, -R*0.55, R - 4, 0, Math.PI * 2);
              ctx.fill();
              // Highlight
              ctx.fillStyle = 'rgba(255,255,255,0.18)';
              ctx.beginPath();
              ctx.ellipse(-R*0.28, -R*0.9, R*0.32, R*0.22, -0.5, 0, Math.PI*2);
              ctx.fill();
              // Fuse
              ctx.strokeStyle = '#c8a02a';
              ctx.lineWidth = 3.5;
              ctx.beginPath();
              ctx.moveTo(2, -R*1.1);
              ctx.quadraticCurveTo(14, -R*1.4, 8, -R*1.65);
              ctx.stroke();
              // Spark
              if (frameCountRef.current % 10 < 5) {
                ctx.fillStyle = '#ff4400';
                ctx.beginPath(); ctx.arc(8, -R*1.65, 5, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath(); ctx.arc(8, -R*1.65, 3, 0, Math.PI*2); ctx.fill();
              }
              // ☠ text
              ctx.fillStyle = '#fff';
              ctx.font = `bold ${R}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('💣', 0, -R*0.55);
            } else {
              const isGolden = mole.type === 'golden';
              // Body
              const bodyGrad = ctx.createRadialGradient(-R*0.2, -R*0.9, R*0.1, 0, -R*0.6, R*1.1);
              bodyGrad.addColorStop(0, isGolden ? '#ffe566' : '#c4774a');
              bodyGrad.addColorStop(0.5, isGolden ? '#d4a017' : '#8B4513');
              bodyGrad.addColorStop(1, isGolden ? '#a07800' : '#5a2d0c');
              ctx.fillStyle = bodyGrad;
              ctx.beginPath();
              ctx.arc(0, -R*0.6, R - 4, 0, Math.PI * 2);
              ctx.fill();

              // Ears
              ctx.fillStyle = isGolden ? '#d4a017' : '#8B4513';
              ctx.beginPath();
              ctx.arc(-R*0.52, -R*1.0, R*0.27, 0, Math.PI * 2);
              ctx.arc( R*0.52, -R*1.0, R*0.27, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ffb6c1';
              ctx.beginPath();
              ctx.arc(-R*0.52, -R*1.0, R*0.14, 0, Math.PI * 2);
              ctx.arc( R*0.52, -R*1.0, R*0.14, 0, Math.PI * 2);
              ctx.fill();

              // Snout
              ctx.fillStyle = isGolden ? '#f0c050' : '#c09060';
              ctx.beginPath();
              ctx.ellipse(0, -R*0.42, R*0.48, R*0.34, 0, 0, Math.PI * 2);
              ctx.fill();

              // Eyes (white)
              ctx.fillStyle = '#fff';
              ctx.beginPath();
              ctx.arc(-R*0.33, -R*0.75, R*0.22, 0, Math.PI * 2);
              ctx.arc( R*0.33, -R*0.75, R*0.22, 0, Math.PI * 2);
              ctx.fill();
              // Pupils
              ctx.fillStyle = '#111';
              ctx.beginPath();
              ctx.arc(-R*0.33, -R*0.75, R*0.12, 0, Math.PI * 2);
              ctx.arc( R*0.33, -R*0.75, R*0.12, 0, Math.PI * 2);
              ctx.fill();
              // Eye shine
              ctx.fillStyle = '#fff';
              ctx.beginPath();
              ctx.arc(-R*0.27, -R*0.8, R*0.05, 0, Math.PI * 2);
              ctx.arc( R*0.39, -R*0.8, R*0.05, 0, Math.PI * 2);
              ctx.fill();

              // Nose
              ctx.fillStyle = '#e8508a';
              ctx.beginPath();
              ctx.ellipse(0, -R*0.52, R*0.18, R*0.12, 0, 0, Math.PI * 2);
              ctx.fill();

              // Whiskers
              ctx.strokeStyle = 'rgba(80,40,10,0.6)';
              ctx.lineWidth = 1.5;
              for (let w = -1; w <= 1; w += 2) {
                ctx.beginPath();
                ctx.moveTo(w*R*0.18, -R*0.42);
                ctx.lineTo(w*R*0.95, -R*0.38 + w*R*0.06);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(w*R*0.18, -R*0.3);
                ctx.lineTo(w*R*0.9, -R*0.18);
                ctx.stroke();
              }

              // Teeth
              ctx.fillStyle = '#fffff0';
              ctx.fillRect(-R*0.16, -R*0.22, R*0.13, R*0.18);
              ctx.fillRect( R*0.03, -R*0.22, R*0.13, R*0.18);

              // Crown for golden
              if (isGolden) {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.moveTo(-R*0.45, -R*1.2);
                ctx.lineTo(-R*0.3, -R*1.55);
                ctx.lineTo(-R*0.0, -R*1.28);
                ctx.lineTo( R*0.3, -R*1.55);
                ctx.lineTo( R*0.45, -R*1.2);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#cc8800';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Gem on crown
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.arc(0, -R*1.32, R*0.09, 0, Math.PI*2);
                ctx.fill();
              }

              // Body highlight
              ctx.fillStyle = `rgba(255,255,255,0.12)`;
              ctx.beginPath();
              ctx.ellipse(-R*0.2, -R*0.85, R*0.3, R*0.18, -0.4, 0, Math.PI*2);
              ctx.fill();
            }

            // Hit stars burst
            if (mole.hitAnimation > 0) {
              const age = 15 - mole.hitAnimation;
              for (let s = 0; s < 8; s++) {
                const angle = (s / 8) * Math.PI * 2;
                const dist = age * 4.5;
                const sx = Math.cos(angle) * dist;
                const sy = Math.sin(angle) * dist - MOLE_RADIUS * 0.5;
                const alpha = mole.hitAnimation / 15;
                ctx.fillStyle = s % 2 === 0 ? `rgba(255,220,0,${alpha})` : `rgba(255,120,30,${alpha})`;
                ctx.beginPath();
                ctx.arc(sx, sy, 5 + age * 0.3, 0, Math.PI * 2);
                ctx.fill();
              }
              // ★ text
              ctx.globalAlpha = Math.min(1, mole.hitAnimation / 6);
              ctx.fillStyle = '#fff700';
              ctx.font = `bold ${20 + age}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('✦', 0, -MOLE_RADIUS - age * 2);
              ctx.globalAlpha = 1;
            }

            ctx.restore();
          }

          // Keyboard hint number
          const holeIndex = row * GRID_COLS + col + 1;
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.font = `bold 16px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(holeIndex), pos.x, pos.y + 6);
        }
      }

      // Miss text
      if (missAnimationRef.current) {
        const missT = t('miss');
        ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          missT,
          missAnimationRef.current.x,
          missAnimationRef.current.y - (20 - missAnimationRef.current('time'))
        );
      }

      // Hammer cursor — bigger and more visible
      ctx.save();
      ctx.translate(hammerPosRef.current.x, hammerPosRef.current.y);
      const swingAngle = (hammerSwingRef.current > 0 ? -0.6 : 0.25) + Math.PI / 4;
      ctx.rotate(swingAngle);
      // Handle
      ctx.fillStyle = '#6b3a0f';
      ctx.beginPath();
      ctx.roundRect(-6, 2, 12, 58, 4);
      ctx.fill();
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.roundRect(-5, 2, 10, 56, 3);
      ctx.fill();
      // Head
      const headGrad = ctx.createLinearGradient(-24, -20, 24, 20);
      headGrad.addColorStop(0, '#999');
      headGrad.addColorStop(0.4, '#ddd');
      headGrad.addColorStop(1, '#555');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.roundRect(-24, -22, 48, 28, 5);
      ctx.fill();
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Head top shine
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.roundRect(-22, -20, 44, 6, 3);
      ctx.fill();
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
    <GameWrapper title={t('title')} onInstructionsClick={() => setShowInstructions(true)}>
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

              <h2 className="text-3xl font-bold text-slate-800 text-center">{t('title')}</h2>
              <p className="text-lg font-semibold text-slate-600 text-center">
                {t('selectDifficulty')}
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
                  {t('highScore')}: <span className="font-bold text-[#f97316]">{highScore}</span>
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
                <div className="text-sm text-slate-500 font-medium">{t('score')}</div>
                <div className="text-2xl font-bold text-[#8B4513]">{score}</div>
              </div>
              <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center">
                <div className="text-sm text-slate-500 font-medium">{t('time')}</div>
                <div
                  className={`text-2xl font-bold ${
                    timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-[#3b82f6]'
                  }`}
                >
                  {timeLeft}s
                </div>
              </div>
              <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center">
                <div className="text-sm text-slate-500 font-medium">{t('combo')}</div>
                <div className="text-2xl font-bold text-[#a855f7]">
                  x{Math.min(combo, 5)}
                </div>
              </div>
              <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center">
                <div className="text-sm text-slate-500 font-medium">{t('highScore')}</div>
                <div className="text-2xl font-bold text-[#f97316]">{highScore}</div>
              </div>
            </div>

            {/* Canvas */}
            <div className="relative w-full" style={{ maxWidth: CANVAS_WIDTH }}>
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="rounded-2xl shadow-2xl border-4 border-[#5a3010]/40 w-full h-auto"
                style={{ touchAction: 'none', cursor: 'none' }}
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 text-slate-600 text-sm">
              <span className="px-3 py-1 bg-white/80 rounded-full">{t('molePoints')}</span>
              <span className="px-3 py-1 bg-white/80 rounded-full">{t('goldenPoints')}</span>
              {difficulty !== 'easy' && (
                <span className="px-3 py-1 bg-white/80 rounded-full">{t('bombPoints')}</span>
              )}
              <span className="px-3 py-1 bg-white/80 rounded-full">{t('combo')Points}</span>
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
                <h2 className="text-2xl font-bold text-slate-800 mb-3">{t('gameOver')}</h2>
                <div className="text-4xl font-bold text-[#8B4513] mb-2">{score}</div>
                {isNewHighScore && (
                  <div className="text-lg text-[#f97316] font-bold mb-3">{t('newHighScore')}</div>
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
                    {t('playAgain')}
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
                    {t('selectDifficulty')}
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
        title={t('title')}
        instructions={[
          { icon: t('instructions.step0Icon'), title: t('instructions.step0Title'), description: t('instructions.step0Desc') },
          { icon: t('instructions.step1Icon'), title: t('instructions.step1Title'), description: t('instructions.step1Desc') },
          { icon: t('instructions.step2Icon'), title: t('instructions.step2Title'), description: t('instructions.step2Desc') },
          { icon: t('instructions.step3Icon'), title: t('instructions.step3Title'), description: t('instructions.step3Desc') },
        ]}
        controls={[
          { icon: t('instructions.control0Icon'), description: t('instructions.control0Desc') },
          { icon: t('instructions.control1Icon'), description: t('instructions.control1Desc') },
          { icon: t('instructions.control2Icon'), description: t('instructions.control2Desc') },
        ]}
        tip={t('instructions.tip')}
        locale={locale}
      />
    </GameWrapper>
  );
}
