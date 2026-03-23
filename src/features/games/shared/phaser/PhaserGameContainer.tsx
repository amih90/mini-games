'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

interface PhaserGameContainerProps {
  config: Phaser.Types.Core.GameConfig;
  className?: string;
}

/**
 * React wrapper that manages a Phaser game instance lifecycle.
 * Mounts Phaser into a div and destroys it on unmount.
 */
export function PhaserGameContainer({ config, className = '' }: PhaserGameContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || gameRef.current) return;

    const game = new Phaser.Game({
      ...config,
      parent: container,
    });
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
    // Config is constructed once per mount — intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className} />;
}
