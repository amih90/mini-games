'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { TextDirection } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Bird {
  y: number;
  velocity: number;
}

interface Pipe {
  x: number;
  gapY: number;
  gapSize: number;
  passed: boolean;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultySettings {
  gravity: number;
  jumpStrength: number;
  pipeGap: number;
  pipeSpeed: number;
  pipeSpawnInterval: number;
  winScore: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BIRD_SIZE = 40;
const BIRD_X = 80;
const PIPE_WIDTH = 70;
const POINTS_PER_LEVEL = 5;

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    gravity: 0.35,
    jumpStrength: -8,
    pipeGap: 190,
    pipeSpeed: 2.2,
    pipeSpawnInterval: 2200,
    winScore: 15,
  },
  medium: {
    gravity: 0.5,
    jumpStrength: -9,
    pipeGap: 160,
    pipeSpeed: 3,
    pipeSpawnInterval: 1800,
    winScore: 25,
  },
  hard: {
    gravity: 0.65,
    jumpStrength: -10,
    pipeGap: 130,
    pipeSpeed: 4,
    pipeSpawnInterval: 1400,
    winScore: 35,
  },
};

const HIGHSCORE_KEY = 'flappy-bird-highscore';



// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FlappyBirdGameProps {
  locale?: string;
}

export default function FlappyBirdGame({ locale = 'en' }: FlappyBirdGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastPipeSpawnRef = useRef<number>(0);
  const scoreRef = useRef(0);

  const [gameState, setGameState] = useState<'menu' | 'idle' | 'playing' | 'gameover'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(HIGHSCORE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [showWin, setShowWin] = useState(false);
  const [level, setLevel] = useState(1);
  const [showInstructions, setShowInstructions] = useState(false);

  const birdRef = useRef<Bird>({ y: CANVAS_HEIGHT / 2, velocity: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const pipeSpeedRef = useRef(DIFFICULTY_SETTINGS.medium.pipeSpeed);
  const pipeGapRef = useRef(DIFFICULTY_SETTINGS.medium.pipeGap);
  const gravityRef = useRef(DIFFICULTY_SETTINGS.medium.gravity);
  const jumpStrengthRef = useRef(DIFFICULTY_SETTINGS.medium.jumpStrength);
  const levelRef = useRef(1);

  const {
    playSuccess,
    playWin,
    playLevelUp,
    playGameOver,
    playJump,
    playClick,
    playHit,
  } = useRetroSounds();

  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const t = useTranslations('flappyBird');
  const settings = DIFFICULTY_SETTINGS[difficulty];

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  const updateHighScore = useCallback(
    (newScore: number) => {
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem(HIGHSCORE_KEY, String(newScore));
      }
    },
    [highScore],
  );

  // -----------------------------------------------------------------------
  // Jump / Flap
  // -----------------------------------------------------------------------

  const jump = useCallback(() => {
    if (gameState === 'idle') {
      // Start playing
      const s = DIFFICULTY_SETTINGS[difficulty];
      birdRef.current = { y: CANVAS_HEIGHT / 2, velocity: s.jumpStrength };
      pipesRef.current = [];
      lastPipeSpawnRef.current = Date.now();
      scoreRef.current = 0;
      setScore(0);
      setLevel(1);
      levelRef.current = 1;
      pipeSpeedRef.current = s.pipeSpeed;
      pipeGapRef.current = s.pipeGap;
      gravityRef.current = s.gravity;
      jumpStrengthRef.current = s.jumpStrength;
      setGameState('playing');
      playJump();
    } else if (gameState === 'playing') {
      birdRef.current.velocity = jumpStrengthRef.current;
      playJump();
    }
  }, [gameState, difficulty, playJump]);

  // -----------------------------------------------------------------------
  // Keyboard input
  // -----------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  // -----------------------------------------------------------------------
  // Touch input on canvas
  // -----------------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      jump();
    };

    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, [jump]);

  // -----------------------------------------------------------------------
  // End game helper
  // -----------------------------------------------------------------------

  const endGame = useCallback(() => {
    playHit();
    setGameState('gameover');
    playGameOver();
    const finalScore = scoreRef.current;
    if (finalScore > highScore) {
      updateHighScore(finalScore);
      if (finalScore >= settings.winScore) {
        setShowWin(true);
        playWin();
      }
    }
  }, [playHit, playGameOver, playWin, highScore, updateHighScore, settings.winScore]);

  // -----------------------------------------------------------------------
  // Drawing helpers
  // -----------------------------------------------------------------------

  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 1.5, y, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawBird = (ctx: CanvasRenderingContext2D, bird: Bird) => {
    const x = BIRD_X;
    const y = bird.y;
    const rotation = Math.min(Math.max(bird.velocity * 3, -30), 60) * (Math.PI / 180);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Body (yellow)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wing
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.ellipse(-5, 5, 12, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye (white)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(8, -5, 8, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(10, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#FF6B35';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(25, 3);
    ctx.lineTo(15, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, pipe: Pipe) => {
    const { x, gapY, gapSize } = pipe;

    // Pipe gradient
    const pipeGradient = ctx.createLinearGradient(x, 0, x + PIPE_WIDTH, 0);
    pipeGradient.addColorStop(0, '#2E8B2E');
    pipeGradient.addColorStop(0.3, '#3CB371');
    pipeGradient.addColorStop(0.7, '#3CB371');
    pipeGradient.addColorStop(1, '#228B22');

    // Top pipe
    ctx.fillStyle = pipeGradient;
    ctx.fillRect(x, 0, PIPE_WIDTH, gapY);

    // Top pipe cap
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x - 5, gapY - 30, PIPE_WIDTH + 10, 30);
    ctx.strokeStyle = '#1a6b1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 5, gapY - 30, PIPE_WIDTH + 10, 30);

    // Bottom pipe
    const bottomY = gapY + gapSize;
    ctx.fillStyle = pipeGradient;
    ctx.fillRect(x, bottomY, PIPE_WIDTH, CANVAS_HEIGHT - bottomY);

    // Bottom pipe cap
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x - 5, bottomY, PIPE_WIDTH + 10, 30);
    ctx.strokeStyle = '#1a6b1a';
    ctx.strokeRect(x - 5, bottomY, PIPE_WIDTH + 10, 30);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.5, '#98D8C8');
    skyGradient.addColorStop(1, '#7BC043');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    drawCloud(ctx, 50, 80, 40);
    drawCloud(ctx, 200, 120, 30);
    drawCloud(ctx, 320, 60, 35);
  };

  const drawGround = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, CANVAS_HEIGHT - 25, CANVAS_WIDTH, 10);
  };

  // -----------------------------------------------------------------------
  // Main draw
  // -----------------------------------------------------------------------

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, bird: Bird, pipes: Pipe[], currentScore: number) => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      drawBackground(ctx);

      // Pipes
      for (const pipe of pipes) {
        drawPipe(ctx, pipe);
      }

      drawGround(ctx);

      // Bird
      drawBird(ctx, bird);

      // Score overlay
      ctx.fillStyle = 'white';
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.strokeText(currentScore.toString(), CANVAS_WIDTH / 2, 60);
      ctx.fillText(currentScore.toString(), CANVAS_WIDTH / 2, 60);
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Idle screen drawing
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (gameState !== 'idle') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground(ctx);
    drawGround(ctx);
    drawBird(ctx, { y: CANVAS_HEIGHT / 2 - 50, velocity: 0 });
  }, [gameState]);

  // -----------------------------------------------------------------------
  // Game loop
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = () => {
      const bird = birdRef.current;
      const pipes = pipesRef.current;

      // Physics
      bird.velocity += gravityRef.current;
      bird.y += bird.velocity;

      // Spawn pipes
      const now = Date.now();
      if (now - lastPipeSpawnRef.current > settings.pipeSpawnInterval) {
        const gap = pipeGapRef.current;
        const gapY = Math.random() * (CANVAS_HEIGHT - gap - 100) + 50;
        pipes.push({ x: CANVAS_WIDTH, gapY, gapSize: gap, passed: false });
        lastPipeSpawnRef.current = now;
      }

      // Update pipes
      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeedRef.current;

        // Score
        if (!pipes[i].passed && pipes[i].x + PIPE_WIDTH < BIRD_X) {
          pipes[i].passed = true;
          scoreRef.current += 1;
          const newScore = scoreRef.current;
          setScore(newScore);
          playSuccess();

          // Level up every POINTS_PER_LEVEL
          const newLevel = Math.floor(newScore / POINTS_PER_LEVEL) + 1;
          if (newLevel > levelRef.current && newLevel <= 5) {
            levelRef.current = newLevel;
            setLevel(newLevel);
            playLevelUp();
            // Progressive difficulty within run
            pipeSpeedRef.current = settings.pipeSpeed + (newLevel - 1) * 0.5;
            pipeGapRef.current = Math.max(settings.pipeGap - (newLevel - 1) * 10, 100);
          }

          // Win check
          if (newScore >= settings.winScore) {
            setGameState('gameover');
            playWin();
            updateHighScore(newScore);
            setShowWin(true);
            return;
          }
        }

        // Remove off-screen
        if (pipes[i].x + PIPE_WIDTH < 0) {
          pipes.splice(i, 1);
        }
      }

      // Collision — ground & ceiling
      const birdTop = bird.y - BIRD_SIZE / 2;
      const birdBottom = bird.y + BIRD_SIZE / 2;
      const birdLeft = BIRD_X - BIRD_SIZE / 2;
      const birdRight = BIRD_X + BIRD_SIZE / 2;

      if (birdTop < 0 || birdBottom > CANVAS_HEIGHT - 20) {
        endGame();
        return;
      }

      // Collision — pipes
      for (const pipe of pipes) {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + PIPE_WIDTH;
        const gapTop = pipe.gapY;
        const gapBottom = pipe.gapY + pipe.gapSize;

        if (birdRight > pipeLeft && birdLeft < pipeRight) {
          if (birdTop < gapTop || birdBottom > gapBottom) {
            endGame();
            return;
          }
        }
      }

      // Draw
      draw(ctx, bird, pipes, scoreRef.current);

      animId = requestAnimationFrame(gameLoop);
      gameLoopRef.current = animId;
    };

    animId = requestAnimationFrame(gameLoop);
    gameLoopRef.current = animId;

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameState, settings, playSuccess, playLevelUp, playWin, endGame, draw, updateHighScore]);

  // -----------------------------------------------------------------------
  // Restart
  // -----------------------------------------------------------------------

  const restartGame = useCallback(() => {
    setGameState('idle');
    setScore(0);
    scoreRef.current = 0;
    setLevel(1);
    levelRef.current = 1;
    birdRef.current = { y: CANVAS_HEIGHT / 2, velocity: 0 };
    pipesRef.current = [];
  }, []);

  const goToMenu = useCallback(() => {
    setGameState('menu');
    setScore(0);
    scoreRef.current = 0;
    setLevel(1);
    levelRef.current = 1;
    birdRef.current = { y: CANVAS_HEIGHT / 2, velocity: 0 };
    pipesRef.current = [];
  }, []);

  usePlayAgainKey(gameState === 'gameover' && !showWin, restartGame);

  // -----------------------------------------------------------------------
  // Difficulty selection
  // -----------------------------------------------------------------------

  const selectDifficulty = useCallback(
    (d: Difficulty) => {
      playClick();
      setDifficulty(d);
      setGameState('idle');
    },
    [playClick],
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const difficultyLabel =
    difficulty === 'easy' ? t('easy') : difficulty === 'hard' ? t('hard') : t('medium');

  return (
    <GameWrapper title={t('title')} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="flex flex-col items-center gap-6" dir={direction}>
        {/* ---- Difficulty Selection Screen ---- */}
        {gameState === 'menu' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            <div className="text-6xl">🐤</div>
            <h2 className="text-3xl font-bold text-slate-800">{t('title')}</h2>
            <p className="text-slate-600">{t('description')}</p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <p className="text-center font-semibold text-slate-700">{t('chooseDifficulty')}</p>

              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
                const colors: Record<Difficulty, string> = {
                  easy: 'bg-green-500 hover:bg-green-600',
                  medium: 'bg-yellow-500 hover:bg-yellow-600',
                  hard: 'bg-red-500 hover:bg-red-600',
                };
                const label = d === 'easy' ? t('easy') : d === 'hard' ? t('hard') : t('medium');
                const desc = d === 'easy' ? t('easyDesc') : d === 'hard' ? t('hardDesc') : t('mediumDesc');

                return (
                  <motion.button
                    key={d}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => selectDifficulty(d)}
                    className={`${colors[d]} text-white rounded-2xl px-6 py-4 font-bold text-lg shadow-lg min-h-[48px] transition-colors`}
                  >
                    <span className="block">{label}</span>
                    <span className="block text-sm font-normal opacity-90">{desc}</span>
                  </motion.button>
                );
              })}
            </div>

            {highScore > 0 && (
              <div className="text-slate-500 text-sm">
                {t('highScore')}: {highScore}
              </div>
            )}
          </motion.div>
        )}

        {/* ---- Game UI (idle / playing / gameover) ---- */}
        {gameState !== 'menu' && (
          <>
            {/* Score bar */}
            <div className="flex gap-4 text-center flex-wrap justify-center">
              <LevelDisplay level={level} />

              <div className="bg-white/90 rounded-2xl px-6 py-3 shadow-lg">
                <div className="text-sm text-slate-500 font-medium">{t('score')}</div>
                <div className="text-3xl font-bold text-[#00a4e4]">{score}</div>
              </div>
              <div className="bg-white/90 rounded-2xl px-6 py-3 shadow-lg">
                <div className="text-sm text-slate-500 font-medium">{t('highScore')}</div>
                <div className="text-3xl font-bold text-[#ec4399]">{highScore}</div>
              </div>
              <div className="bg-white/90 rounded-2xl px-4 py-3 shadow-lg">
                <div className="text-sm text-slate-500 font-medium">{difficultyLabel}</div>
              </div>
            </div>

            {/* Canvas */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={jump}
                className="rounded-3xl shadow-2xl cursor-pointer border-4 border-white max-w-full"
                style={{ touchAction: 'none' }}
              />

              {/* Idle overlay */}
              <AnimatePresence>
                {gameState === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-3xl"
                    onClick={jump}
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-6xl mb-4"
                    >
                      🐤
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-[#ffdd00] hover:bg-[#ffee44] text-slate-800 text-xl font-bold rounded-full shadow-lg min-h-[48px]"
                    >
                      {t('tapToStart')}
                    </motion.button>
                    <p className="mt-4 text-white/90 text-sm">{t('instructions')}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Game Over overlay */}
              <AnimatePresence>
                {gameState === 'gameover' && !showWin && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-3xl"
                  >
                    <motion.div
                      initial={{ y: -20 }}
                      animate={{ y: 0 }}
                      className="bg-white rounded-3xl p-8 text-center shadow-2xl mx-4"
                    >
                      <div className="text-5xl mb-4">😵</div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('gameOver')}</h2>
                      <div className="flex gap-6 justify-center mb-6">
                        <div>
                          <div className="text-sm text-slate-500">{t('score')}</div>
                          <div className="text-3xl font-bold text-[#00a4e4]">{score}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">{t('highScore')}</div>
                          <div className="text-3xl font-bold text-[#ec4399]">{highScore}</div>
                        </div>
                      </div>
                      {score >= highScore && score > 0 && (
                        <p className="text-[#ec4399] font-bold mb-4">{t('newBest')}</p>
                      )}
                      <div className="flex flex-col gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={restartGame}
                          className="px-8 py-3 bg-[#6cbe45] hover:bg-[#5aa838] text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                        >
                          {t('playAgain')}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={goToMenu}
                          className="px-8 py-3 bg-slate-500 hover:bg-slate-600 text-white text-sm font-bold rounded-full shadow-lg min-h-[48px]"
                        >
                          {t('chooseDifficulty')}
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls hint */}
            <div className="flex gap-4 text-slate-600 text-sm flex-wrap justify-center">
              <span className="px-3 py-1 bg-white/80 rounded-full">
                ⌨️ {t('controlsHintKbd')}
              </span>
              <span className="px-3 py-1 bg-white/80 rounded-full">
                🖱️ {t('controlsHintMouse')}
              </span>
              <span className="px-3 py-1 bg-white/80 rounded-full">
                👆 {t('controlsHintTouch')}
              </span>
            </div>
          </>
        )}
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
        ]}
        tip={t('instructions.tip')}
        locale={locale}
      />
    </GameWrapper>
  );
}
