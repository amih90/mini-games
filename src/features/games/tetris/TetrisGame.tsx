'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { TextDirection } from '@/i18n/routing';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 28;
const PREVIEW_CELL_SIZE = 18;
const WIN_SCORE = 1000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type CellValue = 0 | string;
type Board = CellValue[][];
type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'menu' | 'idle' | 'playing' | 'paused' | 'gameover';

interface Position {
  x: number;
  y: number;
}

interface Tetromino {
  shape: number[][];
  color: string;
}

interface DifficultySettings {
  baseDropInterval: number;
  previewCount: number;
  scoreMultiplier: number;
  levelSpeedReduction: number;
}

// ---------------------------------------------------------------------------
// Difficulty settings
// ---------------------------------------------------------------------------
const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy:   { baseDropInterval: 1200, previewCount: 3, scoreMultiplier: 1,   levelSpeedReduction: 80  },
  medium: { baseDropInterval: 900,  previewCount: 2, scoreMultiplier: 1.5, levelSpeedReduction: 90  },
  hard:   { baseDropInterval: 600,  previewCount: 1, scoreMultiplier: 2,   levelSpeedReduction: 100 },
};

// ---------------------------------------------------------------------------
// Tetrominoes
// ---------------------------------------------------------------------------
const TETROMINOES: Record<string, Tetromino> = {
  I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#00f5ff' },
  O: { shape: [[1,1],[1,1]], color: '#ffdd00' },
  T: { shape: [[0,1,0],[1,1,1],[0,0,0]], color: '#a855f7' },
  S: { shape: [[0,1,1],[1,1,0],[0,0,0]], color: '#22c55e' },
  Z: { shape: [[1,1,0],[0,1,1],[0,0,0]], color: '#ef4444' },
  J: { shape: [[1,0,0],[1,1,1],[0,0,0]], color: '#3b82f6' },
  L: { shape: [[0,0,1],[1,1,1],[0,0,0]], color: '#f97316' },
};

const TETROMINO_KEYS = Object.keys(TETROMINOES);



// ---------------------------------------------------------------------------
// Helpers (outside component – no hook dependencies)
// ---------------------------------------------------------------------------
function createEmptyBoard(): Board {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array<CellValue>(BOARD_WIDTH).fill(0));
}

function getRandomTetromino(): Tetromino {
  const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
  return TETROMINOES[key];
}

function fillNextPieces(count: number): Tetromino[] {
  const pieces: Tetromino[] = [];
  for (let i = 0; i < count; i++) {
    pieces.push(getRandomTetromino());
  }
  return pieces;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface TetrisGameProps {
  locale?: string;
}

export default function TetrisGame({ locale = 'en' }: TetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastDropRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const boardRef = useRef<Board>(createEmptyBoard());
  const currentPieceRef = useRef<{ tetromino: Tetromino; position: Position } | null>(null);
  const nextPiecesRef = useRef<Tetromino[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const difficultyRef = useRef<Difficulty>('medium');

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tetris-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [showWin, setShowWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const { playClick, playSuccess, playLevelUp, playGameOver, playHit, playPowerUp, playWin, playMove, playWhoosh } = useRetroSounds();

  const t = useTranslations('tetris');
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const settings = difficulty ? DIFFICULTY_SETTINGS[difficulty] : DIFFICULTY_SETTINGS.medium;
  const previewCount = settings.previewCount;
  const previewCanvasHeight = previewCount * 4 * PREVIEW_CELL_SIZE;

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { if (difficulty) difficultyRef.current = difficulty; }, [difficulty]);

  const checkCollision = useCallback((board: Board, shape: number[][], position: Position): boolean => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = position.x + x;
          const newY = position.y + y;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return true;
          if (newY >= 0 && board[newY][newX]) return true;
        }
      }
    }
    return false;
  }, []);

  const spawnPiece = useCallback(() => {
    const queue = nextPiecesRef.current;
    const tetromino = queue.length > 0 ? queue.shift()! : getRandomTetromino();
    queue.push(getRandomTetromino());
    nextPiecesRef.current = [...queue];
    const position: Position = { x: Math.floor((BOARD_WIDTH - tetromino.shape[0].length) / 2), y: 0 };
    if (checkCollision(boardRef.current, tetromino.shape, position)) {
      setGameState('gameover');
      playGameOver();
      const cs = scoreRef.current;
      if (cs > 0) {
        setHighScore((prev) => {
          if (cs > prev) { localStorage.setItem('tetris-highscore', String(cs)); return cs; }
          return prev;
        });
        if (cs >= WIN_SCORE) { setShowWin(true); playWin(); }
      }
      return;
    }
    currentPieceRef.current = { tetromino, position };
  }, [checkCollision, playGameOver, playWin]);

  const movePiece = useCallback((dx: number, dy: number): boolean => {
    const piece = currentPieceRef.current;
    if (!piece) return false;
    const newPos = { x: piece.position.x + dx, y: piece.position.y + dy };
    if (!checkCollision(boardRef.current, piece.tetromino.shape, newPos)) {
      currentPieceRef.current = { ...piece, position: newPos };
      return true;
    }
    return false;
  }, [checkCollision]);

  const rotatePiece = useCallback(() => {
    const piece = currentPieceRef.current;
    if (!piece) return;
    const { tetromino, position } = piece;
    const rotated = tetromino.shape[0].map((_, i) => tetromino.shape.map((row) => row[i]).reverse());
    for (const kick of [0, -1, 1, -2, 2]) {
      const newPos = { ...position, x: position.x + kick };
      if (!checkCollision(boardRef.current, rotated, newPos)) {
        currentPieceRef.current = { tetromino: { ...tetromino, shape: rotated }, position: newPos };
        playClick();
        return;
      }
    }
  }, [checkCollision, playClick]);

  const hardDrop = useCallback(() => {
    const piece = currentPieceRef.current;
    if (!piece) return;
    let d = 0;
    while (movePiece(0, 1)) d++;
    const mult = DIFFICULTY_SETTINGS[difficultyRef.current].scoreMultiplier;
    setScore((s) => s + Math.floor(d * 2 * mult));
    playWhoosh();
  }, [movePiece, playWhoosh]);

  const lockPiece = useCallback(() => {
    const piece = currentPieceRef.current;
    if (!piece) return;

    const { tetromino, position } = piece;
    const board = boardRef.current;

    // Place piece on board
    for (let y = 0; y < tetromino.shape.length; y++) {
      for (let x = 0; x < tetromino.shape[y].length; x++) {
        if (tetromino.shape[y][x]) {
          const boardY = position.y + y;
          const boardX = position.x + x;
          if (boardY >= 0) {
            board[boardY][boardX] = tetromino.color;
          }
        }
      }
    }

    playHit();

    // Clear completed lines
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (board[y].every((cell) => cell !== 0)) {
        board.splice(y, 1);
        board.unshift(Array<CellValue>(BOARD_WIDTH).fill(0));
        linesCleared++;
        y++; // re-check same row index
      }
    }

    if (linesCleared > 0) {
      const basePoints = [0, 100, 300, 500, 800][linesCleared];
      const mult =
        DIFFICULTY_SETTINGS[difficultyRef.current].scoreMultiplier;
      const points = Math.floor(basePoints * levelRef.current * mult);

      setScore((s) => s + points);

      setLines((l) => {
        const newLines = l + linesCleared;
        const newLevel = Math.floor(newLines / 10) + 1;
        if (newLevel > levelRef.current) {
          setLevel(newLevel);
          levelRef.current = newLevel;
          playLevelUp();
        }
        return newLines;
      });

      if (linesCleared >= 4) {
        playPowerUp(); // Tetris!
      } else {
        playSuccess();
      }
    }

    currentPieceRef.current = null;
    spawnPiece();
  }, [spawnPiece, playHit, playSuccess, playPowerUp, playLevelUp]);

  const selectDifficulty = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    difficultyRef.current = diff;
    setGameState('idle');
    playClick();
  }, [playClick]);

  const startGame = useCallback(() => {
    const diff = difficultyRef.current;
    const s = DIFFICULTY_SETTINGS[diff];

    setGameState('playing');
    setScore(0);
    setLevel(1);
    setLines(0);
    scoreRef.current = 0;
    levelRef.current = 1;
    boardRef.current = createEmptyBoard();
    nextPiecesRef.current = fillNextPieces(s.previewCount);
    currentPieceRef.current = null;
    lastDropRef.current = 0;
    spawnPiece();
    playClick();
  }, [spawnPiece, playClick]);

  const restartGame = useCallback(() => {
    setGameState('idle');
    setScore(0);
    setLevel(1);
    setLines(0);
    scoreRef.current = 0;
    levelRef.current = 1;
  }, []);

  const backToMenu = useCallback(() => {
    setGameState('menu');
    setDifficulty(null);
    setScore(0);
    setLevel(1);
    setLines(0);
    scoreRef.current = 0;
    levelRef.current = 1;
  }, []);

  usePlayAgainKey(gameState === 'gameover' && !showWin, restartGame);

  // --------------------------------------------------------------------------
  // Drawing helpers
  // --------------------------------------------------------------------------
  const drawCell = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: string,
      cellSize: number,
    ) => {
      const padding = 2;
      const cellX = x * cellSize + padding;
      const cellY = y * cellSize + padding;
      const size = cellSize - padding * 2;

      ctx.fillStyle = color;
      ctx.fillRect(cellX, cellY, size, size);

      // Highlight (top-left)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(cellX, cellY, size, 4);
      ctx.fillRect(cellX, cellY, 4, size);

      // Shadow (bottom-right)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(cellX, cellY + size - 4, size, 4);
      ctx.fillRect(cellX + size - 4, cellY, 4, size);
    },
    [],
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const width = BOARD_WIDTH * CELL_SIZE;
      const height = BOARD_HEIGHT * CELL_SIZE;

      // Background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = '#2a2a4e';
      ctx.lineWidth = 1;
      for (let x = 0; x <= BOARD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, height);
        ctx.stroke();
      }
      for (let y = 0; y <= BOARD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(width, y * CELL_SIZE);
        ctx.stroke();
      }

      // Locked cells
      const board = boardRef.current;
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          if (board[y][x]) {
            drawCell(ctx, x, y, board[y][x] as string, CELL_SIZE);
          }
        }
      }

      // Current piece + ghost
      const piece = currentPieceRef.current;
      if (piece) {
        // Ghost piece (landing preview)
        let ghostY = piece.position.y;
        while (
          !checkCollision(board, piece.tetromino.shape, {
            x: piece.position.x,
            y: ghostY + 1,
          })
        ) {
          ghostY++;
        }

        ctx.globalAlpha = 0.3;
        for (let py = 0; py < piece.tetromino.shape.length; py++) {
          for (let px = 0; px < piece.tetromino.shape[py].length; px++) {
            if (piece.tetromino.shape[py][px]) {
              drawCell(
                ctx,
                piece.position.x + px,
                ghostY + py,
                piece.tetromino.color,
                CELL_SIZE,
              );
            }
          }
        }
        ctx.globalAlpha = 1;

        // Active piece
        for (let py = 0; py < piece.tetromino.shape.length; py++) {
          for (let px = 0; px < piece.tetromino.shape[py].length; px++) {
            if (piece.tetromino.shape[py][px]) {
              drawCell(
                ctx,
                piece.position.x + px,
                piece.position.y + py,
                piece.tetromino.color,
                CELL_SIZE,
              );
            }
          }
        }
      }
    },
    [checkCollision, drawCell],
  );

  const drawPreview = useCallback(
    (ctx: CanvasRenderingContext2D, count: number) => {
      const canvasWidth = 4 * PREVIEW_CELL_SIZE;
      const canvasHeight = count * 4 * PREVIEW_CELL_SIZE;

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const queue = nextPiecesRef.current;
      for (let i = 0; i < Math.min(count, queue.length); i++) {
        const piece = queue[i];
        const slotY = i * 4 * PREVIEW_CELL_SIZE;
        const offsetX =
          (canvasWidth - piece.shape[0].length * PREVIEW_CELL_SIZE) / 2;
        const offsetY =
          slotY +
          (4 * PREVIEW_CELL_SIZE - piece.shape.length * PREVIEW_CELL_SIZE) /
            2;

        for (let y = 0; y < piece.shape.length; y++) {
          for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
              const cellX = offsetX + x * PREVIEW_CELL_SIZE + 2;
              const cellY = offsetY + y * PREVIEW_CELL_SIZE + 2;
              const size = PREVIEW_CELL_SIZE - 4;

              ctx.fillStyle = piece.color;
              ctx.fillRect(cellX, cellY, size, size);

              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.fillRect(cellX, cellY, size, 2);
              ctx.fillRect(cellX, cellY, 2, size);
            }
          }
        }

        // Separator between preview slots
        if (i < count - 1) {
          ctx.strokeStyle = '#3a3a5e';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(4, slotY + 4 * PREVIEW_CELL_SIZE - 1);
          ctx.lineTo(canvasWidth - 4, slotY + 4 * PREVIEW_CELL_SIZE - 1);
          ctx.stroke();
        }
      }
    },
    [],
  );

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'menu') return;

      if (gameState !== 'playing') {
        if (e.code === 'Space' && gameState === 'idle') {
          e.preventDefault();
          startGame();
        }
        if (e.code === 'Space' && gameState === 'paused') {
          e.preventDefault();
          setGameState('playing');
        }
        return;
      }

      keysRef.current.add(e.code);

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          movePiece(-1, 0);
          playMove();
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          movePiece(1, 0);
          playMove();
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          if (movePiece(0, 1)) {
            const mult =
              DIFFICULTY_SETTINGS[difficultyRef.current].scoreMultiplier;
            setScore((s) => s + Math.floor(1 * mult));
          }
          break;
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          rotatePiece();
          break;
        case 'Space':
          e.preventDefault();
          hardDrop();
          break;
        case 'KeyP':
        case 'Escape':
          e.preventDefault();
          setGameState('paused');
          break;
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
  }, [gameState, startGame, movePiece, rotatePiece, hardDrop, playMove]);

  // Touch swipe input on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;
      const minSwipe = 30;
      touchStartRef.current = null;

      if (gameState === 'idle') {
        startGame();
        return;
      }
      if (gameState === 'paused') {
        setGameState('playing');
        return;
      }
      if (gameState !== 'playing') return;

      // Tap (short, small movement) → rotate
      if (
        Math.abs(dx) < minSwipe &&
        Math.abs(dy) < minSwipe &&
        elapsed < 300
      ) {
        rotatePiece();
        return;
      }

      // Horizontal swipe
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > minSwipe) {
          movePiece(1, 0);
          playMove();
        } else if (dx < -minSwipe) {
          movePiece(-1, 0);
          playMove();
        }
      } else {
        // Vertical swipe
        if (dy > minSwipe * 2) {
          hardDrop();
        } else if (dy > minSwipe) {
          movePiece(0, 1);
        }
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState, startGame, movePiece, rotatePiece, hardDrop, playMove]);

  // Mouse click on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = () => {
      if (gameState === 'idle') startGame();
      else if (gameState === 'playing') rotatePiece();
      else if (gameState === 'paused') setGameState('playing');
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [gameState, startGame, rotatePiece]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas) return;
    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    if (!ctx || !previewCtx) return;

    const diff = difficultyRef.current;
    const s = DIFFICULTY_SETTINGS[diff];

    const gameLoop = (timestamp: number) => {
      const dropInterval = Math.max(
        100,
        s.baseDropInterval - (levelRef.current - 1) * s.levelSpeedReduction,
      );

      if (timestamp - lastDropRef.current > dropInterval) {
        if (!movePiece(0, 1)) {
          lockPiece();
        }
        lastDropRef.current = timestamp;
      }

      draw(ctx);
      drawPreview(previewCtx, s.previewCount);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, movePiece, lockPiece, draw, drawPreview]);

  // Draw idle / static screen
  useEffect(() => {
    if (gameState !== 'idle') return;

    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas) return;
    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    if (!ctx || !previewCtx) return;

    const width = BOARD_WIDTH * CELL_SIZE;
    const height = BOARD_HEIGHT * CELL_SIZE;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 1;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, height);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(width, y * CELL_SIZE);
      ctx.stroke();
    }

    // Sample decorative pieces
    const samplePieces = ['T', 'I', 'O', 'S'];
    samplePieces.forEach((key, i) => {
      const piece = TETROMINOES[key];
      const startY = 14 + i * 2;
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            drawCell(ctx, 1 + i * 2 + x, startY + y, piece.color, CELL_SIZE);
          }
        }
      }
    });

    const pc = DIFFICULTY_SETTINGS[difficultyRef.current].previewCount;
    drawPreview(previewCtx, pc);
  }, [gameState, drawCell, drawPreview]);

  // --------------------------------------------------------------------------
  // Mobile control handlers
  // --------------------------------------------------------------------------
  const onMobileLeft = useCallback(() => {
    if (gameState === 'playing') {
      movePiece(-1, 0);
      playMove();
    }
  }, [gameState, movePiece, playMove]);

  const onMobileRight = useCallback(() => {
    if (gameState === 'playing') {
      movePiece(1, 0);
      playMove();
    }
  }, [gameState, movePiece, playMove]);

  const onMobileDown = useCallback(() => {
    if (gameState === 'playing') {
      movePiece(0, 1);
    }
  }, [gameState, movePiece]);

  const onMobileRotate = useCallback(() => {
    if (gameState === 'playing') rotatePiece();
  }, [gameState, rotatePiece]);

  const onMobileHardDrop = useCallback(() => {
    if (gameState === 'playing') hardDrop();
  }, [gameState, hardDrop]);

  // --------------------------------------------------------------------------
  // Render – Difficulty selection menu
  // --------------------------------------------------------------------------
  if (gameState === 'menu') {
    return (
      <GameWrapper
        title={t('title')}
        onInstructionsClick={() => setShowInstructions(true)}
      >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl mb-6"
          >
            🧱
          </motion.div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            {t('title')}
          </h2>
          <p className="text-slate-500 mb-8">{t('selectDifficulty')}</p>

          <div className="flex flex-col sm:flex-row gap-4">
            {(
              [
                {
                  key: 'easy' as Difficulty,
                  label: t('easy'),
                  desc: t('easyDesc'),
                  gradient: 'from-green-400 to-green-600',
                },
                {
                  key: 'medium' as Difficulty,
                  label: t('medium'),
                  desc: t('mediumDesc'),
                  gradient: 'from-yellow-400 to-yellow-600',
                },
                {
                  key: 'hard' as Difficulty,
                  label: t('hard'),
                  desc: t('hardDesc'),
                  gradient: 'from-red-400 to-red-600',
                },
              ] as const
            ).map((d) => (
              <motion.button
                key={d.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectDifficulty(d.key)}
                className={`px-8 py-4 bg-gradient-to-b ${d.gradient} text-white font-bold text-lg rounded-2xl shadow-lg min-w-[160px] min-h-[48px]`}
              >
                <div>{d.label}</div>
                <div className="text-sm font-normal opacity-80 mt-1">
                  {d.desc}
                </div>
              </motion.button>
            ))}
          </div>

          {highScore > 0 && (
            <div className="mt-6 text-slate-500 text-sm">
              {t('highScore')}:{' '}
              <span className="font-bold text-[#ec4399]">{highScore}</span>
            </div>
          )}

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
            { icon: t('instructions.control3Icon'), description: t('instructions.control3Desc') },
            { icon: t('instructions.control4Icon'), description: t('instructions.control4Desc') },
            { icon: t('instructions.control5Icon'), description: t('instructions.control5Desc') },
            { icon: t('instructions.control6Icon'), description: t('instructions.control6Desc') },
          ]}
          tip={t('instructions.tip')}
          locale={locale}
        />
      </GameWrapper>
    );
  }

  // --------------------------------------------------------------------------
  // Render – Main game
  // --------------------------------------------------------------------------
  const difficultyLabel =
    difficulty === 'easy'
      ? t('easy')
      : difficulty === 'hard'
        ? t('hard')
        : t('medium');

  return (
    <GameWrapper
      title={t('title')}
      onInstructionsClick={() => setShowInstructions(true)}
    >
      <div
        className="flex flex-col items-center"
        dir={direction}
      >
        <div className="flex flex-col md:flex-row items-start justify-center gap-6">
          {/* ---- Game Board ---- */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={BOARD_WIDTH * CELL_SIZE}
              height={BOARD_HEIGHT * CELL_SIZE}
              className="rounded-xl shadow-2xl border-4 border-[#1a1a2e] cursor-pointer"
              style={{ touchAction: 'none' }}
            />

            {/* Overlays */}
            <AnimatePresence>
              {gameState === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    🧱
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                    {t('title')}
                  </h2>
                  <div className="text-white/70 text-sm mb-4">
                    {t('difficulty')}: {difficultyLabel}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="px-8 py-3 bg-[#a855f7] hover:bg-[#9333ea] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    {t('tapToStart')}
                  </motion.button>
                </motion.div>
              )}

              {gameState === 'paused' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl"
                >
                  <h2 className="text-3xl font-bold text-white mb-4">
                    ⏸️ {t('paused')}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setGameState('playing')}
                    className="px-8 py-3 bg-[#6cbe45] hover:bg-[#5aa838] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    ▶️ {t('resume')}
                  </motion.button>
                </motion.div>
              )}

              {gameState === 'gameover' && !showWin && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl"
                >
                  <div className="bg-white rounded-3xl p-6 text-center shadow-2xl">
                    <div className="text-4xl mb-3">💥</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-3">
                      {t('gameOver')}
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <div className="text-slate-500">{t('score')}</div>
                        <div className="text-xl font-bold text-[#00a4e4]">
                          {score}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">{t('highScore')}</div>
                        <div className="text-xl font-bold text-[#ec4399]">
                          {highScore}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={restartGame}
                        className="px-5 py-2 bg-[#6cbe45] hover:bg-[#5aa838] text-white font-bold rounded-full shadow-lg min-h-[48px]"
                      >
                        {t('playAgain')}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={backToMenu}
                        className="px-5 py-2 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold rounded-full shadow-lg min-h-[48px]"
                      >
                        🏠
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ---- Side Panel ---- */}
          <div className="flex flex-row md:flex-col gap-4 flex-wrap justify-center">
            <LevelDisplay level={level} />

            {/* Next piece(s) */}
            <div className="bg-white/90 rounded-2xl p-4 shadow-lg">
              <div className="text-sm text-slate-500 font-medium mb-2 text-center">
                {t('next')}
              </div>
              <canvas
                ref={previewCanvasRef}
                width={4 * PREVIEW_CELL_SIZE}
                height={previewCanvasHeight}
                className="rounded-lg"
              />
            </div>

            {/* Score */}
            <div className="bg-white/90 rounded-2xl px-5 py-3 shadow-lg text-center">
              <div className="text-sm text-slate-500 font-medium">
                {t('score')}
              </div>
              <div className="text-2xl font-bold text-[#00a4e4]">{score}</div>
            </div>

            {/* Lines */}
            <div className="bg-white/90 rounded-2xl px-5 py-3 shadow-lg text-center">
              <div className="text-sm text-slate-500 font-medium">
                {t('lines')}
              </div>
              <div className="text-2xl font-bold text-[#6cbe45]">{lines}</div>
            </div>

            {/* High score */}
            {highScore > 0 && (
              <div className="bg-white/90 rounded-2xl px-5 py-3 shadow-lg text-center">
                <div className="text-sm text-slate-500 font-medium">
                  {t('highScore')}
                </div>
                <div className="text-2xl font-bold text-[#ec4399]">
                  {highScore}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---- Keyboard controls hint (desktop) ---- */}
        <div className="hidden sm:flex flex-wrap justify-center gap-3 mt-6 text-slate-600 text-sm">
          <span className="px-3 py-1 bg-white/80 rounded-full">
            {t('moveLeft')}
          </span>
          <span className="px-3 py-1 bg-white/80 rounded-full">
            {t('rotate')}
          </span>
          <span className="px-3 py-1 bg-white/80 rounded-full">
            {t('moveRight')}
          </span>
          <span className="px-3 py-1 bg-white/80 rounded-full">
            {t('softDrop')}
          </span>
          <span className="px-3 py-1 bg-white/80 rounded-full">
            {t('hardDrop')}
          </span>
          <span className="px-3 py-1 bg-white/80 rounded-full">
            {t('clickRotate')}
          </span>
        </div>

        {/* ---- On-screen mobile controls ---- */}
        <div className="flex sm:hidden flex-col items-center gap-3 mt-6">
          {/* Rotate */}
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onPointerDown={(e) => {
                e.preventDefault();
                onMobileRotate();
              }}
              className="min-h-[56px] min-w-[56px] bg-[#a855f7] text-white text-2xl font-bold rounded-2xl shadow-lg flex items-center justify-center active:bg-[#9333ea]"
              aria-label="Rotate"
            >
              ↻
            </motion.button>
          </div>

          {/* Left / Down / Right */}
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onPointerDown={(e) => {
                e.preventDefault();
                onMobileLeft();
              }}
              className="min-h-[56px] min-w-[56px] bg-[#3b82f6] text-white text-2xl font-bold rounded-2xl shadow-lg flex items-center justify-center active:bg-[#2563eb]"
              aria-label="Move Left"
            >
              ◀
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onPointerDown={(e) => {
                e.preventDefault();
                onMobileDown();
              }}
              className="min-h-[56px] min-w-[56px] bg-[#22c55e] text-white text-2xl font-bold rounded-2xl shadow-lg flex items-center justify-center active:bg-[#16a34a]"
              aria-label="Soft Drop"
            >
              ▼
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onPointerDown={(e) => {
                e.preventDefault();
                onMobileRight();
              }}
              className="min-h-[56px] min-w-[56px] bg-[#3b82f6] text-white text-2xl font-bold rounded-2xl shadow-lg flex items-center justify-center active:bg-[#2563eb]"
              aria-label="Move Right"
            >
              ▶
            </motion.button>
          </div>

          {/* Hard drop */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onPointerDown={(e) => {
              e.preventDefault();
              onMobileHardDrop();
            }}
            className="min-h-[48px] min-w-[140px] bg-[#ef4444] text-white text-lg font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:bg-[#dc2626]"
            aria-label="Hard Drop"
          >
            ⤓ {t('drop')}
          </motion.button>
        </div>
      </div>

      {/* Win Modal */}
      <WinModal
        isOpen={showWin}
        onClose={() => setShowWin(false)}
        onPlayAgain={() => {
          setShowWin(false);
          backToMenu();
        }}
        score={score}
      />

      {/* Instructions Modal */}
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
          { icon: t('instructions.control3Icon'), description: t('instructions.control3Desc') },
          { icon: t('instructions.control4Icon'), description: t('instructions.control4Desc') },
          { icon: t('instructions.control5Icon'), description: t('instructions.control5Desc') },
          { icon: t('instructions.control6Icon'), description: t('instructions.control6Desc') },
        ]}
        tip={t('instructions.tip')}
        locale={locale}
      />
    </GameWrapper>
  );
}
