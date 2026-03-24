# Create a New Game

Use this prompt to create a new 2D game for the mini-games portal.

## Required Information

Before creating a game, gather this information:
- **Game name** (e.g., "Pong", "Space Invaders")
- **Game slug** (kebab-case, e.g., "pong", "space-invaders")
- **Game description** (one sentence)
- **Age range** (min and max age)
- **Categories** (from: 'colors', 'memory', 'math', 'reaction', 'ages-3-5', 'ages-6-8')
- **Control scheme** (keyboard keys + mouse/touch actions)

## Steps to Create a New Game

### Step 1: Create the Game Component

Create a new file at `src/features/games/{game-slug}/{GameName}Game.tsx`:

```typescript
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { useSoundEffects } from '@/hooks/useSoundEffects';

// Game constants
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 600;

interface {GameName}GameProps {
  locale: string;
}

export default function {GameName}Game({ locale }: {GameName}GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover' | 'win'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('{game-slug}-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  
  const { playClick, playSuccess, playWin } = useSoundEffects();

  // Localization
  const isRtl = locale === 'he';
  const t = {
    title: isRtl ? 'שם בעברית' : 'Game Name',
    score: isRtl ? 'ניקוד' : 'Score',
    highScore: isRtl ? 'שיא' : 'Best',
    gameOver: isRtl ? 'המשחק נגמר!' : 'Game Over!',
    playAgain: isRtl ? 'שחק שוב' : 'Play Again',
    tapToStart: isRtl ? 'לחץ להתחלה' : 'Click to Start',
  };

  // Game logic functions
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    // Initialize game state
    playClick();
  }, [playClick]);

  // Input handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle keyboard input
    };

    const handleClick = () => {
      if (gameState === 'idle') startGame();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameState, startGame]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear and draw game
      ctx.fillStyle = '#1e1e2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      // Draw game objects
    };

    const gameLoop = () => {
      // Update game state
      // Check collisions
      // Update score
      draw();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState]);

  return (
    <GameWrapper title={t.title}>
      <div className="flex flex-col items-center gap-4">
        {/* Score display */}
        <div className="flex gap-4">
          <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center">
            <div className="text-sm text-slate-500">{t.score}</div>
            <div className="text-2xl font-bold text-blue-500">{score}</div>
          </div>
        </div>

        {/* Game canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-xl shadow-2xl border-4 border-blue-500/30 cursor-pointer"
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
                <div className="text-6xl mb-4">🎮</div>
                <h2 className="text-2xl font-bold text-white mb-4">{t.title}</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                  className="px-8 py-3 bg-blue-500 text-white font-bold rounded-full"
                >
                  {t.tapToStart}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls hint */}
        <div className="flex gap-3 text-slate-600 text-sm">
          <span className="px-3 py-1 bg-white/80 rounded-full">⌨️ Controls</span>
        </div>
      </div>
    </GameWrapper>
  );
}
```

### Step 2: Generate Screenshot Thumbnail

After the game is working, generate a Playwright screenshot:

```bash
# Ensure Playwright is installed
npm install && npx playwright install chromium

# Start dev server if not running
npm run dev &

# Generate screenshot for this game
GAME_SLUG={game-slug} npx playwright test e2e/generate-thumbnails.spec.ts
```

This creates `public/images/games/screenshots/{game-slug}.png` (800x600 viewport).

### Step 3: Register the Game

Add to `src/features/games/registry/index.ts`:

```typescript
'{game-slug}': {
  slug: '{game-slug}',
  title: {
    en: 'Game Name',
    he: 'שם המשחק',
    zh: '游戏名称',
    es: 'Nombre del juego',
  },
  description: {
    en: 'Game description in English',
    he: 'תיאור המשחק בעברית',
    zh: '游戏描述',
    es: 'Descripción del juego',
  },
  categories: ['reaction', 'ages-6-8'],
  ageRange: { min: 5, max: 12 },
  icon: '🎮',
  thumbnail: '/images/games/screenshots/{game-slug}.png',
  engine: 'canvas',
  i18nNamespace: '{gameName}',
},
```

### Step 4: Add to GameLoader

Add to `src/features/games/shared/GameLoader.tsx`:

```typescript
// Add dynamic import
const {GameName}Game = dynamic(
  () => import('@/features/games/{game-slug}/{GameName}Game'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

// Add case in switch statement
case '{game-slug}':
  return <{GameName}Game locale={locale} />;
```

### Step 5: Add to Hero Banner (Optional)

Add to `src/components/HomePageClient.tsx` in `heroSlides` array:

```typescript
{
  id: '{game-slug}',
  title: locale === 'he' ? 'שם בעברית' : 'Game Name',
  subtitle: locale === 'he' ? 'תיאור קצר' : 'Short description',
  emoji: '🎮',
  bgColor: '#3b82f6',
  link: '/games/{game-slug}',
  buttonText: translations.play,
},
```

## Checklist

- [ ] Game component created with proper TypeScript types
- [ ] Supports keyboard (arrows + WASD), mouse, and touch controls
- [ ] Has 4-locale translations (en, he, zh, es) with RTL support
- [ ] At least 3 difficulty levels (easy/medium/hard)
- [ ] `useRetroSounds` wired to game events
- [ ] `InstructionsModal` with Feynman-style explanations in 4 locales
- [ ] High score persists to localStorage
- [ ] Screenshot thumbnail generated via Playwright
- [ ] `game.config.ts` has `icon` emoji and `thumbnail` screenshot path
- [ ] Registered in game registry
- [ ] Added to GameLoader
- [ ] No TypeScript errors
- [ ] Tested on desktop and mobile

For full quality requirements, run the **game-quality** agent: `.github/agents/game-quality.agent.md`
