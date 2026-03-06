# GitHub Copilot Instructions for Mini-Games Portal

## Project Overview

This is a **kid-friendly gaming portal** built with:
- **Next.js 16** with App Router and Turbopack
- **React 19** with strict purity rules
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **Framer Motion** for animations
- **next-intl** for internationalization (English/Hebrew with RTL support)
- **Canvas 2D API** for game rendering

## Architecture

```
src/
├── app/[locale]/           # Next.js App Router pages
│   ├── games/[slug]/       # Dynamic game pages
│   └── page.tsx            # Home page
├── components/             # Shared UI components
├── features/games/         # Game-specific code
│   ├── [game-name]/        # Individual game folders
│   ├── registry/           # Game configuration registry
│   │   ├── index.ts        # Central game registry
│   │   └── types.ts        # TypeScript types
│   └── shared/             # Shared game components
│       ├── GameLoader.tsx  # Dynamic game loader
│       ├── GameWrapper.tsx # Common game wrapper
│       └── WinModal.tsx    # Victory modal
├── hooks/                  # Custom React hooks
│   └── useSoundEffects.ts  # Sound effects hook
└── i18n/                   # Internationalization
```

## Code Style Guidelines

### TypeScript
- Use strict typing everywhere
- Define interfaces for all props and game state
- Use `'use client'` directive for client components
- Prefer `useCallback` for memoized functions
- Use `useRef` for mutable values that don't trigger re-renders

### React Patterns
- Use `useState` with initializer functions for localStorage:
  ```typescript
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('game-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  ```
- Store canvas ref in variable before cleanup:
  ```typescript
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // ... setup
    return () => {
      canvas.removeEventListener('click', handler);
    };
  }, []);
  ```

### Game Development
- All games use Canvas 2D API
- Games must support keyboard AND mouse/touch controls
- Include RTL support for Hebrew locale
- Persist high scores to localStorage
- Use `requestAnimationFrame` for game loops
- Clean up animation frames in useEffect cleanup

### Styling
- Use Tailwind CSS classes
- Follow PBS Kids-inspired color palette
- Use Framer Motion for UI animations
- Support responsive design (mobile-first)

## Localization

All user-facing text must support English and Hebrew:
```typescript
const isRtl = locale === 'he';
const t = {
  title: isRtl ? 'שם המשחק' : 'Game Name',
  score: isRtl ? 'ניקוד' : 'Score',
  // ...
};
```

## File Naming Conventions

- Game components: `PascalCase` (e.g., `SnakeGame.tsx`)
- Game folders: `kebab-case` (e.g., `snake/`, `brick-breaker/`)
- Game slugs: `kebab-case` (e.g., `'snake'`, `'brick-breaker'`)
- Thumbnails: `kebab-case.svg` (e.g., `snake.svg`)
