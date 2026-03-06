# Fix Game Bug

Use this prompt to diagnose and fix bugs in games.

## Common Issues and Solutions

### 1. Game Loop Not Stopping
**Symptom:** Game continues running after component unmounts or game ends.

**Solution:** Ensure cleanup in useEffect:
```typescript
useEffect(() => {
  if (gameState !== 'playing') return;
  
  const gameLoop = () => {
    // ... game logic
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };
  
  gameLoopRef.current = requestAnimationFrame(gameLoop);
  
  return () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };
}, [gameState]);
```

### 2. Event Listener Memory Leak
**Symptom:** Multiple event handlers firing, performance degradation.

**Solution:** Store canvas ref before cleanup:
```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  const handleClick = () => { /* ... */ };
  
  canvas.addEventListener('click', handleClick);
  
  return () => {
    canvas.removeEventListener('click', handleClick);
  };
}, []);
```

### 3. localStorage SSR Error
**Symptom:** "localStorage is not defined" error during build.

**Solution:** Use useState initializer with window check:
```typescript
const [highScore, setHighScore] = useState(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('game-highscore');
    return saved ? parseInt(saved, 10) : 0;
  }
  return 0;
});
```

### 4. State Update After Unmount
**Symptom:** "Can't perform state update on unmounted component" warning.

**Solution:** Use ref to track mount state:
```typescript
const isMountedRef = useRef(true);

useEffect(() => {
  return () => {
    isMountedRef.current = false;
  };
}, []);

// Before state updates
if (isMountedRef.current) {
  setScore(newScore);
}
```

### 5. Function Called Before Declaration
**Symptom:** "Cannot access variable before initialization" error.

**Solution:** Move function definition before usage, or define inside useEffect:
```typescript
// Option 1: Define before useEffect
const draw = useCallback((ctx: CanvasRenderingContext2D) => {
  // ...
}, [dependencies]);

useEffect(() => {
  // Can use draw here
}, [draw]);

// Option 2: Define inside useEffect
useEffect(() => {
  const draw = () => {
    // ...
  };
  
  const gameLoop = () => {
    draw();
    // ...
  };
}, []);
```

### 6. Touch Events Not Working
**Symptom:** Game doesn't respond to touch on mobile.

**Solution:** Add touch event handlers and prevent default:
```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  const handleTouch = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    // Handle touch at (x, y)
  };
  
  canvas.addEventListener('touchstart', handleTouch, { passive: false });
  canvas.addEventListener('touchmove', handleTouch, { passive: false });
  
  return () => {
    canvas.removeEventListener('touchstart', handleTouch);
    canvas.removeEventListener('touchmove', handleTouch);
  };
}, []);
```

Also add to canvas element:
```tsx
<canvas style={{ touchAction: 'none' }} />
```

### 7. Collision Detection Issues
**Symptom:** Objects pass through each other or collide incorrectly.

**Solution:** Use proper bounding box collision:
```typescript
const checkCollision = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) => {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
};

// For circles
const checkCircleCollision = (
  a: { x: number; y: number; radius: number },
  b: { x: number; y: number; radius: number }
) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < a.radius + b.radius;
};
```

### 8. Score Not Updating
**Symptom:** Score displays but doesn't change during gameplay.

**Solution:** Ensure you're using the setter function correctly:
```typescript
// Wrong - stale closure
setScore(score + 10);

// Correct - use updater function
setScore(s => s + 10);
```

## Debugging Tips

1. **Add console.logs** in game loop to track state
2. **Draw debug info** on canvas:
   ```typescript
   ctx.fillStyle = 'white';
   ctx.font = '12px monospace';
   ctx.fillText(`FPS: ${fps}`, 10, 20);
   ctx.fillText(`Objects: ${objects.length}`, 10, 35);
   ```
3. **Use React DevTools** to inspect component state
4. **Check browser console** for errors
5. **Test on multiple devices** (desktop, tablet, phone)
