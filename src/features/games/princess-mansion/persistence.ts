import {
  ACTIVITIES, DESTINATION_IDS, DIFFICULTIES, LEGACY_ROOM_IDS, NEED_IDS, PRINCESS_IDS, PRINCESSES, RECIPES, RECIPE_IDS, ROOM_IDS, ROOM_WIDTH,
  destinationForRoom, getStation, worldForRoom, worldWidth, type ActivityId, type PrincessId,
} from './data';
import { MAX_TREATS, OUTFIT_IDS, TOY_IDS, TREAT_IDS, WELCOME_COINS, type OutfitSelection, type ToySelection } from './catalog';
import type { ActiveActivity, MansionState, PotionLesson, Princess, PrincessAutonomy, Trip, WaitingActivity } from './model';

export const SAVE_KEY = 'mini-games:princess-mansion:save';
export const BACKUP_KEY = `${SAVE_KEY}:backup`;
export const LOCK_KEY = 'mini-games:princess-mansion:writer';
export type SaveError = 'corruptSave' | 'newerSave' | 'storageUnavailable' | 'quota' | 'conflict';
export type ParsedSave = { kind: 'valid'; state: MansionState } | { kind: 'invalid'; error: 'corruptSave' | 'newerSave' };
export type LoadedSave = { kind: 'empty' } | { kind: 'valid'; state: MansionState } | { kind: 'recoverable'; state: MansionState } | { kind: 'invalid'; error: SaveError };
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

function object(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function number(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max; }
function integer(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number { return number(value, min, max) && Number.isSafeInteger(value); }
function member<T extends string>(value: unknown, values: readonly T[]): value is T { return typeof value === 'string' && values.some(item => item === value); }
function list<T extends string>(value: unknown, values: readonly T[]): T[] | null {
  if (!Array.isArray(value) || !value.every((item): item is T => member(item, values)) || new Set(value).size !== value.length) return null;
  return value;
}
function activityName(value: unknown): value is ActivityId { return typeof value === 'string' && Object.hasOwn(ACTIVITIES, value); }

export function parseSave(raw: string): ParsedSave {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return { kind: 'invalid', error: 'corruptSave' }; }
  if (!object(value)) return { kind: 'invalid', error: 'corruptSave' };
  if (integer(value.schemaVersion, 4)) return { kind: 'invalid', error: 'newerSave' };
  const bad: ParsedSave = { kind: 'invalid', error: 'corruptSave' };
  const legacy = value.schemaVersion === 1 || value.schemaVersion === 2;
  const original = value.schemaVersion === 1;
  const rooms = legacy ? LEGACY_ROOM_IDS : ROOM_IDS;
  if ((!legacy && value.schemaVersion !== 3) || typeof value.adventureId !== 'string' || value.adventureId.length < 1 || value.adventureId.length > 100 ||
    !integer(value.revision) || !number(value.savedAt) || !number(value.activeTime) || !integer(value.hearts) || !integer(value.nextActionId, 1) ||
    !member(value.difficulty, ['easy', 'medium', 'hard']) || !member(value.cameraRoom, rooms) || !number(value.cameraCenterX, 0, legacy ? ROOM_WIDTH * LEGACY_ROOM_IDS.length : worldWidth(value.cameraRoom)) || !member(value.selectedId, PRINCESS_IDS) ||
    typeof value.tutorialSeen !== 'boolean' || typeof value.collectionCelebrated !== 'boolean' || !Array.isArray(value.princesses) ||
    value.princesses.length < 1 || value.princesses.length > PRINCESS_IDS.length) return bad;
  if (!original && (typeof value.ambientEnabled !== 'boolean' || typeof value.autonomyEnabled !== 'boolean')) return bad;
  let coins = WELCOME_COINS;
  let inventory: MansionState['inventory'] = { outfits: [], toys: [], treats: { strawberry: 0, vanilla: 0, blueberry: 0 } };
  let acknowledgedInvitationIds: PrincessId[] = [];
  let destinationClocks: MansionState['destinationClocks'] = { home: value.activeTime, mall: 0, beach: 0 };
  let trip: Trip | null = null;
  if (!legacy) {
    if (!integer(value.coins) || !object(value.inventory) || !object(value.inventory.treats) || !object(value.destinationClocks)) return bad;
    const outfits = list(value.inventory.outfits, OUTFIT_IDS);
    const toys = list(value.inventory.toys, TOY_IDS);
    const acknowledgements = list(value.acknowledgedInvitationIds, PRINCESS_IDS);
    if (!outfits || !toys || !acknowledgements) return bad;
    const treats = { strawberry: 0, vanilla: 0, blueberry: 0 };
    for (const id of TREAT_IDS) {
      if (!integer(value.inventory.treats[id], 0, MAX_TREATS)) return bad;
      treats[id] = value.inventory.treats[id];
    }
    const clocks = { home: 0, mall: 0, beach: 0 };
    for (const destination of DESTINATION_IDS) {
      if (!number(value.destinationClocks[destination], 0, value.activeTime)) return bad;
      clocks[destination] = value.destinationClocks[destination];
    }
    if (Math.abs(clocks.home + clocks.mall + clocks.beach - value.activeTime) > 0.001) return bad;
    coins = value.coins;
    inventory = { outfits, toys, treats };
    acknowledgedInvitationIds = acknowledgements;
    destinationClocks = clocks;
    if (value.trip !== null) {
      if (!object(value.trip) || !member(value.trip.destination, ['mall', 'beach']) || !object(value.trip.homeCamera) ||
        !member(value.trip.homeCamera.room, ROOM_IDS) || destinationForRoom(value.trip.homeCamera.room) !== 'home' ||
        !number(value.trip.homeCamera.centerX, 0, worldWidth(value.trip.homeCamera.room)) || !Array.isArray(value.trip.returns)) return bad;
      const companions = list(value.trip.companions, PRINCESS_IDS);
      if (!companions || companions.length < 1 || value.trip.returns.length !== companions.length) return bad;
      const returns: Trip['returns'] = [];
      for (const anchor of value.trip.returns) {
        if (!object(anchor) || !member(anchor.id, companions) || returns.some(item => item.id === anchor.id) ||
          !member(anchor.room, ROOM_IDS) || destinationForRoom(anchor.room) !== 'home' || !number(anchor.x, 70, ROOM_WIDTH - 70) ||
          !number(anchor.y, 430, 490) || (anchor.facing !== 1 && anchor.facing !== -1)) return bad;
        returns.push({ id: anchor.id, room: anchor.room, x: anchor.x, y: anchor.y, facing: anchor.facing });
      }
      trip = { destination: value.trip.destination, companions, returns, homeCamera: { room: value.trip.homeCamera.room, centerX: value.trip.homeCamera.centerX } };
    }
    if (destinationForRoom(value.cameraRoom) !== (trip?.destination ?? 'home')) return bad;
  }
  const princesses: Princess[] = [];
  const ids = new Set<PrincessId>();
  const occupied = new Set<string>();
  const actions = new Set<number>();
  for (const item of value.princesses) {
    if (!object(item) || !member(item.id, PRINCESS_IDS) || ids.has(item.id) || !member(item.room, rooms) || !number(item.x, 70, ROOM_WIDTH - 70) ||
      !number(item.y, 430, 490) || (item.facing !== 1 && item.facing !== -1) || !number(item.happiness, 0, 100) || !object(item.needs) ||
      !object(item.refusal) || !number(item.refusal.startedAt, -30000, destinationClocks[destinationForRoom(item.room)]) || !integer(item.refusal.attempts) ||
      !number(item.refusal.penalty, 0, 6) || !number(item.poutUntil)) return bad;
    const clock = destinationClocks[destinationForRoom(item.room)];
    let outfit: OutfitSelection = 'original';
    let toy: ToySelection = 'blocks';
    let lastPlayStation: string | null = null;
    if (!legacy) {
      const last = typeof item.lastPlayStation === 'string' ? getStation(item.lastPlayStation) : undefined;
      if (!member(item.outfit, ['original', ...inventory.outfits]) || !member(item.toy, ['blocks', ...inventory.toys]) ||
        (item.lastPlayStation !== null && (!last || ACTIVITIES[last.activity].policy !== 'leisure'))) return bad;
      outfit = item.outfit;
      toy = item.toy;
      lastPlayStation = typeof item.lastPlayStation === 'string' ? item.lastPlayStation : null;
      const traveling = trip?.companions.includes(item.id) ?? false;
      if (destinationForRoom(item.room) !== (traveling ? trip?.destination : 'home')) return bad;
    }
    const needs = { satiety: 0, energy: 0, hygiene: 0, toiletComfort: 0, fun: 0 };
    for (const need of NEED_IDS) {
      const score = item.needs[need];
      if (!number(score, 0, 100)) return bad;
      needs[need] = score;
    }
    let activity: ActiveActivity | WaitingActivity | null = null;
    if (item.activity !== null) {
      if (!object(item.activity) || (item.activity.stationId !== null && typeof item.activity.stationId !== 'string') || legacy && typeof item.activity.stationId !== 'string') return bad;
      const station = getStation(item.activity.stationId);
      if (item.activity.stationId !== null && (!station || station.room !== item.room)) return bad;
      if (!original && !member(item.activity.source, ['player', 'princess'])) return bad;
      const source = item.activity.source === 'princess' && !original ? 'princess' : 'player';
      if (item.activity.kind === 'active') {
        const kind = legacy ? station?.activity : item.activity.activityId;
        if (!activityName(kind) || station && kind !== station.activity || !station && kind !== 'icecream' ||
          source === 'princess' && !['energy', 'fun'].includes(ACTIVITIES[kind].need)) return bad;
        const definition = ACTIVITIES[kind];
        const duration = definition.duration * DIFFICULTIES[value.difficulty].duration;
        if (!integer(item.activity.slot) || item.activity.slot >= (station?.slots.length ?? 1) ||
          !integer(item.activity.actionId, 1) || item.activity.actionId >= value.nextActionId || actions.has(item.activity.actionId) ||
          !number(item.activity.elapsed, 0, duration) || item.activity.elapsed >= duration || item.activity.duration !== duration ||
          !number(item.activity.initialNeed, 0, legacy || definition.policy === 'care' ? definition.target - 8 : 100)) return bad;
        const rewardEligible = kind !== 'icecream' && definition.target - item.activity.initialNeed >= 8;
        let potion: PotionLesson | null = null;
        let consumedTreatId: ActiveActivity['consumedTreatId'] = null;
        if (!legacy) {
          if (item.activity.rewardEligible !== rewardEligible) return bad;
          if (kind === 'icecream') {
            if (station || source !== 'player' || !member(item.activity.consumedTreatId, TREAT_IDS) || item.activity.potion !== null) return bad;
            consumedTreatId = item.activity.consumedTreatId;
          } else if (!station || item.activity.consumedTreatId !== null) return bad;
          if (kind === 'potion') {
            const lesson = item.activity.potion;
            if (!object(lesson) || !member(lesson.recipe, RECIPE_IDS) || !Array.isArray(lesson.ingredients) ||
              lesson.ingredients.length > 3 || !member(lesson.stage, ['ingredients', 'mixing', 'reveal'])) return bad;
            const recipe = RECIPES[lesson.recipe];
            const ingredients = recipe.ingredients.slice(0, lesson.ingredients.length);
            if (lesson.ingredients.some((ingredient, index) => ingredient !== ingredients[index])) return bad;
            const stage = ingredients.length < 3 ? 'ingredients' : item.activity.elapsed >= duration * 0.78 ? 'reveal' : 'mixing';
            if (lesson.stage !== stage || source === 'player' && stage === 'ingredients' && item.activity.elapsed !== 0 ||
              source === 'princess' && ingredients.length !== Math.min(3, Math.floor(item.activity.elapsed / (duration * 0.08)))) return bad;
            potion = { recipe: lesson.recipe, ingredients, stage };
          } else if (item.activity.potion !== null) return bad;
        }
        if (station) {
          const occupancy = `${station.id}:${item.activity.slot}`;
          if (occupied.has(occupancy)) return bad;
          occupied.add(occupancy);
        }
        actions.add(item.activity.actionId);
        activity = { kind: 'active', source, stationId: station?.id ?? null, activityId: kind, slot: item.activity.slot, actionId: item.activity.actionId, elapsed: item.activity.elapsed, duration, initialNeed: item.activity.initialNeed, rewardEligible, consumedTreatId, potion };
      } else if (item.activity.kind === 'waiting' && station && number(item.activity.queuedAt, 0, clock)) {
        if (source === 'princess' && !['energy', 'fun'].includes(ACTIVITIES[station.activity].need)) return bad;
        const recipe = station.activity === 'potion' ? item.activity.recipe : null;
        if (!legacy && (station.activity === 'potion' ? !member(recipe, RECIPE_IDS) : item.activity.recipe !== null)) return bad;
        activity = { kind: 'waiting', source, stationId: station.id, queuedAt: item.activity.queuedAt, recipe: member(recipe, RECIPE_IDS) ? recipe : null };
      } else return bad;
    }
    let autonomy: PrincessAutonomy = { nextDecisionAt: clock + 18000 + PRINCESS_IDS.indexOf(item.id) * 1200, walk: null };
    if (!original) {
      if (!object(item.autonomy) || !number(item.autonomy.nextDecisionAt)) return bad;
      autonomy = { nextDecisionAt: item.autonomy.nextDecisionAt, walk: null };
      if (item.autonomy.walk !== null) {
        const walk = item.autonomy.walk;
        if (activity || !value.autonomyEnabled || !object(walk) || !member(walk.room, rooms) || worldForRoom(walk.room) !== worldForRoom(item.room) || !number(walk.x, 70, ROOM_WIDTH - 70) ||
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
      outfit, toy, lastPlayStation,
    });
  }
  if (!ids.has('liora') || !ids.has(value.selectedId)) return bad;
  const hearts = value.hearts;
  if (legacy) acknowledgedInvitationIds = [...ids];
  else if ([...ids].some(id => !acknowledgedInvitationIds.includes(id)) || acknowledgedInvitationIds.some(id => !ids.has(id) && hearts < PRINCESSES[id].invitation) ||
    trip?.companions.some(id => !ids.has(id)) || !princesses.some(princess => princess.id === value.selectedId && destinationForRoom(princess.room) === (trip?.destination ?? 'home'))) return bad;
  return { kind: 'valid', state: {
    schemaVersion: 3, adventureId: value.adventureId, revision: value.revision, savedAt: value.savedAt, difficulty: value.difficulty,
    coins, inventory, acknowledgedInvitationIds, destinationClocks, trip,
    activeTime: value.activeTime, hearts: value.hearts, nextActionId: value.nextActionId, cameraRoom: value.cameraRoom, cameraCenterX: value.cameraCenterX,
    selectedId: value.selectedId, tutorialSeen: value.tutorialSeen, collectionCelebrated: value.collectionCelebrated,
    ambientEnabled: original ? true : value.ambientEnabled === true, autonomyEnabled: original ? true : value.autonomyEnabled === true, princesses,
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
