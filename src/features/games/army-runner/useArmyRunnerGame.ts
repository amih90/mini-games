'use client';

import { useCallback, useRef, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Phase = 'menu' | 'playing' | 'paused' | 'won' | 'lost';

export interface DifficultySettings {
  speed: number;
  startSoldiers: number;
  obstacleFrequency: number;
  enemyMultiplier: number;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: { speed: 5, startSoldiers: 1, obstacleFrequency: 0.25, enemyMultiplier: 0.6 },
  medium: { speed: 7, startSoldiers: 1, obstacleFrequency: 0.4, enemyMultiplier: 1.0 },
  hard: { speed: 9, startSoldiers: 1, obstacleFrequency: 0.55, enemyMultiplier: 1.4 },
};

export type GateOp = '+' | '-' | 'x' | '÷';

export interface GateData {
  op: GateOp;
  value: number;
  side: 'left' | 'right';
}

export interface GatePair {
  type: 'gate-pair';
  z: number;
  left: { op: GateOp; value: number };
  right: { op: GateOp; value: number };
  triggered: boolean;
}

export type ObstacleKind = 'rotating-bar' | 'moving-wall' | 'saw-blade' | 'narrow-passage';

export interface ObstacleSegment {
  type: 'obstacle';
  z: number;
  kind: ObstacleKind;
  triggered: boolean;
}

export interface EnemySegment {
  type: 'enemy';
  z: number;
  count: number;
  triggered: boolean;
}

export interface CoinSegment {
  type: 'coins';
  z: number;
  x: number;
  collected: boolean;
}

export interface BossSegment {
  type: 'boss';
  z: number;
  triggered: boolean;
}

export type Segment = GatePair | ObstacleSegment | EnemySegment | CoinSegment | BossSegment;

export interface SoldierOffset {
  x: number;
  z: number;
  phase: number; // animation phase offset
}

export interface GameState {
  soldierCount: number;
  soldierOffsets: SoldierOffset[];
  trackZ: number;
  groupX: number;
  targetGroupX: number;
  speed: number;
  coins: number;
  score: number;
  level: number;
  segments: Segment[];
  totalTrackLength: number;
  elapsedTime: number;
}

// ─── Constants ──────────────────────────────────────────────
export const TRACK_WIDTH = 6;
const HALF_TRACK = TRACK_WIDTH / 2;
const SEGMENT_SPACING = 12;
const SEGMENTS_PER_LEVEL = 22;
const TRIGGER_DISTANCE = 1.5;
const GROUP_MOVE_SPEED = 12;
const MAX_VISUAL_SOLDIERS = 80;
const ARMY_HALF_WIDTH = 0.6;
const NARROW_GAP_WIDTH = 2.0;

// Per-obstacle-type spatial collision check
function checkObstacleCollision(kind: ObstacleKind, groupX: number, elapsedTime: number): boolean {
  const armyLeft = groupX - ARMY_HALF_WIDTH;
  const armyRight = groupX + ARMY_HALF_WIDTH;

  switch (kind) {
    case 'rotating-bar': {
      // Bar is 5 units long, 0.3 wide, rotates around Y at center.
      // At any angle, the bar projects onto the X axis as cos(angle)*2.5
      const angle = elapsedTime * 2.5;
      const barHalfSpan = Math.abs(Math.cos(angle)) * 2.5;
      const barLeft = -barHalfSpan;
      const barRight = barHalfSpan;
      return armyRight > barLeft && armyLeft < barRight;
    }
    case 'moving-wall': {
      // Wall is 2 units wide, oscillates with sin(t*2) * 2.5
      const wallX = Math.sin(elapsedTime * 2) * 2.5;
      const wallHalfWidth = 1.0;
      return armyRight > wallX - wallHalfWidth && armyLeft < wallX + wallHalfWidth;
    }
    case 'saw-blade': {
      // Circular blade at center with radius 1.2
      const bladeRadius = 1.2;
      return armyRight > -bladeRadius && armyLeft < bladeRadius;
    }
    case 'narrow-passage': {
      // Walls on both sides, gap of 2.0 centered at 0
      const gapHalf = NARROW_GAP_WIDTH / 2;
      return armyLeft < -gapHalf || armyRight > gapHalf;
    }
    default:
      return false;
  }
}

// ─── Helpers ────────────────────────────────────────────────
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSoldierOffsets(count: number): SoldierOffset[] {
  const offsets: SoldierOffset[] = [];
  const visualCount = Math.min(count, MAX_VISUAL_SOLDIERS);
  const cols = Math.ceil(Math.sqrt(visualCount));
  for (let i = 0; i < visualCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    offsets.push({
      x: (col - (cols - 1) / 2) * 0.45 + (Math.random() - 0.5) * 0.15,
      z: -row * 0.45 + (Math.random() - 0.5) * 0.15,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return offsets;
}

function generateGateOp(level: number): { op: GateOp; value: number } {
  const rand = Math.random();
  if (rand < 0.35 + level * 0.01) {
    return { op: '+', value: Math.floor(Math.random() * 8) + 2 };
  } else if (rand < 0.55 + level * 0.01) {
    return { op: '-', value: Math.floor(Math.random() * 5) + 1 };
  } else if (rand < 0.8) {
    return { op: 'x', value: Math.random() < 0.5 ? 2 : 3 };
  }
  return { op: '÷', value: Math.random() < 0.5 ? 2 : 3 };
}

function generateGatePair(level: number): { left: { op: GateOp; value: number }; right: { op: GateOp; value: number } } {
  const left = generateGateOp(level);
  let right = generateGateOp(level);
  // Ensure the two sides are never identical
  let attempts = 0;
  while (right.op === left.op && right.value === left.value && attempts < 10) {
    right = generateGateOp(level);
    attempts++;
  }
  return { left, right };
}

function generateLevel(level: number, settings: DifficultySettings): Segment[] {
  const segments: Segment[] = [];
  let z = 30;

  for (let i = 0; i < SEGMENTS_PER_LEVEL; i++) {
    const progress = i / SEGMENTS_PER_LEVEL;
    const rand = Math.random();

    if (i % 3 === 0) {
      // Gate pair every 3rd segment
      const pair = generateGatePair(level);
      segments.push({
        type: 'gate-pair',
        z,
        left: pair.left,
        right: pair.right,
        triggered: false,
      });
    } else if (rand < settings.obstacleFrequency && progress < 0.9) {
      const kinds: ObstacleKind[] = ['rotating-bar', 'moving-wall', 'saw-blade', 'narrow-passage'];
      segments.push({
        type: 'obstacle',
        z,
        kind: randomChoice(kinds),
        triggered: false,
      });
    } else if (rand < settings.obstacleFrequency + 0.25 && progress > 0.2) {
      const baseCount = Math.floor(3 + level * 2 + progress * 10);
      segments.push({
        type: 'enemy',
        z,
        count: Math.floor(baseCount * settings.enemyMultiplier),
        triggered: false,
      });
    } else {
      segments.push({
        type: 'coins',
        z,
        x: (Math.random() - 0.5) * TRACK_WIDTH * 0.6,
        collected: false,
      });
    }

    z += SEGMENT_SPACING + Math.random() * 4;
  }

  // Boss at end
  segments.push({ type: 'boss', z: z + 10, triggered: false });

  return segments;
}

function applyGateOp(count: number, op: GateOp, value: number): number {
  if (op === '+') return count + value;
  if (op === '-') return count - value;
  if (op === 'x') return count * value;
  if (op === '÷') return Math.floor(count / value);
  return count;
}

// ─── Standalone state update functions (outside React) ──────
function updateGameFrame(state: GameState, delta: number): string[] {
  const events: string[] = [];
  const clampedDelta = Math.min(delta, 0.05);

  // Advance track
  state.trackZ += state.speed * clampedDelta;
  state.elapsedTime += clampedDelta;

  // Move group horizontally
  const dx = state.targetGroupX - state.groupX;
  const moveAmount = GROUP_MOVE_SPEED * clampedDelta;
  if (Math.abs(dx) > 0.01) {
    state.groupX += Math.sign(dx) * Math.min(Math.abs(dx), moveAmount);
  }

  // Check segments
  for (const seg of state.segments) {
    const dist = seg.z - state.trackZ;

    if (dist > 20 || dist < -5) continue;

    if (dist < TRIGGER_DISTANCE && dist > -TRIGGER_DISTANCE) {
      if (seg.type === 'gate-pair' && !seg.triggered) {
        seg.triggered = true;
        const chosenGate = state.groupX < 0 ? seg.left : seg.right;
        const oldCount = state.soldierCount;
        state.soldierCount = applyGateOp(state.soldierCount, chosenGate.op, chosenGate.value);
        state.soldierCount = Math.max(0, Math.min(state.soldierCount, 200));
        if (state.soldierCount !== oldCount) {
          state.soldierOffsets = generateSoldierOffsets(state.soldierCount);
          events.push(state.soldierCount > oldCount ? 'powerup' : 'hit');
        }
      }

      if (seg.type === 'obstacle' && !seg.triggered) {
        if (checkObstacleCollision(seg.kind, state.groupX, state.elapsedTime)) {
          seg.triggered = true;
          const loss = seg.kind === 'narrow-passage'
            ? Math.ceil(state.soldierCount * 0.3)
            : Math.ceil(state.soldierCount * 0.25);
          state.soldierCount = Math.max(0, state.soldierCount - loss);
          state.soldierOffsets = generateSoldierOffsets(state.soldierCount);
          events.push('hit');
        }
      }

      if (seg.type === 'enemy' && !seg.triggered) {
        // Enemy group is centered at X=0 with a spread based on count
        const enemyCols = Math.ceil(Math.sqrt(Math.min(seg.count, 40)));
        const enemyHalfWidth = ((enemyCols - 1) / 2) * 0.45 + 0.25;
        const armyLeft = state.groupX - ARMY_HALF_WIDTH;
        const armyRight = state.groupX + ARMY_HALF_WIDTH;

        if (armyRight > -enemyHalfWidth && armyLeft < enemyHalfWidth) {
          seg.triggered = true;
          if (state.soldierCount > seg.count) {
            state.soldierCount -= seg.count;
            state.score += seg.count * 10;
            events.push('combat-win');
          } else {
            state.soldierCount = 0;
            events.push('combat-lose');
          }
          state.soldierOffsets = generateSoldierOffsets(state.soldierCount);
        }
      }

      if (seg.type === 'coins' && !(seg as CoinSegment).collected) {
        if (Math.abs(state.groupX - (seg as CoinSegment).x) < 1.5) {
          (seg as CoinSegment).collected = true;
          state.coins += 5;
          events.push('coin');
        }
      }

      if (seg.type === 'boss' && !seg.triggered) {
        seg.triggered = true;
        if (state.soldierCount > 0) {
          state.score += state.soldierCount * 50 + state.coins * 10;
          events.push('level-complete');
        }
      }
    }
  }

  if (state.soldierCount <= 0) {
    events.push('game-over');
  }

  return events;
}

function initGameState(settings: DifficultySettings, level: number): GameState {
  const segments = generateLevel(level, settings);
  const totalLength = segments.length > 0 ? segments[segments.length - 1].z : 100;
  return {
    soldierCount: settings.startSoldiers,
    soldierOffsets: generateSoldierOffsets(settings.startSoldiers),
    trackZ: 0,
    groupX: 0,
    targetGroupX: 0,
    speed: settings.speed + (level - 1) * 0.5,
    coins: 0,
    score: 0,
    level,
    segments,
    totalTrackLength: totalLength,
    elapsedTime: 0,
  };
}

// ─── Hook ───────────────────────────────────────────────────
export function useArmyRunnerGame() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [displaySoldierCount, setDisplaySoldierCount] = useState(5);
  const [displayCoins, setDisplayCoins] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [displayProgress, setDisplayProgress] = useState(0);

  const gameStateRef = useRef<GameState>(initGameState(DIFFICULTY_SETTINGS.medium, 1));
  const settingsRef = useRef<DifficultySettings>(DIFFICULTY_SETTINGS.medium);

  const startGame = useCallback((diff: Difficulty) => {
    const settings = DIFFICULTY_SETTINGS[diff];
    settingsRef.current = settings;
    gameStateRef.current = initGameState(settings, 1);

    setDisplaySoldierCount(settings.startSoldiers);
    setDisplayCoins(0);
    setDisplayScore(0);
    setDisplayLevel(1);
    setDisplayProgress(0);
    setPhase('playing');
  }, []);

  const nextLevel = useCallback(() => {
    const prevState = gameStateRef.current;
    const newLevel = prevState.level + 1;
    const newState = initGameState(settingsRef.current, newLevel);
    newState.coins = prevState.coins;
    newState.score = prevState.score;
    newState.soldierCount = prevState.soldierCount;
    newState.soldierOffsets = prevState.soldierOffsets;
    gameStateRef.current = newState;

    setDisplayLevel(newLevel);
    setDisplayProgress(0);
    setPhase('playing');
  }, []);

  const pause = useCallback(() => setPhase('paused'), []);
  const resume = useCallback(() => setPhase('playing'), []);

  const moveGroup = useCallback((deltaX: number) => {
    const state = gameStateRef.current;
    state.targetGroupX = Math.max(-HALF_TRACK + 0.5, Math.min(HALF_TRACK - 0.5, state.targetGroupX + deltaX));
  }, []);

  const setGroupTarget = useCallback((x: number) => {
    const state = gameStateRef.current;
    state.targetGroupX = Math.max(-HALF_TRACK + 0.5, Math.min(HALF_TRACK - 0.5, x));
  }, []);

  const frameCountRef = useRef(0);

  const updateFrame = useCallback((delta: number): string[] => {
    const state = gameStateRef.current;
    const events = updateGameFrame(state, delta);

    // Throttle React state updates to ~10fps to avoid parent re-renders causing canvas flashing
    frameCountRef.current++;
    if (frameCountRef.current % 6 === 0 || events.length > 0) {
      const progress = state.totalTrackLength > 0 ? Math.min(state.trackZ / state.totalTrackLength, 1) : 0;
      setDisplaySoldierCount(state.soldierCount);
      setDisplayCoins(state.coins);
      setDisplayScore(state.score);
      setDisplayProgress(progress);
    }

    return events;
  }, []);

  const handleEvents = useCallback((events: string[], sounds: {
    playPowerUp: () => void;
    playHit: () => void;
    playShoot: () => void;
    playGameOver: () => void;
    playWin: () => void;
    playSuccess: () => void;
    playLevelUp: () => void;
  }) => {
    for (const event of events) {
      switch (event) {
        case 'powerup':
          sounds.playPowerUp();
          break;
        case 'hit':
          sounds.playHit();
          break;
        case 'combat-win':
          sounds.playShoot();
          break;
        case 'combat-lose':
          sounds.playHit();
          break;
        case 'coin':
          sounds.playSuccess();
          break;
        case 'level-complete':
          sounds.playLevelUp();
          setTimeout(() => setPhase('won'), 500);
          break;
        case 'game-over':
          sounds.playGameOver();
          setTimeout(() => setPhase('lost'), 300);
          break;
      }
    }
  }, []);

  return {
    phase,
    setPhase,
    displaySoldierCount,
    displayCoins,
    displayScore,
    displayLevel,
    displayProgress,
    gameStateRef,
    startGame,
    nextLevel,
    pause,
    resume,
    moveGroup,
    setGroupTarget,
    updateFrame,
    handleEvents,
  };
}
