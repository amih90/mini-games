import {
  ACTIVITIES, DECAY, DIFFICULTIES, NEED_IDS, PRINCESS_IDS, PRINCESSES, ROOM_IDS,
  ROOM_WIDTH, STATIONS, clamp, getStation, type Difficulty, type NeedId, type PrincessId, type RoomId, type Station,
} from './data';

export interface ActiveActivity {
  kind: 'active';
  source: 'player' | 'princess';
  stationId: string;
  slot: number;
  actionId: number;
  elapsed: number;
  duration: number;
  initialNeed: number;
}
export interface WaitingActivity {
  kind: 'waiting';
  source: 'player' | 'princess';
  stationId: string;
  queuedAt: number;
}
export interface PrincessAutonomy {
  nextDecisionAt: number;
  walk: { room: RoomId; x: number; stationId: string | null } | null;
}
export interface Princess {
  id: PrincessId;
  room: RoomId;
  x: number;
  y: number;
  facing: -1 | 1;
  needs: Record<NeedId, number>;
  happiness: number;
  activity: ActiveActivity | WaitingActivity | null;
  refusal: { startedAt: number; attempts: number; penalty: number };
  poutUntil: number;
  autonomy: PrincessAutonomy;
}
export interface MansionState {
  schemaVersion: 2;
  adventureId: string;
  revision: number;
  savedAt: number;
  difficulty: Difficulty;
  activeTime: number;
  hearts: number;
  nextActionId: number;
  cameraRoom: RoomId;
  cameraCenterX: number;
  selectedId: PrincessId;
  tutorialSeen: boolean;
  collectionCelebrated: boolean;
  ambientEnabled: boolean;
  autonomyEnabled: boolean;
  princesses: Princess[];
}
export type GameEffect =
  | { type: 'completed'; princessId: PrincessId; stationId: string }
  | { type: 'refused' | 'insisted' | 'queued'; princessId: PrincessId; stationId: string }
  | { type: 'invited'; princessId: PrincessId }
  | { type: 'wandering'; princessId: PrincessId }
  | { type: 'autonomous'; princessId: PrincessId; stationId: string }
  | { type: 'placed' | 'selected' }
  | { type: 'error'; code: 'invalidAction' };
export type Command =
  | { type: 'select'; id: PrincessId; focus?: boolean }
  | { type: 'camera'; room: RoomId; centerX?: number }
  | { type: 'cancel'; id: PrincessId; focus?: boolean }
  | { type: 'place'; id: PrincessId; room: RoomId; x: number; y: number; stationId?: string }
  | { type: 'invite'; id: PrincessId }
  | { type: 'ambient'; enabled: boolean }
  | { type: 'autonomy'; enabled: boolean }
  | { type: 'tutorial' }
  | { type: 'celebrated' };
export interface Transition { state: MansionState; effects: GameEffect[] }

function makePrincess(id: PrincessId, room: RoomId, index: number, activeTime = 0): Princess {
  return {
    id, room, x: index === 0 ? 940 : 100 + (index * 105) % 850, y: 480, facing: 1,
    needs: { satiety: index === 0 ? 27 : 67, energy: 76, hygiene: 74, toiletComfort: 70, fun: 66 },
    happiness: 80, activity: null, refusal: { startedAt: -30000, attempts: 0, penalty: 0 }, poutUntil: 0,
    autonomy: { nextDecisionAt: activeTime + 18000 + index * 1200, walk: null },
  };
}

export function createAdventure(difficulty: Difficulty, adventureId: string): MansionState {
  const princess = makePrincess('liora', 'dining', 0);
  return {
    schemaVersion: 2, adventureId, revision: 0, savedAt: 0, difficulty, activeTime: 0,
    hearts: 0, nextActionId: 1, cameraRoom: 'dining', cameraCenterX: ROOM_WIDTH * 2 + princess.x, selectedId: 'liora',
    tutorialSeen: false, collectionCelebrated: false, ambientEnabled: true, autonomyEnabled: true, princesses: [princess],
  };
}

export function occupiedSlots(state: MansionState, stationId: string): number[] {
  return state.princesses.flatMap(princess => princess.activity?.kind === 'active' && princess.activity.stationId === stationId ? [princess.activity.slot] : []);
}

function stationExitX(station: Station): number {
  const right = station.x + station.width / 2 + 55;
  return clamp(right > ROOM_WIDTH - 70 ? station.x - station.width / 2 - 55 : right, 70, ROOM_WIDTH - 70);
}

function withPrincess(state: MansionState, princess: Princess): MansionState {
  return { ...state, princesses: state.princesses.map(item => item.id === princess.id ? princess : item) };
}

function refuse(state: MansionState, princess: Princess, stationId: string): { princess: Princess; effect: GameEffect } {
  const reset = state.activeTime - princess.refusal.startedAt >= 30000;
  const previous = reset ? { startedAt: state.activeTime, attempts: 0, penalty: 0 } : princess.refusal;
  const loss = previous.attempts > 0 ? Math.min(2, 6 - previous.penalty) : 0;
  return {
    princess: { ...princess, activity: null, poutUntil: state.activeTime + 2300, happiness: clamp(princess.happiness - loss, 0, 100), refusal: { startedAt: previous.startedAt, attempts: previous.attempts + 1, penalty: previous.penalty + loss } },
    effect: { type: previous.attempts > 0 ? 'insisted' : 'refused', princessId: princess.id, stationId },
  };
}

function startAtStation(state: MansionState, princess: Princess, stationId: string, focus = true, autonomous = false): Transition {
  const station = getStation(stationId);
  if (!station || station.room !== princess.room) return { state, effects: [{ type: 'error', code: 'invalidAction' }] };
  const definition = ACTIVITIES[station.activity];
  if (definition.target - princess.needs[definition.need] < 8) {
    const refusal = refuse(state, princess, stationId);
    return { state: { ...state, cameraCenterX: focus ? ROOM_IDS.indexOf(station.room) * ROOM_WIDTH + stationExitX(station) : state.cameraCenterX, princesses: state.princesses.map(item => item.id === princess.id ? { ...refusal.princess, x: stationExitX(station), y: 490 } : item) }, effects: [refusal.effect] };
  }
  const occupied = occupiedSlots(state, stationId);
  const slot = station.slots.findIndex((_, index) => !occupied.includes(index));
  const activity: ActiveActivity | WaitingActivity = slot < 0
    ? { kind: 'waiting', source: autonomous ? 'princess' : 'player', stationId, queuedAt: state.activeTime }
    : { kind: 'active', source: autonomous ? 'princess' : 'player', stationId, slot, actionId: state.nextActionId, elapsed: 0, duration: definition.duration * DIFFICULTIES[state.difficulty].duration, initialNeed: princess.needs[definition.need] };
  const queueIndex = state.princesses.filter(item => item.id !== princess.id && item.activity?.kind === 'waiting' && item.activity.stationId === stationId).length;
  const exit = stationExitX(station);
  const updated: Princess = {
    ...princess, activity, autonomy: { nextDecisionAt: state.activeTime + 28000, walk: null },
    x: slot < 0 ? clamp(exit + (exit > station.x ? 1 : -1) * Math.floor(queueIndex / 3) * 55, 70, ROOM_WIDTH - 70) : station.x + station.slots[slot],
    y: slot < 0 ? 490 - queueIndex % 3 * 26 : 480,
  };
  return {
    state: { ...state, cameraCenterX: focus ? ROOM_IDS.indexOf(station.room) * ROOM_WIDTH + (slot < 0 ? updated.x : station.x) : state.cameraCenterX, nextActionId: state.nextActionId + (slot < 0 ? 0 : 1), princesses: state.princesses.map(item => item.id === princess.id ? updated : item) },
    effects: slot < 0 ? [{ type: 'queued', princessId: princess.id, stationId }] : autonomous ? [{ type: 'autonomous', princessId: princess.id, stationId }] : [{ type: 'placed' }],
  };
}

export function command(state: MansionState, action: Command): Transition {
  if (action.type === 'tutorial') return { state: { ...state, tutorialSeen: true }, effects: [] };
  if (action.type === 'celebrated') return { state: { ...state, collectionCelebrated: true }, effects: [] };
  if (action.type === 'ambient' || action.type === 'autonomy') {
    if (typeof action.enabled !== 'boolean') return { state, effects: [{ type: 'error', code: 'invalidAction' }] };
    return { state: action.type === 'ambient' ? { ...state, ambientEnabled: action.enabled } : {
      ...state, autonomyEnabled: action.enabled,
      princesses: state.princesses.map(princess => ({
        ...princess, activity: !action.enabled && princess.activity?.kind === 'waiting' && princess.activity.source === 'princess' ? null : princess.activity,
        autonomy: { nextDecisionAt: state.activeTime + 18000 + PRINCESS_IDS.indexOf(princess.id) * 1200, walk: null },
      })),
    }, effects: [] };
  }
  if (action.type === 'camera') {
    if (!ROOM_IDS.includes(action.room)) return { state, effects: [{ type: 'error', code: 'invalidAction' }] };
    const centerX = action.centerX ?? (ROOM_IDS.indexOf(action.room) + 0.5) * ROOM_WIDTH;
    if (!Number.isFinite(centerX)) return { state, effects: [{ type: 'error', code: 'invalidAction' }] };
    return { state: { ...state, cameraRoom: action.room, cameraCenterX: clamp(centerX, 0, ROOM_IDS.length * ROOM_WIDTH) }, effects: [] };
  }
  if (action.type === 'invite') {
    if (!PRINCESS_IDS.includes(action.id) || state.princesses.some(item => item.id === action.id) || state.hearts < PRINCESSES[action.id].invitation) {
      return { state, effects: [{ type: 'error', code: 'invalidAction' }] };
    }
    return { state: { ...state, selectedId: action.id, princesses: [...state.princesses, makePrincess(action.id, state.cameraRoom, state.princesses.length, state.activeTime)] }, effects: [{ type: 'invited', princessId: action.id }] };
  }
  const princess = state.princesses.find(item => item.id === action.id);
  if (!princess) return { state, effects: [{ type: 'error', code: 'invalidAction' }] };
  if (action.type === 'select') return { state: {
    ...state, selectedId: princess.id,
    ...(action.focus === false ? {} : { cameraRoom: princess.room, cameraCenterX: ROOM_IDS.indexOf(princess.room) * ROOM_WIDTH + princess.x }),
  }, effects: [{ type: 'selected' }] };
  if (action.type === 'cancel') {
    const autonomy = { nextDecisionAt: state.activeTime + 28000, walk: null };
    if (!princess.activity) return { state: { ...state, princesses: state.princesses.map(item => item.id === princess.id ? { ...item, autonomy } : item) }, effects: [] };
    const station = getStation(princess.activity.stationId);
    if (!station) return { state, effects: [{ type: 'error', code: 'invalidAction' }] };
    return { state: { ...state, cameraCenterX: action.focus !== false && princess.id === state.selectedId && princess.room === state.cameraRoom ? ROOM_IDS.indexOf(princess.room) * ROOM_WIDTH + stationExitX(station) : state.cameraCenterX, princesses: state.princesses.map(item => item.id === princess.id ? { ...item, activity: null, autonomy, x: stationExitX(station), y: 490 } : item) }, effects: [] };
  }
  if (!ROOM_IDS.includes(action.room) || !Number.isFinite(action.x) || !Number.isFinite(action.y)) return { state, effects: [{ type: 'error', code: 'invalidAction' }] };
  if (action.stationId && getStation(action.stationId)?.room !== action.room) return { state, effects: [{ type: 'error', code: 'invalidAction' }] };
  const moved: Princess = { ...princess, activity: null, autonomy: { nextDecisionAt: state.activeTime + 28000, walk: null }, room: action.room, x: clamp(action.x, 70, ROOM_WIDTH - 70), y: clamp(action.y, 430, 490), facing: ROOM_IDS.indexOf(action.room) * ROOM_WIDTH + action.x < ROOM_IDS.indexOf(princess.room) * ROOM_WIDTH + princess.x ? -1 : 1 };
  const next = { ...state, cameraRoom: action.room, selectedId: princess.id, princesses: state.princesses.map(item => item.id === princess.id ? moved : item) };
  return action.stationId ? startAtStation(next, moved, action.stationId) : { state: next, effects: [{ type: 'placed' }] };
}

function chooseAutonomy(state: MansionState, princess: Princess): PrincessAutonomy {
  const index = PRINCESS_IDS.indexOf(princess.id);
  const nextDecisionAt = state.activeTime + 14000 + index * 900;
  const worldX = ROOM_IDS.indexOf(princess.room) * ROOM_WIDTH + princess.x;
  const resting = princess.needs.energy < 38;
  const playful = princess.needs.fun < 80 && (Math.floor(state.activeTime / 28000) + index) % 3 === 2;
  if (resting || playful) {
    const candidates = STATIONS.filter(station => {
      const definition = ACTIVITIES[station.activity];
      const reserved = state.princesses.filter(item => item.autonomy.walk?.stationId === station.id).length;
      return definition.need === (resting ? 'energy' : 'fun') && definition.target - princess.needs[definition.need] >= 8 &&
        Math.abs(ROOM_IDS.indexOf(station.room) - ROOM_IDS.indexOf(princess.room)) <= 2 &&
        occupiedSlots(state, station.id).length + reserved < station.slots.length;
    });
    candidates.sort((a, b) => {
      const score = (station: Station) => Math.abs(ROOM_IDS.indexOf(station.room) * ROOM_WIDTH + station.x - worldX) - (PRINCESSES[princess.id].favorite === station.activity ? 480 : 0);
      return score(a) - score(b);
    });
    if (candidates[0]) return { nextDecisionAt, walk: { room: candidates[0].room, x: candidates[0].x, stationId: candidates[0].id } };
  }
  const direction = (Math.floor(state.activeTime / 14000) + index) % 2 ? -1 : 1;
  const distance = 78 + index * 7;
  let x = clamp(princess.x + direction * distance, 100, ROOM_WIDTH - 100);
  if (Math.abs(x - princess.x) < 20) x = clamp(princess.x - direction * distance, 100, ROOM_WIDTH - 100);
  return { nextDecisionAt, walk: { room: princess.room, x, stationId: null } };
}

export function advance(state: MansionState, milliseconds: number, held: ReadonlySet<PrincessId> = new Set()): Transition {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) throw new RangeError('Active simulation time must be finite and non-negative');
  if (milliseconds === 0) return { state, effects: [] };
  const effects: GameEffect[] = [];
  let current = state;
  let remaining = milliseconds;
  while (remaining > 0) {
    const step = Math.min(100, remaining);
    remaining -= step;
    const seconds = step / 1000;
    let hearts = current.hearts;
    let cameraCenterX = current.cameraCenterX;
    const princesses = current.princesses.map(princess => {
      const needs = { ...princess.needs };
      for (const need of NEED_IDS) needs[need] = clamp(needs[need] - DECAY[need] * DIFFICULTIES[current.difficulty].decay * seconds, 0, 100);
      let activity = princess.activity;
      let x = princess.x;
      let y = princess.y;
      let happiness = clamp(princess.happiness + (Math.min(...Object.values(needs)) < 20 ? -0.08 : 0.025) * seconds, 0, 100);
      let autonomy = princess.autonomy;
      if (activity?.kind === 'active') {
        const station = getStation(activity.stationId);
        if (!station) throw new Error(`Missing active station: ${activity.stationId}`);
        const definition = ACTIVITIES[station.activity];
        const elapsed = Math.min(activity.duration, activity.elapsed + step);
        const gain = (definition.target - activity.initialNeed) * (elapsed - activity.elapsed) / activity.duration;
        needs[definition.need] = clamp(needs[definition.need] + gain, 0, 100);
        if (elapsed >= activity.duration) {
          needs[definition.need] = definition.target;
          const favorite = PRINCESSES[princess.id].favorite === station.activity;
          happiness = clamp(happiness + (favorite ? 4 : 2), 0, 100);
          hearts += favorite ? 2 : 1;
          effects.push({ type: 'completed', princessId: princess.id, stationId: station.id });
          x = stationExitX(station);
          y = 490;
          if (activity.source === 'player' && princess.id === current.selectedId && princess.room === current.cameraRoom) cameraCenterX = ROOM_IDS.indexOf(princess.room) * ROOM_WIDTH + x;
          autonomy = { nextDecisionAt: current.activeTime + step + 28000, walk: null };
          activity = null;
        } else activity = { ...activity, elapsed };
      }
      return { ...princess, x, y, needs, happiness, activity, autonomy };
    });
    current = { ...current, activeTime: current.activeTime + step, princesses, hearts, cameraCenterX };
    for (const station of STATIONS) {
      const waiting = current.princesses.filter(item => item.activity?.kind === 'waiting' && item.activity.stationId === station.id)
        .sort((a, b) => (a.activity?.kind === 'waiting' ? a.activity.queuedAt : 0) - (b.activity?.kind === 'waiting' ? b.activity.queuedAt : 0));
      for (const princess of waiting) {
        if (occupiedSlots(current, station.id).length >= station.slots.length) break;
        const autonomous = princess.activity?.source === 'princess';
        const transition = startAtStation(current, princess, station.id, !autonomous && princess.id === current.selectedId && princess.room === current.cameraRoom, autonomous);
        current = transition.state;
        effects.push(...transition.effects);
      }
    }
    if (current.autonomyEnabled) for (const id of current.princesses.map(princess => princess.id)) {
      let princess = current.princesses.find(item => item.id === id);
      if (!princess || princess.activity || held.has(id) || princess.poutUntil > current.activeTime) continue;
      if (!princess.autonomy.walk && current.activeTime >= princess.autonomy.nextDecisionAt) {
        princess = { ...princess, autonomy: chooseAutonomy(current, princess) };
        current = withPrincess(current, princess);
        effects.push({ type: 'wandering', princessId: id });
      }
      const destination = princess.autonomy.walk;
      if (!destination) continue;
      const from = ROOM_IDS.indexOf(princess.room) * ROOM_WIDTH + princess.x;
      const target = ROOM_IDS.indexOf(destination.room) * ROOM_WIDTH + destination.x;
      const distance = target - from;
      const speed = (76 + PRINCESS_IDS.indexOf(id) * 3) * seconds;
      const position = Math.abs(distance) <= speed ? target : from + Math.sign(distance) * speed;
      let index = clamp(Math.floor(position / ROOM_WIDTH), 0, ROOM_IDS.length - 1);
      let x = position - index * ROOM_WIDTH;
      if (distance > 0 && x > ROOM_WIDTH - 70 && index < ROOM_IDS.indexOf(destination.room)) { index++; x = 70; }
      else if (distance < 0 && x < 70 && index > ROOM_IDS.indexOf(destination.room)) { index--; x = ROOM_WIDTH - 70; }
      princess = { ...princess, room: ROOM_IDS[index], x: clamp(x, 70, ROOM_WIDTH - 70), y: Math.min(490, princess.y + 24 * seconds), facing: distance < 0 ? -1 : 1 };
      const arrived = Math.abs(distance) <= speed;
      if (arrived) princess = { ...princess, autonomy: { ...princess.autonomy, walk: null } };
      current = withPrincess(current, princess);
      if (arrived && destination.stationId) {
        const station = getStation(destination.stationId);
        if (!station) throw new Error(`Missing autonomous station: ${destination.stationId}`);
        if (ACTIVITIES[station.activity].target - princess.needs[ACTIVITIES[station.activity].need] >= 8) {
          const transition = startAtStation(current, princess, station.id, false, true);
          current = transition.state;
          effects.push(...transition.effects);
        }
      }
    }
  }
  return { state: current, effects };
}

export class MansionController {
  state: MansionState;
  private snapshots = new Set<(state: MansionState) => void>();
  private effects = new Set<(effect: GameEffect) => void>();
  private pauses = new Set<string>();
  private frameTime = 0;
  private notifyTime = 0;
  private held = new Map<string, PrincessId>();
  disposed = false;

  constructor(state: MansionState) { this.state = state; }
  get paused(): boolean { return this.pauses.size > 0 || this.disposed; }
  subscribe(listener: (state: MansionState) => void): () => void { this.snapshots.add(listener); return () => { this.snapshots.delete(listener); }; }
  onEffect(listener: (effect: GameEffect) => void): () => void { this.effects.add(listener); return () => { this.effects.delete(listener); }; }
  pause(reason: string, enabled: boolean): void {
    if (enabled) this.pauses.add(reason); else this.pauses.delete(reason);
    this.frameTime = 0;
  }
  hold(owner: string, id: PrincessId | null): void { if (id) this.held.set(owner, id); else this.held.delete(owner); }
  private apply(result: Transition): void {
    if (this.disposed) return;
    this.state = result.state;
    for (const effect of result.effects) for (const listener of this.effects) listener(effect);
  }
  dispatch(action: Command): void {
    this.apply(command(this.state, action));
    this.notify();
  }
  tick(delta: number): void {
    if (this.paused) return;
    this.frameTime += clamp(delta, 0, 250);
    this.notifyTime += delta;
    if (this.frameTime >= 100) {
      const amount = Math.floor(this.frameTime / 100) * 100;
      this.frameTime -= amount;
      this.apply(advance(this.state, amount, new Set(this.held.values())));
    }
    if (this.notifyTime >= 250) { this.notifyTime = 0; this.notify(); }
  }
  commit(state: MansionState): void { if (!this.disposed) { this.state = state; this.notify(); } }
  private notify(): void { if (!this.disposed) for (const listener of this.snapshots) listener(this.state); }
  dispose(): void { this.disposed = true; this.snapshots.clear(); this.effects.clear(); this.held.clear(); }
}
