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
  tireWear: number;     // 0 = fresh, 100 = fully worn
  inPit: boolean;       // Currently in pit
  pitTimer: number;     // Seconds remaining in pit stop
  personality: 'aggressive' | 'defensive' | 'steady';
  isDrafting: boolean;
  draftTarget: number;
  overtaking: boolean;
  defending: boolean;
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
  playerTireWear: number; // 0-100 for HUD
  playerInPit: boolean;
  playerBraking: boolean;
  playerDrafting: boolean;
  playerDraftBoost: number;
}

// ─── Constants ───────────────────────────────────────────────
const TRACK_RADIUS_X = 14;
const TRACK_RADIUS_Z = 8;
const TWO_PI = Math.PI * 2;
const LANE_WIDTH = 1.2;
const MAX_LANE_OFFSET = 2.0;
const CHECKPOINT_COUNT = 4;
const CAR_HITBOX = 1.6; // Collision distance between cars

// Pit stop constants
const PIT_ENTRY_ANGLE_MIN = -0.5;
const PIT_ENTRY_ANGLE_MAX = 0.1;
const PIT_STOP_DURATION = 3.0;   // Seconds for tire change
const TIRE_WEAR_RATE = 2.5;      // Wear per second at full speed
const TIRE_WEAR_PENALTY = 0.3;   // Max speed multiplier at 100% wear (30% of max)

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

// ─── Drafting / slipstream constants ─────────────────────────
const DRAFT_RANGE = 2.8;
const DRAFT_MAX_BOOST = 0.08;
const DRAFT_LANE_TOLERANCE = 0.85;

interface DraftResult { boost: number; isDrafting: boolean; draftTarget: number; }

function getDraftBoost(
  followerAngle: number,
  followerLane: number,
  allCars: { angle: number; laneOffset: number; finished: boolean }[],
): DraftResult {
  let bestBoost = 0;
  let draftTarget = -1;
  const followerNorm = normalizeAngle(followerAngle);
  const approxRangeRad = DRAFT_RANGE / TRACK_RADIUS_X;

  for (let i = 0; i < allCars.length; i++) {
    const car = allCars[i];
    if (car.finished) continue;
    const carNorm = normalizeAngle(car.angle);
    let angleDiff = carNorm - followerNorm;
    if (angleDiff < 0) angleDiff += TWO_PI;
    if (angleDiff < 0.02 || angleDiff > approxRangeRad * 1.5) continue;
    const laneDiff = Math.abs(car.laneOffset - followerLane);
    if (laneDiff > DRAFT_LANE_TOLERANCE) continue;
    const trackDist = angleDiff * TRACK_RADIUS_X;
    if (trackDist > DRAFT_RANGE) continue;
    const distFactor = Math.max(0, 1 - trackDist / DRAFT_RANGE);
    const laneFactor = Math.max(0, 1 - laneDiff / DRAFT_LANE_TOLERANCE);
    const boost = DRAFT_MAX_BOOST * distFactor * laneFactor;
    if (boost > bestBoost) { bestBoost = boost; draftTarget = i; }
  }
  return { boost: bestBoost, isDrafting: bestBoost > 0.01, draftTarget };
}

function getTrackSection(angle: number): 'front-straight' | 'turn-1-2' | 'back-straight' | 'turn-3-4' {
  const n = normalizeAngle(angle);
  if (n < 0.5 || n > TWO_PI - 0.5) return 'front-straight';
  if (n > 0.5 && n < Math.PI - 0.5) return 'turn-1-2';
  if (n > Math.PI - 0.5 && n < Math.PI + 0.5) return 'back-straight';
  return 'turn-3-4';
}

const SECTION_SPEED: Record<string, number> = {
  'front-straight': 1.0,
  'turn-1-2': 0.88,
  'back-straight': 0.97,
  'turn-3-4': 0.88,
};

function getIdealLane(
  personality: string,
  section: string,
  playerLane: number,
  carLane: number,
  isDefending: boolean,
): number {
  const base: Record<string, number> = {
    'front-straight': -0.4,
    'turn-1-2': 1.1,
    'back-straight': -0.3,
    'turn-3-4': 1.1,
  };
  let target = base[section] ?? 0;
  if (personality === 'aggressive') target -= 0.3;
  if (isDefending) target = playerLane; // block!
  return clamp(target, -MAX_LANE_OFFSET, MAX_LANE_OFFSET);
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
    player: { angle: 0, speed: 0, laneOffset: 0, laps: 0, lastCheckpoint: 0, finished: false, tireWear: 0, inPit: false, pitTimer: 0, personality: 'steady', isDrafting: false, draftTarget: -1, overtaking: false, defending: false },
    aiCars: [],
    raceTime: 0,
    countdown: 3,
    raceFinished: false,
    playerPosition: 1,
    playerSpeedPct: 0,
    playerTireWear: 0,
    playerInPit: false,
    playerBraking: false,
    playerDrafting: false,
    playerDraftBoost: 0,
  });

  const aiTargetLanes = useRef<number[]>([]);
  const aiSpeedFactors = useRef<number[]>([]);
  const rubberBandMultiplier = useRef(1.0);

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
        tireWear: 0,
        inPit: false,
        pitTimer: 0,
        personality: (['aggressive', 'defensive', 'steady', 'aggressive', 'defensive'] as const)[i % 5],
        isDrafting: false,
        draftTarget: -1,
        overtaking: false,
        defending: false,
      });
      targetLanes.push(lane);
      speedFactors.push(
        levelConfig.aiSpeedBase + (Math.random() - 0.5) * levelConfig.aiSpeedVariance * 2,
      );
    }

    raceState.current = {
      player: { angle: 0, speed: 0, laneOffset: 0, laps: 0, lastCheckpoint: 0, finished: false, tireWear: 0, inPit: false, pitTimer: 0, personality: 'steady', isDrafting: false, draftTarget: -1, overtaking: false, defending: false },
      aiCars,
      raceTime: 0,
      countdown: 3,
      raceFinished: false,
      playerPosition: numOpponents + 1,
      playerSpeedPct: 0,
      playerTireWear: 0,
      playerInPit: false,
      playerBraking: false,
      playerDrafting: false,
      playerDraftBoost: 0,
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
    pitRequested: boolean = false,
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
      // ── Pit stop handling ──
      if (player.inPit) {
        player.speed = 0;
        player.pitTimer -= dt;
        if (player.pitTimer <= 0) {
          player.inPit = false;
          player.pitTimer = 0;
          player.tireWear = 0; // Fresh tires!
        }
        state.playerInPit = player.inPit;
        state.playerTireWear = player.tireWear;
        // Skip rest of player physics while in pit
      } else {
        // Check pit entry: player near pit entry zone + requested
        const normalizedAngle = normalizeAngle(player.angle);
        const inPitZone = normalizedAngle > normalizeAngle(PIT_ENTRY_ANGLE_MIN) && normalizedAngle < normalizeAngle(PIT_ENTRY_ANGLE_MAX);
        if (pitRequested && inPitZone && !player.inPit) {
          player.inPit = true;
          player.pitTimer = PIT_STOP_DURATION;
          player.speed = 0;
        } else {
          // Tire wear penalty on max speed
          const wearFactor = 1 - (player.tireWear / 100) * (1 - TIRE_WEAR_PENALTY);

          // Acceleration / braking / friction
          if (accelerating || settings.autoAccelerate) {
            player.speed += settings.acceleration * dt;
          } else if (braking) {
            player.speed -= settings.braking * dt;
          } else {
            player.speed -= settings.friction * dt;
          }
          player.speed = clamp(player.speed, 0, settings.maxSpeed * wearFactor);

          // Tire wear increases with speed
          player.tireWear = clamp(player.tireWear + TIRE_WEAR_RATE * (player.speed / settings.maxSpeed) * dt, 0, 100);

          // Steering — lateral offset (feels like changing lanes)
          if (steerInput !== 0) {
            player.laneOffset += steerInput * settings.steerSpeed * dt;
            player.laneOffset = clamp(player.laneOffset, -MAX_LANE_OFFSET, MAX_LANE_OFFSET);
          }

          // Angular speed depends on lane offset — outside lane is longer path
          const effectiveRadius = TRACK_RADIUS_X + player.laneOffset * 0.3;
          player.angle += (player.speed / effectiveRadius) * dt * TRACK_RADIUS_X;

          updateLaps(player, levelConfig.laps, onLapComplete);
        }
      }
      state.playerInPit = player.inPit;
      state.playerTireWear = Math.round(player.tireWear);
    }

    // ── Player drafting ──
    const aiCarsForDraft = state.aiCars.map(c => ({
      angle: c.angle, laneOffset: c.laneOffset, finished: c.finished,
    }));
    const playerDraft = getDraftBoost(player.angle, player.laneOffset, aiCarsForDraft);
    if (playerDraft.isDrafting && !player.inPit) {
      player.speed = Math.min(player.speed * (1 + playerDraft.boost), settings.maxSpeed * 1.12);
    }
    state.playerDrafting = playerDraft.isDrafting;
    state.playerDraftBoost = playerDraft.boost;

    // ── Player braking ──
    state.playerBraking = braking && player.speed > settings.maxSpeed * 0.3;

    // ── Corner speed cap for player ──
    const playerSection = getTrackSection(player.angle);
    const cornerCap = (SECTION_SPEED[playerSection] ?? 1.0) * settings.maxSpeed * (player.tireWear > 60 ? 0.92 : 1.0);
    if (!settings.autoAccelerate) {
      player.speed = Math.min(player.speed, cornerCap * (1 - (player.tireWear / 100) * (1 - TIRE_WEAR_PENALTY)));
    }

    // Speed for HUD (0-100%)
    state.playerSpeedPct = Math.round((player.speed / settings.maxSpeed) * 100);

    // ── AI cars ──
    state.aiCars.forEach((aiCar, i) => {
      if (aiCar.finished) return;

      // AI pit stop handling
      if (aiCar.inPit) {
        aiCar.speed = 0;
        aiCar.pitTimer -= dt;
        if (aiCar.pitTimer <= 0) {
          aiCar.inPit = false;
          aiCar.pitTimer = 0;
          aiCar.tireWear = 0;
        }
        return;
      }

      // AI decides to pit when tire wear is high (70-90% threshold, varies per AI)
      const pitThreshold = 70 + (i % 3) * 10;
      const aiNormAngle = normalizeAngle(aiCar.angle);
      const aiInPitZone = aiNormAngle > normalizeAngle(PIT_ENTRY_ANGLE_MIN) && aiNormAngle < normalizeAngle(PIT_ENTRY_ANGLE_MAX);
      if (aiCar.tireWear > pitThreshold && aiInPitZone && aiCar.laps >= 1 && aiCar.laps < levelConfig.laps - 1) {
        aiCar.inPit = true;
        aiCar.pitTimer = PIT_STOP_DURATION * (0.9 + Math.random() * 0.2);
        aiCar.speed = 0;
        return;
      }

      // ── Section-aware speed ──
      const section = getTrackSection(aiCar.angle);
      const sectionMult = SECTION_SPEED[section] ?? 1.0;
      const factor = aiSpeedFactors.current[i];
      const aiWearFactor = 1 - (aiCar.tireWear / 100) * (1 - TIRE_WEAR_PENALTY);
      const targetSpeed = settings.maxSpeed * factor * settings.aiAggressiveness * aiWearFactor * sectionMult * rubberBandMultiplier.current;

      if (aiCar.speed < targetSpeed) {
        aiCar.speed += settings.acceleration * 0.9 * dt;
      } else {
        aiCar.speed -= settings.friction * 0.5 * dt;
      }
      aiCar.speed = clamp(aiCar.speed, 0, settings.maxSpeed * 1.05);

      // ── Drafting ──
      const allCarsForDraft = [
        { angle: player.angle, laneOffset: player.laneOffset, finished: player.finished },
        ...state.aiCars.map((c, ci) => ({ angle: c.angle, laneOffset: c.laneOffset, finished: c.finished || ci === i })),
      ];
      // exclude self (i+1 in combined array)
      allCarsForDraft[i + 1].finished = true; // suppress self
      const aiDraft = getDraftBoost(aiCar.angle, aiCar.laneOffset, allCarsForDraft);
      aiCar.isDrafting = aiDraft.isDrafting;
      aiCar.draftTarget = aiDraft.draftTarget;
      if (aiDraft.isDrafting) {
        aiCar.speed = Math.min(aiCar.speed * (1 + aiDraft.boost), settings.maxSpeed * 1.12);
      }

      // ── Racing line / lane AI ──
      const playerIsJustAhead = (() => {
        const diff = normalizeAngle(player.angle - aiCar.angle);
        return diff > 0.01 && diff < 0.35;
      })();
      const playerIsJustBehind = (() => {
        const diff = normalizeAngle(aiCar.angle - player.angle);
        return diff > 0.01 && diff < 0.35;
      })();

      aiCar.defending = aiCar.personality === 'defensive' && playerIsJustBehind;
      aiCar.overtaking = aiCar.personality === 'aggressive' && playerIsJustAhead;

      if (aiCar.isDrafting && aiDraft.draftTarget >= 0) {
        // Drafting: match leader's lane
        const leaderLane = aiDraft.draftTarget === 0 ? player.laneOffset : state.aiCars[aiDraft.draftTarget - 1]?.laneOffset ?? 0;
        aiTargetLanes.current[i] = leaderLane;
      } else if (aiCar.overtaking) {
        // Slingshot: take opposite lane to make a pass
        aiCar.speed = Math.min(aiCar.speed * 1.025, settings.maxSpeed * 1.08);
        aiTargetLanes.current[i] = clamp(-player.laneOffset + (player.laneOffset > 0 ? -0.6 : 0.6), -MAX_LANE_OFFSET, MAX_LANE_OFFSET);
      } else {
        aiTargetLanes.current[i] = getIdealLane(aiCar.personality, section, player.laneOffset, aiCar.laneOffset, aiCar.defending);
      }

      const laneSpeed = aiCar.personality === 'aggressive' ? 4.5 : 3.0;
      const laneDiff2 = aiTargetLanes.current[i] - aiCar.laneOffset;
      aiCar.laneOffset += clamp(laneDiff2 * laneSpeed * dt, -3 * dt, 3 * dt);
      aiCar.laneOffset = clamp(aiCar.laneOffset, -MAX_LANE_OFFSET, MAX_LANE_OFFSET);

      // ── Tire wear ──
      aiCar.tireWear = clamp(aiCar.tireWear + TIRE_WEAR_RATE * (aiCar.speed / settings.maxSpeed) * dt, 0, 100);

      // ── Move along track ──
      const aiEffective = TRACK_RADIUS_X + aiCar.laneOffset * 0.3;
      aiCar.angle += (aiCar.speed / aiEffective) * dt * TRACK_RADIUS_X;

      updateLaps(aiCar, levelConfig.laps, () => {});
    });

    // ── Collisions (bump between cars) ──
    const playerPos = getTrackPosition(player.angle, TRACK_RADIUS_X, TRACK_RADIUS_Z, player.laneOffset);
    state.aiCars.forEach((aiCar) => {
      if (aiCar.finished || aiCar.inPit) return;
      const aiPos = getTrackPosition(aiCar.angle, TRACK_RADIUS_X, TRACK_RADIUS_Z, aiCar.laneOffset);
      const dx = playerPos.x - aiPos.x;
      const dz = playerPos.z - aiPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < CAR_HITBOX && dist > 0.01) {
        const overlap = CAR_HITBOX - dist;
        const playerAhead = normalizeAngle(player.angle - aiCar.angle) < Math.PI;
        if (playerAhead) {
          // Player rear-ended by AI — player gets minor push, AI slows hard
          player.speed = Math.min(player.speed + aiCar.speed * 0.02, settings.maxSpeed * 1.04);
          aiCar.speed *= 0.86;
        } else {
          // Player hit AI from behind
          player.speed *= 0.84;
          aiCar.speed *= 0.97;
        }
        player.laneOffset += (dx / dist) * overlap * 0.28;
        aiCar.laneOffset -= (dx / dist) * overlap * 0.22;
        player.laneOffset = clamp(player.laneOffset, -MAX_LANE_OFFSET, MAX_LANE_OFFSET);
        aiCar.laneOffset = clamp(aiCar.laneOffset, -MAX_LANE_OFFSET, MAX_LANE_OFFSET);
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

    // ── Rubber banding ──
    const totalCars = state.aiCars.length + 1;
    const posRatio = (state.playerPosition - 1) / Math.max(totalCars - 1, 1);
    const targetBand = 1.0 + (posRatio - 0.5) * 0.08;
    rubberBandMultiplier.current += (targetBand - rubberBandMultiplier.current) * dt * 0.25;
    rubberBandMultiplier.current = clamp(rubberBandMultiplier.current, 0.93, 1.07);

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
