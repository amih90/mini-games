# Add Feature to Existing Game

Use this prompt to add new features to an existing game.

## Common Features to Add

### 1. Power-ups
```typescript
interface PowerUp {
  x: number;
  y: number;
  type: 'speed' | 'shield' | 'double-points' | 'slow-motion';
  duration: number;
}

const powerUpsRef = useRef<PowerUp[]>([]);
const activePowerUpsRef = useRef<Map<string, number>>(new Map());
```

### 2. Levels/Difficulty
```typescript
const [level, setLevel] = useState(1);
const difficultyRef = useRef({
  speed: 1,
  spawnRate: 1000,
  scoreMultiplier: 1,
});

// Increase difficulty when advancing levels
const advanceLevel = () => {
  setLevel(l => l + 1);
  difficultyRef.current.speed *= 1.1;
  difficultyRef.current.spawnRate *= 0.9;
};
```

### 3. Combo System
```typescript
const [combo, setCombo] = useState(0);
const comboTimerRef = useRef<number | null>(null);

const addCombo = () => {
  setCombo(c => c + 1);
  // Reset combo timer
  if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
  comboTimerRef.current = window.setTimeout(() => setCombo(0), 2000);
};

// Score with combo multiplier
const scoreWithCombo = baseScore * Math.min(combo + 1, 5);
```

### 4. Particle Effects
```typescript
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const particlesRef = useRef<Particle[]>([]);

const spawnParticles = (x: number, y: number, color: string, count = 10) => {
  for (let i = 0; i < count; i++) {
    particlesRef.current.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30,
      color,
      size: Math.random() * 4 + 2,
    });
  }
};

// In game loop
particlesRef.current = particlesRef.current.filter(p => {
  p.x += p.vx;
  p.y += p.vy;
  p.life--;
  p.vy += 0.2; // gravity
  return p.life > 0;
});
```

### 5. Screen Shake
```typescript
const shakeRef = useRef({ x: 0, y: 0, intensity: 0 });

const triggerShake = (intensity = 5) => {
  shakeRef.current.intensity = intensity;
};

// In game loop
if (shakeRef.current.intensity > 0) {
  shakeRef.current.x = (Math.random() - 0.5) * shakeRef.current.intensity;
  shakeRef.current.y = (Math.random() - 0.5) * shakeRef.current.intensity;
  shakeRef.current.intensity *= 0.9;
}

// Apply to canvas transform
ctx.save();
ctx.translate(shakeRef.current.x, shakeRef.current.y);
// ... draw game
ctx.restore();
```

### 6. Achievement System
```typescript
interface Achievement {
  id: string;
  title: string;
  description: string;
  condition: (stats: GameStats) => boolean;
  unlocked: boolean;
}

const achievements: Achievement[] = [
  {
    id: 'first-win',
    title: 'First Victory',
    description: 'Win your first game',
    condition: (stats) => stats.wins >= 1,
    unlocked: false,
  },
  {
    id: 'high-score-100',
    title: 'Century',
    description: 'Score 100 points',
    condition: (stats) => stats.highScore >= 100,
    unlocked: false,
  },
];
```

## Adding Sound Effects

Use the shared `useRetroSounds` hook:
```typescript
import { useRetroSounds } from '@/hooks/useRetroSounds';

const { playClick, playSuccess, playWin, playFlip, playMatch, playLevelUp, playGameOver, playHit } = useRetroSounds();

// Play on events
playClick();    // UI interactions
playSuccess();  // Scoring points
playWin();      // Winning the game
playFlip();     // Card flip / item toggle
playMatch();    // Matching items
playLevelUp();  // Level advancement
playGameOver(); // Game over
playHit();      // Collision / hit
```

**Note:** Do NOT use `useSoundEffects` — use `useRetroSounds` from `@/hooks/useRetroSounds`.

## Adding New Translations

Add to the `t` object in the game component:
```typescript
const t = {
  // Existing...
  newFeature: isRtl ? 'תכונה חדשה' : 'New Feature',
  powerUp: isRtl ? 'כוח מיוחד' : 'Power Up',
  level: isRtl ? 'שלב' : 'Level',
};
```

Remember to add translations for all 4 locales (en, he, zh, es).

## After Adding Features

After making changes, regenerate the game's screenshot thumbnail:
```bash
GAME_SLUG={slug} npx playwright test e2e/generate-thumbnails.spec.ts
```

For a full quality audit, run the **game-quality** agent: `.github/agents/game-quality.agent.md`
