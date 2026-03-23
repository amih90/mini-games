import { useEffect } from 'react';

/**
 * Listens for Space / Enter key presses and triggers `onPlayAgain`
 * when the game-over overlay is visible (`active === true`).
 */
export function usePlayAgainKey(active: boolean, onPlayAgain: () => void) {
  useEffect(() => {
    if (!active) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onPlayAgain();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onPlayAgain]);
}
