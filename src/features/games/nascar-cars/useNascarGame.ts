import { useRef, useCallback } from 'react';
import { getTrackPosition } from './Track';
import { clamp } from '../shared/phaser/gameUtils';

// ─── Types ───────────────────────────────────────────────────
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CarState {
  angle: number;        // Position on track (radians, 0 = start)
  speed: number;        // Current speed
  laneOffset: number;   // Lateral offset from track center
  laps: number;         // Completed laps
  lastCheckpoint: number;
  finished: boolean;
}

export interface LevelConfig {
  name: string;
  laps: number;
  opponents: number;
  aiSpeedBase: number;
  aiSpeedVariance: number;
  unlocked: boolean;
}

export interface DifficultySettings {
  maxSpeed: number;
  acceleration: number;
  braking: number;
  steerSpeed: number;
  autoAccelerate: boolean;
  aiAggressiveness: number;
}

export interface RaceState {
  player: CarState;
  aiCars: CarState[];
  raceTime: number;
  countdown: number;    // 3, 2, 1, 0(go), -1(racing)
  raceFinished: boolean;
  playerPosition: number; // 1st, 2nd, etc.
}

// ─── Constants ───────────────────────────────────────────────
const TRACK_RADIUS_X = 14;
const TRACK_RADIUS_Z = 8;
const TWO_PI = Math.PI * 2;
const LANE_WIDTH = 1.2;
const MAX_LANE_OFFSET = 1.5;
const CHECKPOINT_COUNT = 4; // Split track into 4 checkpoints

export const GAME_CONSTANTS = {
  TRACK_RADIUS_X,
  TRACK_RADIUS_Z,
  LANE_WIDTH,
};

// ─── Career levels ───────────────────────────────────────────
export const CAREER_LEVELS: Record<string, Omit<LevelConfig, 'unlocked'>[]> = {
  en: [
    { name: 'Training', laps: 2, opponents: 2, aiSpeedBase: 0.6, aiSpeedVariance: 0.1 },
    { name: 'Local Cup', laps: 3, opponents: 4, aiSpeedBase: 0.7, aiSpeedVariance: 0.15 },
    { name: 'Regional Race', laps: 4, opponents: 6, aiSpeedBase: 0.8, aiSpeedVariance: 0.15 },
    { name: 'National League', laps: 5, opponents: 8, aiSpeedBase: 0.88, aiSpeedVariance: 0.12 },
    { name: 'Championship', laps: 6, opponents: 10, aiSpeedBase: 0.95, aiSpeedVariance: 0.1 },
  ],
  he: [
    { name: 'אימון', laps: 2, opponents: 2, aiSpeedBase: 0.6, aiSpeedVariance: 0.1 },
    { name: 'גביע מקומי', laps: 3, opponents: 4, aiSpeedBase: 0.7, aiSpeedVariance: 0.15 },
    { name: 'מירוץ אזורי', laps: 4, opponents: 6, aiSpeedBase: 0.8, aiSpeedVariance: 0.15 },
    { name: 'ליגה לאומית', laps: 5, opponents: 8, aiSpeedBase: 0.88, aiSpeedVariance: 0.12 },
    { name: 'אליפות', laps: 6, opponents: 10, aiSpeedBase: 0.95, aiSpeedVariance: 0.1 },
  ],
  zh: [
    { name: '训练', laps: 2, opponents: 2, aiSpeedBase: 0.6, aiSpeedVariance: 0.1 },
    { name: '本地杯', laps: 3, opponents: 4, aiSpeedBase: 0.7, aiSpeedVariance: 0.15 },
    { name: '区域赛', laps: 4, opponents: 6, aiSpeedBase: 0.8, aiSpeedVariance: 0.15 },
    { name: '全国联赛', laps: 5, opponents: 8, aiSpeedBase: 0.88, aiSpeedVariance: 0.12 },
    { name: '锦标赛', laps: 6, opponents: 10, aiSpeedBase: 0.95, aiSpeedVariance: 0.1 },
  ],
  es: [
    { name: 'Entrenamiento', laps: 2, opponents: 2, aiSpeedBase: 0.6, aiSpeedVariance: 0.1 },
    { name: 'Copa Local', laps: 3, opponents: 4, aiSpeedBase: 0.7, aiSpeedVariance: 0.15 },
    { name: 'Carrera Regional', laps: 4, opponents: 6, aiSpeedBase: 0.8, aiSpeedVariance: 0.15 },
    { name: 'Liga Nacional', laps: 5, opponents: 8, aiSpeedBase: 0.88, aiSpeedVariance: 0.12 },
    { name: 'Campeonato', laps: 6, opponents: 10, aiSpeedBase: 0.95, aiSpeedVariance: 0.1 },
  ],
};

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    maxSpeed: 3.0,
    acceleration: 1.8,
    braking: 3.0,
    steerSpeed: 2.5,
    autoAccelerate: true,
    aiAggressiveness: 0.5,
  },
  medium: {
    maxSpeed: 3.8,
    acceleration: 2.2,
    braking: 3.5,
    steerSpeed: 2.8,
    autoAccelerate: false,
    aiAggressiveness: 0.75,
  },
  hard: {
    maxSpeed: 4.5,
    acceleration: 2.5,
    braking: 4.0,
    steerSpeed: 3.0,
    autoAccelerate: false,
    aiAggressiveness: 1.0,
  },
};

// ─── Hook ────────────────────────────────────────────────────
export function useNascarGame(difficulty: Difficulty, levelIndex: number, locale: string) {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const levels = CAREER_LEVELS[locale] || CAREER_LEVELS.en;
  const levelConfig = levels[Math.min(levelIndex, levels.length - 1)];

  const raceState = useRef<RaceState>({
    player: { angle: 0, speed: 0, laneOffset: 0, laps: 0, lastCheckpoint: 0, finished: false },
    aiCars: [],
    raceTime: 0,
    countdown: 3,
    raceFinished: false,
    playerPosition: 1,
  });

  const aiTargetLanes = useRef<number[]>([]);
  const aiSpeedFactors = useRef<number[]>([]);

  const initRace = useCallback(() => {
    const numOpponents = levelConfig.opponents;

    // Initialize AI cars at staggered starting positions
    const aiCars: CarState[] = [];
    const targetLanes: number[] = [];
    const speedFactors: number[] = [];

    for (let i = 0; i < numOpponents; i++) {
      const startAngle = -((i + 1) * 0.08);
      const lane = ((i % 3) - 1) * LANE_WIDTH * 0.5;
      aiCars.push({
        angle: startAngle,
        speed: 0,
        laneOffset: lane,
        laps: 0,
        lastCheckpoint: 0,
        finished: false,
      });
      targetLanes.push(lane);
      speedFactors.push(
        levelConfig.aiSpeedBase + (Math.random() - 0.5) * levelConfig.aiSpeedVariance,
      );
    }

    raceState.current = {
      player: { angle: 0, speed: 0, laneOffset: 0, laps: 0, lastCheckpoint: 0, finished: false },
      aiCars,
      raceTime: 0,
      countdown: 3,
      raceFinished: false,
      playerPosition: numOpponents + 1,
    };
    aiTargetLanes.current = targetLanes;
    aiSpeedFactors.current = speedFactors;
  }, [levelConfig]);

  const update = useCallback((
    delta: number,
    steerInput: number,   // -1 (left) to 1 (right)
    accelerating: boolean,
    braking: boolean,
    onLapComplete: (lap: number) => void,
    onRaceFinish: (position: number) => void,
  ) => {
    const state = raceState.current;
    const clampedDelta = Math.min(delta, 0.05);

    // ── Countdown ──
    if (state.countdown > -1) {
      state.countdown -= clampedDelta;
      if (state.countdown <= -1) state.countdown = -1;
      return { ...state };
    }

    if (state.raceFinished) return { ...state };

    state.raceTime += clampedDelta;

    // ── Player physics ──
    const player = state.player;
    if (!player.finished) {
      // Acceleration
      if (accelerating || settings.autoAccelerate) {
        player.speed = Math.min(player.speed + settings.acceleration * clampedDelta, settings.maxSpeed);
      } else if (braking) {
        player.speed = Math.max(player.speed - settings.braking * clampedDelta, 0);
      } else {
        // Friction / coast
        player.speed = Math.max(player.speed - 0.5 * clampedDelta, 0);
      }

      // Steering — adjust lane offset
      player.laneOffset = clamp(
        player.laneOffset + steerInput * settings.steerSpeed * clampedDelta,
        -MAX_LANE_OFFSET,
        MAX_LANE_OFFSET,
      );

      // Move along track
      player.angle += player.speed * clampedDelta / TRACK_RADIUS_X;

      // Lap detection
      updateLaps(player, levelConfig.laps, onLapComplete);
    }

    // ── AI cars ──
    state.aiCars.forEach((aiCar, i) => {
      if (aiCar.finished) return;

      const factor = aiSpeedFactors.current[i] * settings.aiAggressiveness;
      const targetSpeed = settings.maxSpeed * factor;

      // AI accelerates to target speed with some variance
      if (aiCar.speed < targetSpeed) {
        aiCar.speed = Math.min(aiCar.speed + settings.acceleration * 0.8 * clampedDelta, targetSpeed);
      }

      // Random lane changes
      if (Math.random() < 0.01) {
        aiTargetLanes.current[i] = (Math.random() - 0.5) * LANE_WIDTH;
      }

      // Smooth lane movement
      const laneDiff = aiTargetLanes.current[i] - aiCar.laneOffset;
      aiCar.laneOffset += clamp(laneDiff, -1.5 * clampedDelta, 1.5 * clampedDelta);

      // Move along track
      aiCar.angle += aiCar.speed * clampedDelta / TRACK_RADIUS_X;

      // Lap detection
      updateLaps(aiCar, levelConfig.laps, () => {});
    });

    // ── Simple collision (bump) ──
    const playerPos = getTrackPosition(player.angle, TRACK_RADIUS_X, TRACK_RADIUS_Z, player.laneOffset);
    state.aiCars.forEach((aiCar) => {
      const aiPos = getTrackPosition(aiCar.angle, TRACK_RADIUS_X, TRACK_RADIUS_Z, aiCar.laneOffset);
      const dx = playerPos.x - aiPos.x;
      const dz = playerPos.z - aiPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 1.8) {
        // Push apart
        const push = (1.8 - dist) * 0.5;
        player.laneOffset += (dx > 0 ? 1 : -1) * push * 0.3;
        player.speed *= 0.95;
      }
    });

    // ── Calculate position ──
    const playerProgress = player.laps * TWO_PI + normalizeAngle(player.angle);
    let position = 1;
    state.aiCars.forEach((aiCar) => {
      const aiProgress = aiCar.laps * TWO_PI + normalizeAngle(aiCar.angle);
      if (aiProgress > playerProgress) position++;
    });
    state.playerPosition = position;

    // ── Check race finish ──
    if (player.finished && !state.raceFinished) {
      state.raceFinished = true;
      onRaceFinish(position);
    }
    // Also finish if all AI done and player done
    const allFinished = state.aiCars.every((c) => c.finished) && player.finished;
    if (allFinished && !state.raceFinished) {
      state.raceFinished = true;
      onRaceFinish(position);
    }

    return { ...state };
  }, [settings, levelConfig]);

  return {
    raceState,
    settings,
    levelConfig,
    initRace,
    update,
  };
}

// ─── Helpers ─────────────────────────────────────────────────
function normalizeAngle(angle: number): number {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

function updateLaps(
  car: CarState,
  targetLaps: number,
  onLap: (lap: number) => void,
) {
  const normalized = normalizeAngle(car.angle);
  const checkpoint = Math.floor((normalized / TWO_PI) * CHECKPOINT_COUNT);

  // Detect lap completion (crossed from last checkpoint region back to first)
  if (checkpoint === 0 && car.lastCheckpoint === CHECKPOINT_COUNT - 1) {
    car.laps++;
    onLap(car.laps);
    if (car.laps >= targetLaps) {
      car.finished = true;
    }
  }
  car.lastCheckpoint = checkpoint;
}
