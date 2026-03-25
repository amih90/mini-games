import { useRef, useCallback } from 'react';
import { getTrackPosition } from './Track';

// ─── Types ───────────────────────────────────────────────────
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CarState {
  angle: number;        // Position on track (radians, 0 = start)
  speed: number;        // Current speed (radians/s along track)
  laneOffset: number;   // Lateral offset from track center (-2 to 2)
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
  friction: number;
}

export interface RaceState {
  player: CarState;
  aiCars: CarState[];
  raceTime: number;
  countdown: number;    // 3→0 countdown, then -1 = racing
  raceFinished: boolean;
  playerPosition: number;
  playerSpeedPct: number; // 0-100 for HUD display
}

// ─── Constants ───────────────────────────────────────────────
const TRACK_RADIUS_X = 14;
const TRACK_RADIUS_Z = 8;
const TWO_PI = Math.PI * 2;
const LANE_WIDTH = 1.2;
const MAX_LANE_OFFSET = 2.0;
const CHECKPOINT_COUNT = 4;
const CAR_HITBOX = 1.6; // Collision distance between cars

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
    maxSpeed: 1.6,
    acceleration: 1.0,
    braking: 2.0,
    steerSpeed: 4.0,
    autoAccelerate: true,
    aiAggressiveness: 0.55,
    friction: 0.3,
  },
  medium: {
    maxSpeed: 2.2,
    acceleration: 1.3,
    braking: 2.5,
    steerSpeed: 4.5,
    autoAccelerate: false,
    aiAggressiveness: 0.75,
    friction: 0.25,
  },
  hard: {
    maxSpeed: 2.8,
    acceleration: 1.5,
    braking: 3.0,
    steerSpeed: 5.0,
    autoAccelerate: false,
    aiAggressiveness: 0.95,
    friction: 0.2,
  },
};

// ─── Helpers ─────────────────────────────────────────────────
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

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
    playerSpeedPct: 0,
  });

  const aiTargetLanes = useRef<number[]>([]);
  const aiSpeedFactors = useRef<number[]>([]);

  const initRace = useCallback(() => {
    const numOpponents = levelConfig.opponents;

    // Initialize AI cars in a staggered grid AROUND the player
    const aiCars: CarState[] = [];
    const targetLanes: number[] = [];
    const speedFactors: number[] = [];

    for (let i = 0; i < numOpponents; i++) {
      // Grid: alternate left/right lanes, stagger by row
      const row = Math.floor(i / 2);
      const side = i % 2 === 0 ? -1 : 1;
      const startAngle = -((row + 1) * 0.06); // Slightly behind in rows
      const lane = side * LANE_WIDTH * 0.6;
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
        levelConfig.aiSpeedBase + (Math.random() - 0.5) * levelConfig.aiSpeedVariance * 2,
      );
    }

    raceState.current = {
      player: { angle: 0, speed: 0, laneOffset: 0, laps: 0, lastCheckpoint: 0, finished: false },
      aiCars,
      raceTime: 0,
      countdown: 3,
      raceFinished: false,
      playerPosition: numOpponents + 1,
      playerSpeedPct: 0,
    };
    aiTargetLanes.current = targetLanes;
    aiSpeedFactors.current = speedFactors;
  }, [levelConfig]);

  const update = useCallback((
    delta: number,
    steerInput: number,
    accelerating: boolean,
    braking: boolean,
    onLapComplete: (lap: number) => void,
    onRaceFinish: (position: number) => void,
  ) => {
    const state = raceState.current;
    const dt = Math.min(delta, 0.05); // Cap delta

    // ── Countdown ──
    if (state.countdown > -1) {
      state.countdown -= dt;
      if (state.countdown <= -1) state.countdown = -1;
      return { ...state };
    }

    if (state.raceFinished) return { ...state };

    state.raceTime += dt;

    // ── Player physics ──
    const player = state.player;
    if (!player.finished) {
      // Acceleration / braking / friction
      if (accelerating || settings.autoAccelerate) {
        player.speed += settings.acceleration * dt;
      } else if (braking) {
        player.speed -= settings.braking * dt;
      } else {
        player.speed -= settings.friction * dt;
      }
      player.speed = clamp(player.speed, 0, settings.maxSpeed);

      // Steering — lateral offset (feels like changing lanes)
      if (steerInput !== 0) {
        player.laneOffset += steerInput * settings.steerSpeed * dt;
        player.laneOffset = clamp(player.laneOffset, -MAX_LANE_OFFSET, MAX_LANE_OFFSET);
      }

      // Angular speed depends on lane offset — outside lane is longer path
      // This creates a real overtaking mechanic: inside lane = faster laps
      const effectiveRadius = TRACK_RADIUS_X + player.laneOffset * 0.3;
      player.angle += (player.speed / effectiveRadius) * dt * TRACK_RADIUS_X;

      updateLaps(player, levelConfig.laps, onLapComplete);
    }

    // Speed for HUD (0-100%)
    state.playerSpeedPct = Math.round((player.speed / settings.maxSpeed) * 100);

    // ── AI cars ──
    state.aiCars.forEach((aiCar, i) => {
      if (aiCar.finished) return;

      const factor = aiSpeedFactors.current[i];
      const targetSpeed = settings.maxSpeed * factor * settings.aiAggressiveness;

      // AI ramps up speed (faster than player to create challenge)
      if (aiCar.speed < targetSpeed) {
        aiCar.speed += settings.acceleration * 0.9 * dt;
      } else {
        aiCar.speed -= settings.friction * 0.5 * dt;
      }
      aiCar.speed = clamp(aiCar.speed, 0, settings.maxSpeed * 1.05);

      // AI lane changes — try to find open lanes and avoid collisions
      if (Math.random() < 0.02) {
        // Random target lane
        aiTargetLanes.current[i] = (Math.random() - 0.5) * MAX_LANE_OFFSET * 1.5;
      }

      // Smooth lane movement
      const laneDiff = aiTargetLanes.current[i] - aiCar.laneOffset;
      aiCar.laneOffset += clamp(laneDiff * 3 * dt, -2 * dt, 2 * dt);
      aiCar.laneOffset = clamp(aiCar.laneOffset, -MAX_LANE_OFFSET, MAX_LANE_OFFSET);

      // Move along track
      const aiEffective = TRACK_RADIUS_X + aiCar.laneOffset * 0.3;
      aiCar.angle += (aiCar.speed / aiEffective) * dt * TRACK_RADIUS_X;

      updateLaps(aiCar, levelConfig.laps, () => {});
    });

    // ── Collisions (bump between cars) ──
    const playerPos = getTrackPosition(player.angle, TRACK_RADIUS_X, TRACK_RADIUS_Z, player.laneOffset);
    state.aiCars.forEach((aiCar) => {
      if (aiCar.finished) return;
      const aiPos = getTrackPosition(aiCar.angle, TRACK_RADIUS_X, TRACK_RADIUS_Z, aiCar.laneOffset);
      const dx = playerPos.x - aiPos.x;
      const dz = playerPos.z - aiPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < CAR_HITBOX && dist > 0.01) {
        const overlap = (CAR_HITBOX - dist) * 0.5;
        const pushX = (dx / dist) * overlap;
        const pushZ = (dz / dist) * overlap;
        // Push player laterally (lane shift) and slow down
        player.laneOffset += pushX * 0.15;
        player.laneOffset = clamp(player.laneOffset, -MAX_LANE_OFFSET, MAX_LANE_OFFSET);
        player.speed *= 0.92;
        // Push AI too
        aiCar.laneOffset -= pushX * 0.1;
        aiCar.laneOffset = clamp(aiCar.laneOffset, -MAX_LANE_OFFSET, MAX_LANE_OFFSET);
        aiCar.speed *= 0.95;
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
