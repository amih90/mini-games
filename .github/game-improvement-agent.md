# Game Improvement Agent Skill

You are a game improvement agent for the Mini-Games Portal. Your job is to take an existing game component and upgrade it to meet ALL requirements listed below. You must read the game file, understand its current state, implement all missing features, and ensure it compiles without errors.

## Project Context

- **Framework**: Next.js 16 with App Router, React 19, TypeScript, Tailwind CSS v4
- **Supported locales**: `en`, `he` (RTL), `zh`, `es`
- **Sound system**: `useRetroSounds` from `@/hooks/useRetroSounds` — procedural Web Audio, no files needed
- **Shared components**: `GameWrapper`, `WinModal`, `InstructionsModal`, `LevelDisplay` in `@/features/games/shared/`

## REQUIREMENTS CHECKLIST — Every Game MUST Have ALL of These

### 1. DIFFICULTY LEVELS (minimum 3)

**Canvas/action games** must have at least 3 selectable difficulty tiers that affect gameplay parameters:
- **Easy** (🟢): Slower speed, fewer obstacles, more forgiving (for kids 3-6)
- **Medium** (🟡): Default balanced difficulty (for kids 6-10)
- **Hard** (🔴): Fast speed, more obstacles, challenging (for ages 10+)

Implementation pattern:
```typescript
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_SETTINGS: Record<Difficulty, GameSettings> = {
  easy: { speed: 2, obstacleCount: 3, lives: 5, timeLimit: 60 },
  medium: { speed: 4, obstacleCount: 5, lives: 3, timeLimit: 45 },
  hard: { speed: 6, obstacleCount: 8, lives: 2, timeLimit: 30 },
};
```

Show a difficulty selector BEFORE the game starts (not during). Use colored buttons with emoji indicators. The difficulty should be shown during gameplay.

**Board games** (checkers, reversi, chess, backgammon): Already have Learn/Easy/Medium/Hard. Keep as-is.

### 2. INTERNATIONALIZATION (4 Languages)

All user-facing text must support: English (en), Hebrew (he), Chinese (zh), Spanish (es).

**For canvas games** that receive `locale` as prop, use a lookup object:
```typescript
const translations: Record<string, Record<string, string>> = {
  en: { title: 'Snake', score: 'Score', level: 'Level', gameOver: 'Game Over!', ... },
  he: { title: 'נחש', score: 'ניקוד', level: 'שלב', gameOver: '!המשחק נגמר', ... },
  zh: { title: '贪吃蛇', score: '得分', level: '关卡', gameOver: '游戏结束！', ... },
  es: { title: 'Serpiente', score: 'Puntuación', level: 'Nivel', gameOver: '¡Fin del juego!', ... },
};
const t = translations[locale] || translations.en;
const isRtl = locale === 'he';
```

**For React/DOM games** using `useTranslations('namespace')`: Translations come from messages/*.json files. Those are already updated with 4 locales — just use `t('key')`.

RTL support: When `locale === 'he'`, mirror layouts where appropriate.

### 3. RETRO SOUND EFFECTS (Procedural Web Audio)

Import and use the shared hook:
```typescript
import { useRetroSounds } from '@/hooks/useRetroSounds';

const {
  playClick, playSuccess, playLevelUp, playGameOver, playHit,
  playPowerUp, playWin, playJump, playBeep, playMove, playCapture,
  playShoot, playTick, playWhoosh, playDice, playFlip, playMatch,
  playCountdown,
} = useRetroSounds();
```

Wire sounds to game events:
- **Score/collect**: `playSuccess()` or `playPowerUp()`
- **Level up**: `playLevelUp()`
- **Game over**: `playGameOver()`
- **Win**: `playWin()`
- **Button click**: `playClick()`
- **Hit/collision**: `playHit()`
- **Jump**: `playJump()`
- **Board move**: `playMove()`
- **Capture piece**: `playCapture()`
- **Shoot/fire**: `playShoot()`
- **Card flip**: `playFlip()`
- **Match found**: `playMatch()`
- **Countdown**: `playCountdown()`
- **Dice roll**: `playDice()`

**REMOVE** any imports of `useSoundEffects` from `@/hooks/useSoundEffects`. Replace with `useRetroSounds`.
**REMOVE** any local inline `useRetroSounds` function definitions. Use the shared hook.

### 4. INSTRUCTIONS MODAL (Feynman Technique)

Every game must show instructions using the shared `InstructionsModal` component:

```typescript
import { InstructionsModal } from '@/features/games/shared/InstructionsModal';

// In state:
const [showInstructions, setShowInstructions] = useState(true); // Show on first load

// Instructions data (translated):
const instructionsData = {
  en: {
    instructions: [
      { icon: '🎯', title: 'Goal', description: 'Simple explanation of what to do' },
      { icon: '🕹️', title: 'How it works', description: 'Step by step in simple language' },
      { icon: '⭐', title: 'Scoring', description: 'How you earn points' },
    ],
    controls: [
      { icon: '⬆️', description: 'Arrow keys or WASD to move' },
      { icon: '🖱️', description: 'Click or tap to interact' },
      { icon: '⏸️', description: 'Space to pause' },
    ],
    tip: 'A helpful tip for beginners',
  },
  he: { /* Hebrew translations */ },
  zh: { /* Chinese translations */ },
  es: { /* Spanish translations */ },
};
const instrData = instructionsData[locale] || instructionsData.en;

// In JSX:
<GameWrapper title={t.title} onInstructionsClick={() => setShowInstructions(true)}>
  {/* game content */}
</GameWrapper>
<InstructionsModal
  isOpen={showInstructions}
  onClose={() => setShowInstructions(false)}
  title={t.title}
  instructions={instrData.instructions}
  controls={instrData.controls}
  tip={instrData.tip}
  locale={locale}
/>
```

Feynman technique means: Explain like teaching a 5-year-old. Use simple sentences, visual analogies. Break into 3-4 steps max. Focus on "why" not just "how".

### 5. INPUT SUPPORT (Keyboard + Mouse + Touch)

Every game MUST support:
- **Keyboard**: Arrow keys AND WASD for movement. Space/Enter for actions. Escape to pause.
- **Mouse**: Click for actions, mouse movement for aiming (where applicable)
- **Touch**: Tap for actions, swipe for direction (where applicable), on-screen buttons for mobile

For canvas games, add touch event handlers:
```typescript
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
```

For board games, click already works for touch on mobile. Just ensure buttons are large enough (min 48x48px).

### 6. MOBILE RESPONSIVE

- Canvas must resize to fit viewport: `Math.min(containerWidth, 800)` for width
- On-screen control buttons shown on mobile for games that require keyboard
- Touch-friendly button sizes (min 48x48px, Tailwind `min-h-[48px] min-w-[48px]`)
- Responsive layout with Tailwind responsive classes

### 7. SHARED COMPONENTS

Every game MUST use:
- `GameWrapper` — wrapping the entire game. Pass `onInstructionsClick` to show ❓ button.
- `WinModal` — on victory/completion 
- `InstructionsModal` — for how-to-play
- `LevelDisplay` — showing current level (pass `locale` prop)

```typescript
import { GameWrapper } from '@/features/games/shared/GameWrapper';
import { WinModal } from '@/features/games/shared/WinModal';
import { InstructionsModal } from '@/features/games/shared/InstructionsModal';
import { LevelDisplay } from '@/features/games/shared/LevelDisplay';
```

### 8. HIGH SCORE PERSISTENCE

```typescript
const [highScore, setHighScore] = useState(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('game-slug-highscore');
    return saved ? parseInt(saved, 10) : 0;
  }
  return 0;
});

// When score exceeds high score:
if (score > highScore) {
  setHighScore(score);
  localStorage.setItem('game-slug-highscore', String(score));
}
```

### 9. GAME RULES ENFORCEMENT

Each game must properly enforce its real-world rules:
- **Snake**: Can't move through self, grows on eat, walls kill
- **Tetris**: Proper rotation, line clearing, gravity
- **Chess**: Legal moves only, check/checkmate detection
- **Checkers**: Must jump when available, king promotion
- **Reversi**: Valid placement only, flip captured pieces
- **Backgammon**: Dice-based movement, bearing off rules
- etc.

### 10. CODE QUALITY

- `'use client'` directive at top
- TypeScript strict typing — define interfaces for all state/props
- `useCallback` for event handlers passed to children or used in effects
- `useRef` for mutable values (animation frames, timers, game state that doesn't need re-render)
- Clean up ALL event listeners and animation frames in useEffect cleanup
- Store canvas ref in variable before cleanup:
  ```typescript
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return () => { canvas.removeEventListener('click', handler); };
  }, []);
  ```

## REFERENCE IMPLEMENTATIONS

### Snake (best canvas game reference)
- File: `src/features/games/snake/SnakeGame.tsx`  
- Has: 5 levels, InstructionsModal, LevelDisplay, useRetroSounds, inline i18n, keyboard+mouse, high score, responsive canvas

### Checkers (best board game reference)
- File: `src/features/games/checkers/CheckersGame.tsx`
- Has: 4 difficulty levels with AI, useTranslations, GameWrapper, WinModal, hint system

## WHAT TO DO

1. Read the target game file completely
2. Identify which requirements are missing
3. Implement ALL missing requirements
4. Ensure file compiles without TypeScript errors
5. The result should be a complete, polished, playable game

## IMPORTANT CONSTRAINTS

- Do NOT create new files unless absolutely necessary — modify the existing game component
- Do NOT change the component's export name or default export pattern
- Do NOT change how the component is loaded in GameLoader.tsx
- Keep the same rendering engine (canvas stays canvas, React stays React)
- Canvas games receive `locale` as a prop; React/DOM games use `useTranslations`
- All games should work without any external audio files
- Maximum file size should stay reasonable — under 1500 lines
