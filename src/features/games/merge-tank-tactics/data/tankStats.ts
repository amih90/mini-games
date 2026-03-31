import { TankType } from '../types';

export interface TankStats {
  hp: number;
  atk: number;
  def: number;
  range: number;
}

const BASE_MELEE: TankStats = { hp: 100, atk: 20, def: 5, range: 1 };
const BASE_RANGE: TankStats = { hp: 70, atk: 25, def: 2, range: 3 };
const SCALE = 1.6;

export function getTankStats(type: TankType, level: number): TankStats {
  const base = type === 'melee' ? BASE_MELEE : BASE_RANGE;
  const factor = Math.pow(SCALE, level - 1);
  return {
    hp: Math.round(base.hp * factor),
    atk: Math.round(base.atk * factor),
    def: Math.round(base.def * factor),
    range: base.range,
  };
}

export const LEVEL_COLORS: Record<number, string> = {
  1: '#9ca3af', // gray
  2: '#4ade80', // green
  3: '#60a5fa', // blue
  4: '#a78bfa', // purple
  5: '#fbbf24', // gold
};

export const LEVEL_EMISSIVE: Record<number, string> = {
  1: '#000000',
  2: '#000000',
  3: '#000000',
  4: '#2d1b69',
  5: '#7a5c00',
};

export const TANK_COST_BASE = 10;
export const TANK_COST_INCREMENT = 2;

export function getTankCost(purchaseCount: number): number {
  return TANK_COST_BASE + purchaseCount * TANK_COST_INCREMENT;
}
