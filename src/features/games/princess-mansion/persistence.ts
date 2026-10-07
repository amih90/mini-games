import { ACTIVITIES, DIFFICULTIES, NEED_IDS, PRINCESS_IDS, ROOM_IDS, ROOM_WIDTH, getStation, type PrincessId } from './data';
import type { ActiveActivity, MansionState, Princess, PrincessAutonomy, WaitingActivity } from './model';

export const SAVE_KEY = 'mini-games:princess-mansion:save';
export const BACKUP_KEY = `${SAVE_KEY}:backup`;
export const LOCK_KEY = 'mini-games:princess-mansion:writer';
export type SaveError = 'corruptSave' | 'newerSave' | 'storageUnavailable' | 'quota' | 'conflict';
export type ParsedSave = { kind: 'valid'; state: MansionState } | { kind: 'invalid'; error: 'corruptSave' | 'newerSave' };
export type LoadedSave = { kind: 'empty' } | { kind: 'valid'; state: MansionState } | { kind: 'recoverable'; state: MansionState } | { kind: 'invalid'; error: SaveError };
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

function object(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function number(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max; }
function integer(value: unknown, min = 0): value is number { return number(value, min) && Number.isSafeInteger(value); }
function member<T extends string>(value: unknown, values: readonly T[]): value is T { return typeof value === 'string' && values.some(item => item === value); }

export function parseSave(raw: string): ParsedSave {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return { kind: 'invalid', error: 'corruptSave' }; }
  if (!object(value)) return { kind: 'invalid', error: 'corruptSave' };
  if (integer(value.schemaVersion, 3)) return { kind: 'invalid', error: 'newerSave' };
  const bad: ParsedSave = { kind: 'invalid', error: 'corruptSave' };
  if ((value.schemaVersion !== 1 && value.schemaVersion !== 2) || typeof value.adventureId !== 'string' || value.adventureId.length < 1 || value.adventureId.length > 100 ||
    !integer(value.revision) || !number(value.savedAt) || !number(value.activeTime) || !integer(value.hearts) || !integer(value.nextActionId, 1) ||
    !member(value.difficulty, ['easy', 'medium', 'hard']) || !member(value.cameraRoom, ROOM_IDS) || !number(value.cameraCenterX, 0, ROOM_WIDTH * ROOM_IDS.length) || !member(value.selectedId, PRINCESS_IDS) ||
    typeof value.tutorialSeen !== 'boolean' || typeof value.collectionCelebrated !== 'boolean' || !Array.isArray(value.princesses) ||
    value.princesses.length < 1 || value.princesses.length > PRINCESS_IDS.length) return bad;
  const legacy = value.schemaVersion === 1;
  if (!legacy && (typeof value.ambientEnabled !== 'boolean' || typeof value.autonomyEnabled !== 'boolean')) return bad;
  const princesses: Princess[] = [];
  const ids = new Set<PrincessId>();
  const occupied = new Set<string>();
  const actions = new Set<number>();
  for (const item of value.princesses) {
    if (!object(item) || !member(item.id, PRINCESS_IDS) || ids.has(item.id) || !member(item.room, ROOM_IDS) || !number(item.x, 70, ROOM_WIDTH - 70) ||
      !number(item.y, 430, 490) || (item.facing !== 1 && item.facing !== -1) || !number(item.happiness, 0, 100) || !object(item.needs) ||
      !object(item.refusal) || !number(item.refusal.startedAt, -30000, value.activeTime) || !integer(item.refusal.attempts) ||
      !number(item.refusal.penalty, 0, 6) || !number(item.poutUntil)) return bad;
    const needs = { satiety: 0, energy: 0, hygiene: 0, toiletComfort: 0, fun: 0 };
    for (const need of NEED_IDS) {
      const score = item.needs[need];
      if (!number(score, 0, 100)) return bad;
      needs[need] = score;
    }
    let activity: ActiveActivity | WaitingActivity | null = null;
    if (item.activity !== null) {
      if (!object(item.activity) || typeof item.activity.stationId !== 'string') return bad;
      const station = getStation(item.activity.stationId);
      if (!station || station.room !== item.room) return bad;
      if (!legacy && !member(item.activity.source, ['player', 'princess'])) return bad;
      const source = item.activity.source === 'princess' && !legacy ? 'princess' : 'player';
      if (source === 'princess' && !['energy', 'fun'].includes(ACTIVITIES[station.activity].need)) return bad;
      if (item.activity.kind === 'active') {
        const duration = ACTIVITIES[station.activity].duration * DIFFICULTIES[value.difficulty].duration;
        if (!integer(item.activity.slot) || item.activity.slot >= station.slots.length ||
          !integer(item.activity.actionId, 1) || item.activity.actionId >= value.nextActionId || actions.has(item.activity.actionId) ||
          !number(item.activity.elapsed, 0, duration) || item.activity.elapsed >= duration || item.activity.duration !== duration ||
          !number(item.activity.initialNeed, 0, ACTIVITIES[station.activity].target - 8)) return bad;
        const occupancy = `${station.id}:${item.activity.slot}`;
        if (occupied.has(occupancy)) return bad;
        occupied.add(occupancy);
        actions.add(item.activity.actionId);
        activity = { kind: 'active', source, stationId: station.id, slot: item.activity.slot, actionId: item.activity.actionId, elapsed: item.activity.elapsed, duration, initialNeed: item.activity.initialNeed };
      } else if (item.activity.kind === 'waiting' && number(item.activity.queuedAt, 0, value.activeTime)) {
        activity = { kind: 'waiting', source, stationId: station.id, queuedAt: item.activity.queuedAt };
      } else return bad;
    }
    let autonomy: PrincessAutonomy = { nextDecisionAt: value.activeTime + 18000 + PRINCESS_IDS.indexOf(item.id) * 1200, walk: null };
    if (!legacy) {
      if (!object(item.autonomy) || !number(item.autonomy.nextDecisionAt)) return bad;
      autonomy = { nextDecisionAt: item.autonomy.nextDecisionAt, walk: null };
      if (item.autonomy.walk !== null) {
        const walk = item.autonomy.walk;
        if (activity || !value.autonomyEnabled || !object(walk) || !member(walk.room, ROOM_IDS) || !number(walk.x, 70, ROOM_WIDTH - 70) ||
          (walk.stationId !== null && typeof walk.stationId !== 'string')) return bad;
        if (typeof walk.stationId === 'string') {
          const destination = getStation(walk.stationId);
          if (!destination || destination.room !== walk.room || destination.x !== walk.x ||
            !['energy', 'fun'].includes(ACTIVITIES[destination.activity].need)) return bad;
        }
        autonomy.walk = { room: walk.room, x: walk.x, stationId: walk.stationId };
      }
    }
    ids.add(item.id);
    princesses.push({
      id: item.id, room: item.room, x: item.x, y: item.y, facing: item.facing, happiness: item.happiness, needs, activity,
      refusal: { startedAt: item.refusal.startedAt, attempts: item.refusal.attempts, penalty: item.refusal.penalty }, poutUntil: item.poutUntil, autonomy,
    });
  }
  if (!ids.has('liora') || !ids.has(value.selectedId)) return bad;
  return { kind: 'valid', state: {
    schemaVersion: 2, adventureId: value.adventureId, revision: value.revision, savedAt: value.savedAt, difficulty: value.difficulty,
    activeTime: value.activeTime, hearts: value.hearts, nextActionId: value.nextActionId, cameraRoom: value.cameraRoom, cameraCenterX: value.cameraCenterX,
    selectedId: value.selectedId, tutorialSeen: value.tutorialSeen, collectionCelebrated: value.collectionCelebrated,
    ambientEnabled: legacy ? true : value.ambientEnabled === true, autonomyEnabled: legacy ? true : value.autonomyEnabled === true, princesses,
  } };
}

export class MansionSaveStore {
  private expectedRaw: string | null | undefined;
  constructor(private storage: StoragePort) {}

  load(): LoadedSave {
    try {
      this.expectedRaw = this.storage.getItem(SAVE_KEY);
      if (this.expectedRaw === null) return { kind: 'empty' };
      const primary = parseSave(this.expectedRaw);
      if (primary.kind === 'valid') return primary;
      if (primary.error === 'newerSave') return { kind: 'invalid', error: primary.error };
      const backup = this.storage.getItem(BACKUP_KEY);
      if (backup !== null) {
        const parsed = parseSave(backup);
        if (parsed.kind === 'valid') return { kind: 'recoverable', state: parsed.state };
      }
      return { kind: 'invalid', error: 'corruptSave' };
    } catch (error) {
      console.warn('Princess Mansion storage is unavailable', error);
      return { kind: 'invalid', error: 'storageUnavailable' };
    }
  }

  save(state: MansionState): { ok: true; state: MansionState } | { ok: false; error: SaveError } {
    const snapshot: MansionState = { ...state, revision: state.revision + 1, savedAt: Date.now() };
    const serialized = JSON.stringify(snapshot);
    if (parseSave(serialized).kind !== 'valid') throw new Error('Refusing to persist an invalid Princess Mansion snapshot');
    try {
      const current = this.storage.getItem(SAVE_KEY);
      if (this.expectedRaw === undefined || current !== this.expectedRaw) return { ok: false, error: 'conflict' };
      if (current !== null && parseSave(current).kind === 'valid') this.storage.setItem(BACKUP_KEY, current);
      this.storage.setItem(SAVE_KEY, serialized);
      this.expectedRaw = serialized;
      return { ok: true, state: snapshot };
    } catch (error) {
      console.warn('Princess Mansion could not save', error);
      return { ok: false, error: error instanceof DOMException && error.name === 'QuotaExceededError' ? 'quota' : 'storageUnavailable' };
    }
  }
}
