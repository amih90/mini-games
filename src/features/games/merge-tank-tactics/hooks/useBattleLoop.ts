'use client';

import { useEffect, useRef } from 'react';
import { BattleRound } from '../types';

export type FXPhase = 'idle' | 'projectile' | 'hit';

interface UseBattleLoopOptions {
  isActive: boolean;
  totalRounds: number;
  onRoundAdvance: (round: number) => void;
  onFXPhase: (phase: FXPhase) => void;
  onBattleEnd: () => void;
  roundMs?: number;
}

/**
 * Drives the battle animation sequence.
 * Advances through rounds with timed FX phases:
 *   0 → projectile (700ms) → hit (400ms) → idle → next round
 */
export function useBattleLoop({
  isActive,
  totalRounds,
  onRoundAdvance,
  onFXPhase,
  onBattleEnd,
  roundMs = 1800,
}: UseBattleLoopOptions) {
  const roundRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(isActive);
  activeRef.current = isActive;

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearTimeout(timerRef.current);
      roundRef.current = 0;
      return;
    }

    roundRef.current = 0;
    onFXPhase('idle');

    function advance() {
      if (!activeRef.current) return;
      const round = roundRef.current;
      if (round >= totalRounds) {
        onFXPhase('idle');
        onBattleEnd();
        return;
      }
      roundRef.current = round + 1;
      onRoundAdvance(roundRef.current);
      onFXPhase('projectile');

      timerRef.current = setTimeout(() => {
        if (!activeRef.current) return;
        onFXPhase('hit');
        timerRef.current = setTimeout(advance, roundMs * 0.4);
      }, roundMs * 0.5);
    }

    // Initial short delay before first round fires
    timerRef.current = setTimeout(advance, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, totalRounds, roundMs]);
}
