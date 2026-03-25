'use client';

import { SoldierCrowd } from './SoldierCrowd';
import type { EnemySegment, SoldierOffset } from '../useArmyRunnerGame';
import { useMemo } from 'react';

interface EnemyGroupProps {
  enemy: EnemySegment;
}

export function EnemyGroup({ enemy }: EnemyGroupProps) {
  const offsets = useMemo(() => {
    const result: SoldierOffset[] = [];
    const visualCount = Math.min(enemy.count, 40);
    const cols = Math.ceil(Math.sqrt(visualCount));
    for (let i = 0; i < visualCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      result.push({
        x: (col - (cols - 1) / 2) * 0.45,
        z: -row * 0.45,
        phase: (i / visualCount) * Math.PI * 2,
      });
    }
    return result;
  }, [enemy.count]);

  return (
    <SoldierCrowd
      offsets={offsets}
      groupX={0}
      groupZ={enemy.z}
      color="#cc3333"
    />
  );
}
