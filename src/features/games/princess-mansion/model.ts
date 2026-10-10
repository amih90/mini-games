import {
  ACTIVITIES, DECAY, DIFFICULTIES, NEED_IDS, PRINCESS_IDS, PRINCESSES, RECIPES, ROOM_IDS,
  ROOM_WIDTH, SHOPS, STATIONS, clamp, destinationForRoom, getStation, roomIndex, roomsForWorld, worldForRoom, worldWidth,
  type ActivityId, type DestinationId, type Difficulty, type IngredientId, type NeedId, type OutingId,
  type PrincessId, type RecipeId, type RoomId, type Station,
} from './data';
import {
  CARE_COINS, FAVORITE_COINS, MAX_TREATS, OUTFIT_IDS, TOY_IDS, TREAT_IDS, WELCOME_COINS, getItem,
  type ItemId, type OutfitId, type OutfitSelection, type ToyId, type ToySelection, type TreatId,
} from './catalog';

export interface PotionLesson {
  recipe: RecipeId;
  ingredients: IngredientId[];
  stage: 'ingredients' | 'mixing' | 'reveal';
}

export interface ActiveActivity {
  kind: 'active';
  source: 'player' | 'princess';
  stationId: string | null;
  activityId: ActivityId;
  slot: number;
  actionId: number;
  elapsed: number;
  duration: number;
  initialNeed: number;
  rewardEligible: boolean;
  consumedTreatId: TreatId | null;
  potion: PotionLesson | null;
}
export interface WaitingActivity {
  kind: 'waiting';
  source: 'player' | 'princess';
  stationId: string;
  queuedAt: number;
  recipe: RecipeId | null;
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
  outfit: OutfitSelection;
  toy: ToySelection;
  lastPlayStation: string | null;
}
export interface Trip {
  destination: OutingId;
  companions: PrincessId[];
  homeCamera: { room: RoomId; centerX: number };
  returns: { id: PrincessId; room: RoomId; x: number; y: number; facing: -1 | 1 }[];
}
export interface MansionState {
  schemaVersion: 3;
  adventureId: string;
  revision: number;
  savedAt: number;
  difficulty: Difficulty;
  activeTime: number;
  hearts: number;
  coins: number;
  inventory: { outfits: OutfitId[]; toys: ToyId[]; treats: Record<TreatId, number> };
  acknowledgedInvitationIds: PrincessId[];
  destinationClocks: Record<DestinationId, number>;
  trip: Trip | null;
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
  | { type: 'completed'; princessId: PrincessId; stationId: string | null; activityId: ActivityId; rewarded: boolean }
  | { type: 'refused' | 'insisted'; princessId: PrincessId; stationId: string | null; activityId: ActivityId }
  | { type: 'queued'; princessId: PrincessId; stationId: string }
  | { type: 'invited'; princessId: PrincessId }
  | { type: 'unlocked'; princessId: PrincessId }
  | { type: 'wandering'; princessId: PrincessId }
  | { type: 'autonomous'; princessId: PrincessId; stationId: string }
  | { type: 'purchased'; itemId: ItemId }
  | { type: 'equipped'; princessId: PrincessId }
  | { type: 'traveled'; destination: DestinationId }
  | { type: 'ingredient'; princessId: PrincessId; correct: boolean }
  | { type: 'placed' | 'selected' }
  | { type: 'error'; code: 'invalidAction' | 'insufficientCoins' | 'alreadyOwned' | 'inventoryFull' | 'notOwned' | 'noTreat' | 'away' | 'returnFirst' };
export type Command =
  | { type: 'select'; id: PrincessId; focus?: boolean }
  | { type: 'camera'; room: RoomId; centerX?: number }
  | { type: 'cancel'; id: PrincessId; focus?: boolean }
  | { type: 'place'; id: PrincessId; room: RoomId; x: number; y: number; stationId?: string }
  | { type: 'invite'; id: PrincessId }
  | { type: 'acknowledge'; id: PrincessId }
  | { type: 'travel'; destination: OutingId; companions: PrincessId[] }
  | { type: 'return' }
  | { type: 'buy'; itemId: ItemId }
  | { type: 'equip'; id: PrincessId; outfit: OutfitSelection }
  | { type: 'toy'; id: PrincessId; toy: ToySelection }
  | { type: 'serve'; id: PrincessId; treat: TreatId }
  | { type: 'recipe'; id: PrincessId; recipe: RecipeId }
  | { type: 'ingredient'; id: PrincessId; ingredient: IngredientId }
  | { type: 'ambient'; enabled: boolean }
  | { type: 'autonomy'; enabled: boolean }
  | { type: 'tutorial' }
  | { type: 'celebrated' };
export interface Transition { state: MansionState; effects: GameEffect[] }

export function activeDestination(state: MansionState): DestinationId { return state.trip?.destination ?? 'home'; }
export function princessClock(state: MansionState, princess: Princess): number { return state.destinationClocks[destinationForRoom(princess.room)]; }
export function pendingInvitations(state: MansionState): PrincessId[] {
  return PRINCESS_IDS.filter(id => state.hearts >= PRINCESSES[id].invitation &&
    !state.princesses.some(princess => princess.id === id) && !state.acknowledgedInvitationIds.includes(id));
}
export function activityId(princess: Princess): ActivityId | null {
  return princess.activity?.kind === 'active' ? princess.activity.activityId : getStation(princess.activity?.stationId)?.activity ?? null;
}
function invalid(state: MansionState, code: Extract<GameEffect, { type: 'error' }>['code'] = 'invalidAction'): Transition {
  return { state, effects: [{ type: 'error', code }] };
}
function makePrincess(id: PrincessId, room: RoomId, index: number, activeTime = 0): Princess {
  return {
    id, room, x: index === 0 ? 940 : 100 + (index * 105) % 850, y: 480, facing: 1,
    needs: { satiety: index === 0 ? 27 : 67, energy: 76, hygiene: 74, toiletComfort: 70, fun: 66 },
    happiness: 80, activity: null, refusal: { startedAt: -30000, attempts: 0, penalty: 0 }, poutUntil: 0,
    autonomy: { nextDecisionAt: activeTime + 18000 + index * 1200, walk: null },
    outfit: 'original', toy: 'blocks', lastPlayStation: null,
  };
}

export function createAdventure(difficulty: Difficulty, adventureId: string): MansionState {
  const princess = makePrincess('liora', 'dining', 0);
  return {
    schemaVersion: 3, adventureId, revision: 0, savedAt: 0, difficulty, activeTime: 0,
    coins: WELCOME_COINS, inventory: { outfits: [], toys: [], treats: { strawberry: 0, vanilla: 0, blueberry: 0 } },
    acknowledgedInvitationIds: ['liora'], destinationClocks: { home: 0, mall: 0, beach: 0 }, trip: null,
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

function refuse(state: MansionState, princess: Princess, stationId: string | null, kind: ActivityId): { princess: Princess; effect: GameEffect } {
  const now = princessClock(state, princess);
  const reset = now - princess.refusal.startedAt >= 30000;
  const previous = reset ? { startedAt: now, attempts: 0, penalty: 0 } : princess.refusal;
  const loss = previous.attempts > 0 ? Math.min(2, 6 - previous.penalty) : 0;
  return {
    princess: { ...princess, activity: null, poutUntil: now + 2300, happiness: clamp(princess.happiness - loss, 0, 100), refusal: { startedAt: previous.startedAt, attempts: previous.attempts + 1, penalty: previous.penalty + loss } },
    effect: { type: previous.attempts > 0 ? 'insisted' : 'refused', princessId: princess.id, stationId, activityId: kind },
  };
}

function startAtStation(state: MansionState, princess: Princess, stationId: string, focus = true, autonomous = false, recipe: RecipeId = 'starlight'): Transition {
  const station = getStation(stationId);
  if (!station || station.room !== princess.room || destinationForRoom(princess.room) !== activeDestination(state)) return invalid(state);
  const definition = ACTIVITIES[station.activity];
  const rewardEligible = definition.target - princess.needs[definition.need] >= 8;
  if (!rewardEligible && definition.policy === 'care') {
    const refusal = refuse(state, princess, stationId, station.activity);
    return { state: { ...state, cameraCenterX: focus ? roomIndex(station.room) * ROOM_WIDTH + stationExitX(station) : state.cameraCenterX, princesses: state.princesses.map(item => item.id === princess.id ? { ...refusal.princess, x: stationExitX(station), y: 490 } : item) }, effects: [refusal.effect] };
  }
  const now = princessClock(state, princess);
  const occupied = occupiedSlots(state, stationId);
  const slot = station.slots.findIndex((_, index) => !occupied.includes(index));
  const activity: ActiveActivity | WaitingActivity = slot < 0
    ? { kind: 'waiting', source: autonomous ? 'princess' : 'player', stationId, queuedAt: now, recipe: station.activity === 'potion' ? recipe : null }
    : { kind: 'active', source: autonomous ? 'princess' : 'player', stationId, activityId: station.activity, slot, actionId: state.nextActionId, elapsed: 0, duration: definition.duration * DIFFICULTIES[state.difficulty].duration, initialNeed: princess.needs[definition.need], rewardEligible, consumedTreatId: null, potion: station.activity === 'potion' ? { recipe, ingredients: [], stage: 'ingredients' } : null };
  const queueIndex = state.princesses.filter(item => item.id !== princess.id && item.activity?.kind === 'waiting' && item.activity.stationId === stationId).length;
  const exit = stationExitX(station);
  const updated: Princess = {
    ...princess, activity, autonomy: { nextDecisionAt: now + 28000, walk: null },
    poutUntil: definition.policy === 'leisure' ? 0 : princess.poutUntil,
    lastPlayStation: definition.policy === 'leisure' && slot >= 0 ? station.id : princess.lastPlayStation,
    x: slot < 0 ? clamp(exit + (exit > station.x ? 1 : -1) * Math.floor(queueIndex / 3) * 55, 70, ROOM_WIDTH - 70) : station.x + station.slots[slot],
    y: slot < 0 ? 490 - queueIndex % 3 * 26 : 480,
  };
  return {
    state: { ...state, cameraCenterX: focus ? roomIndex(station.room) * ROOM_WIDTH + (slot < 0 ? updated.x : station.x) : state.cameraCenterX, nextActionId: state.nextActionId + (slot < 0 ? 0 : 1), princesses: state.princesses.map(item => item.id === princess.id ? updated : item) },
    effects: slot < 0 ? [{ type: 'queued', princessId: princess.id, stationId }] : autonomous ? [{ type: 'autonomous', princessId: princess.id, stationId }] : [{ type: 'placed' }],
  };
}

function stopped(princess: Princess, now: number, quiet = true): Princess {
  const station = getStation(princess.activity?.stationId);
  return {
    ...princess, activity: null,
    ...(station ? { x: stationExitX(station), y: 490 } : {}),
    autonomy: { nextDecisionAt: quiet || princess.activity ? now + 28000 : princess.autonomy.nextDecisionAt, walk: null },
  };
}
function rebase(princess: Princess, from: number, to: number): Princess {
  const age = from - princess.refusal.startedAt;
  return {
    ...princess, poutUntil: to + Math.max(0, princess.poutUntil - from),
    refusal: age >= 30000 ? { startedAt: to - 30000, attempts: 0, penalty: 0 } : { ...princess.refusal, startedAt: to - Math.max(0, age) },
    autonomy: { nextDecisionAt: to + Math.max(0, princess.autonomy.nextDecisionAt - from), walk: null },
  };
}

export function command(state: MansionState, action: Command): Transition {
  if (action.type === 'tutorial') return { state: { ...state, tutorialSeen: true }, effects: [] };
  if (action.type === 'celebrated') return { state: { ...state, collectionCelebrated: true }, effects: [] };
  if (action.type === 'ambient' || action.type === 'autonomy') {
    if (typeof action.enabled !== 'boolean') return { state, effects: [{ type: 'error', code: 'invalidAction' }] };
    if (action.type === 'autonomy' && state.trip) return invalid(state, 'returnFirst');
    return { state: action.type === 'ambient' ? { ...state, ambientEnabled: action.enabled } : {
      ...state, autonomyEnabled: action.enabled,
      princesses: state.princesses.map(princess => ({
        ...princess, activity: !action.enabled && princess.activity?.kind === 'waiting' && princess.activity.source === 'princess' ? null : princess.activity,
        autonomy: { nextDecisionAt: princessClock(state, princess) + 18000 + PRINCESS_IDS.indexOf(princess.id) * 1200, walk: null },
      })),
    }, effects: [] };
  }
  if (action.type === 'camera') {
    if (!ROOM_IDS.includes(action.room) || destinationForRoom(action.room) !== activeDestination(state)) return invalid(state, 'away');
    const centerX = action.centerX ?? (roomIndex(action.room) + 0.5) * ROOM_WIDTH;
    if (!Number.isFinite(centerX)) return { state, effects: [{ type: 'error', code: 'invalidAction' }] };
    return { state: { ...state, cameraRoom: action.room, cameraCenterX: clamp(centerX, 0, worldWidth(action.room)) }, effects: [] };
  }
  if (action.type === 'travel') {
    if (state.trip) return invalid(state, 'returnFirst');
    if (!['mall', 'beach'].includes(action.destination) || action.companions.length === 0 ||
      new Set(action.companions).size !== action.companions.length || action.companions.some(id => !state.princesses.some(princess => princess.id === id))) return invalid(state);
    const room: RoomId = action.destination === 'mall' ? 'boutique' : 'beach';
    const returns: Trip['returns'] = [];
    const princesses = state.princesses.map(princess => {
      const index = action.companions.indexOf(princess.id);
      if (index < 0) return princess;
      const idle = stopped(princess, state.destinationClocks.home, false);
      returns.push({ id: idle.id, room: idle.room, x: idle.x, y: idle.y, facing: idle.facing });
      return { ...rebase(idle, state.destinationClocks.home, state.destinationClocks[action.destination]), room, x: 245 + index * 95, y: 480, facing: 1 as const };
    });
    return { state: {
      ...state, princesses, cameraRoom: room, cameraCenterX: ROOM_WIDTH / 2,
      selectedId: action.companions.includes(state.selectedId) ? state.selectedId : action.companions[0],
      trip: { destination: action.destination, companions: [...action.companions], homeCamera: { room: state.cameraRoom, centerX: state.cameraCenterX }, returns },
    }, effects: [{ type: 'traveled', destination: action.destination }] };
  }
  if (action.type === 'return') {
    const trip = state.trip;
    if (!trip) return invalid(state);
    const princesses = state.princesses.map(princess => {
      const anchor = trip.returns.find(item => item.id === princess.id);
      if (!anchor) return princess;
      const idle = stopped(princess, state.destinationClocks[trip.destination], false);
      return { ...rebase(idle, state.destinationClocks[trip.destination], state.destinationClocks.home), ...anchor };
    });
    return { state: { ...state, princesses, trip: null, cameraRoom: trip.homeCamera.room, cameraCenterX: trip.homeCamera.centerX }, effects: [{ type: 'traveled', destination: 'home' }] };
  }
  if (action.type === 'buy') {
    const item = getItem(action.itemId);
    if (!item) return invalid(state);
    if (activeDestination(state) !== 'mall' || state.cameraRoom !== SHOPS[item.shop].room ||
      !state.princesses.some(princess => princess.id === state.selectedId && destinationForRoom(princess.room) === 'mall')) return invalid(state, 'away');
    if (item.shop === 'outfits' && state.inventory.outfits.includes(item.id) || item.shop === 'toys' && state.inventory.toys.includes(item.id)) return invalid(state, 'alreadyOwned');
    if (item.shop === 'treats' && state.inventory.treats[item.id] >= MAX_TREATS) return invalid(state, 'inventoryFull');
    if (state.coins < item.price) return invalid(state, 'insufficientCoins');
    const inventory = item.shop === 'outfits' ? { ...state.inventory, outfits: [...state.inventory.outfits, item.id] }
      : item.shop === 'toys' ? { ...state.inventory, toys: [...state.inventory.toys, item.id] }
        : { ...state.inventory, treats: { ...state.inventory.treats, [item.id]: state.inventory.treats[item.id] + 1 } };
    return { state: { ...state, coins: state.coins - item.price, inventory }, effects: [{ type: 'purchased', itemId: item.id }] };
  }
  if (action.type === 'acknowledge') {
    if (!pendingInvitations(state).includes(action.id)) return invalid(state);
    return { state: { ...state, acknowledgedInvitationIds: [...state.acknowledgedInvitationIds, action.id] }, effects: [] };
  }
  if (action.type === 'invite') {
    if (!PRINCESS_IDS.includes(action.id) || state.princesses.some(item => item.id === action.id) || state.hearts < PRINCESSES[action.id].invitation) {
      return { state, effects: [{ type: 'error', code: 'invalidAction' }] };
    }
    const room = state.trip ? 'dining' : state.cameraRoom;
    return { state: {
      ...state, selectedId: state.trip ? state.selectedId : action.id,
      acknowledgedInvitationIds: state.acknowledgedInvitationIds.includes(action.id) ? state.acknowledgedInvitationIds : [...state.acknowledgedInvitationIds, action.id],
      princesses: [...state.princesses, makePrincess(action.id, room, state.princesses.length, state.destinationClocks.home)],
    }, effects: [{ type: 'invited', princessId: action.id }] };
  }
  const princess = state.princesses.find(item => item.id === action.id);
  if (!princess) return { state, effects: [{ type: 'error', code: 'invalidAction' }] };
  if (destinationForRoom(princess.room) !== activeDestination(state)) return invalid(state, 'away');
  if (action.type === 'select') return { state: {
    ...state, selectedId: princess.id,
    ...(action.focus === false ? {} : { cameraRoom: princess.room, cameraCenterX: roomIndex(princess.room) * ROOM_WIDTH + princess.x }),
  }, effects: [{ type: 'selected' }] };
  if (action.type === 'equip') {
    if (action.outfit !== 'original' && !OUTFIT_IDS.some(id => id === action.outfit)) return invalid(state);
    if (action.outfit !== 'original' && !state.inventory.outfits.includes(action.outfit)) return invalid(state, 'notOwned');
    return { state: withPrincess(state, { ...princess, outfit: action.outfit }), effects: [{ type: 'equipped', princessId: princess.id }] };
  }
  if (action.type === 'toy') {
    if (action.toy !== 'blocks' && !TOY_IDS.some(id => id === action.toy)) return invalid(state);
    if (action.toy !== 'blocks' && !state.inventory.toys.includes(action.toy)) return invalid(state, 'notOwned');
    return { state: withPrincess(state, { ...princess, toy: action.toy }), effects: [{ type: 'equipped', princessId: princess.id }] };
  }
  if (action.type === 'serve') {
    if (!TREAT_IDS.some(id => id === action.treat)) return invalid(state);
    if (state.inventory.treats[action.treat] < 1) return invalid(state, 'noTreat');
    const definition = ACTIVITIES.icecream;
    if (definition.target - princess.needs.satiety < 8) {
      const refusal = refuse(state, princess, null, 'icecream');
      return { state: withPrincess(state, { ...refusal.princess, activity: princess.activity }), effects: [refusal.effect] };
    }
    const idle = stopped(princess, princessClock(state, princess));
    const activity: ActiveActivity = {
      kind: 'active', source: 'player', stationId: null, activityId: 'icecream', slot: 0,
      actionId: state.nextActionId, elapsed: 0, duration: definition.duration * DIFFICULTIES[state.difficulty].duration,
      initialNeed: princess.needs.satiety, rewardEligible: false, consumedTreatId: action.treat, potion: null,
    };
    return { state: {
      ...withPrincess(state, { ...idle, activity }), nextActionId: state.nextActionId + 1,
      inventory: { ...state.inventory, treats: { ...state.inventory.treats, [action.treat]: state.inventory.treats[action.treat] - 1 } },
    }, effects: [{ type: 'placed' }] };
  }
  if (action.type === 'recipe') {
    if (!Object.hasOwn(RECIPES, action.recipe)) return invalid(state);
    const current = princess.activity;
    if (current?.kind === 'waiting' && getStation(current.stationId)?.activity === 'potion') {
      return { state: withPrincess(state, { ...princess, activity: { ...current, recipe: action.recipe } }), effects: [] };
    }
    if (current?.kind !== 'active' || !current.potion || current.potion.stage !== 'ingredients' || current.source !== 'player') return invalid(state);
    return { state: withPrincess(state, { ...princess, activity: { ...current, potion: { recipe: action.recipe, ingredients: [], stage: 'ingredients' } } }), effects: [] };
  }
  if (action.type === 'ingredient') {
    const current = princess.activity;
    if (current?.kind !== 'active' || !current.potion || current.potion.stage !== 'ingredients' || current.source !== 'player') return invalid(state);
    const expected = RECIPES[current.potion.recipe].ingredients[current.potion.ingredients.length];
    if (action.ingredient !== expected) return { state, effects: [{ type: 'ingredient', princessId: princess.id, correct: false }] };
    const ingredients = [...current.potion.ingredients, action.ingredient];
    return { state: withPrincess(state, { ...princess, activity: { ...current, potion: { ...current.potion, ingredients, stage: ingredients.length === 3 ? 'mixing' : 'ingredients' } } }), effects: [{ type: 'ingredient', princessId: princess.id, correct: true }] };
  }
  if (action.type === 'cancel') {
    const idle = stopped(princess, princessClock(state, princess));
    return { state: { ...withPrincess(state, idle), cameraCenterX: action.focus !== false && princess.id === state.selectedId && princess.room === state.cameraRoom ? roomIndex(princess.room) * ROOM_WIDTH + idle.x : state.cameraCenterX }, effects: [] };
  }
  if (!ROOM_IDS.includes(action.room) || !Number.isFinite(action.x) || !Number.isFinite(action.y)) return invalid(state);
  if (destinationForRoom(action.room) !== activeDestination(state)) return invalid(state, 'away');
  if (action.stationId && getStation(action.stationId)?.room !== action.room) return { state, effects: [{ type: 'error', code: 'invalidAction' }] };
  const moved: Princess = { ...princess, activity: null, autonomy: { nextDecisionAt: princessClock(state, princess) + 28000, walk: null }, room: action.room, x: clamp(action.x, 70, ROOM_WIDTH - 70), y: clamp(action.y, 430, 490), facing: roomIndex(action.room) * ROOM_WIDTH + action.x < roomIndex(princess.room) * ROOM_WIDTH + princess.x ? -1 : 1 };
  const next = { ...state, cameraRoom: action.room, cameraCenterX: roomIndex(action.room) * ROOM_WIDTH + moved.x, selectedId: princess.id, princesses: state.princesses.map(item => item.id === princess.id ? moved : item) };
  return action.stationId ? startAtStation(next, moved, action.stationId) : { state: next, effects: [{ type: 'placed' }] };
}

function chooseAutonomy(state: MansionState, princess: Princess): PrincessAutonomy {
  const index = PRINCESS_IDS.indexOf(princess.id);
  const now = princessClock(state, princess);
  const nextDecisionAt = now + 14000 + index * 900;
  const worldX = roomIndex(princess.room) * ROOM_WIDTH + princess.x;
  const resting = princess.needs.energy < 38;
  const playful = princess.needs.fun < 80 && (Math.floor(now / 28000) + index) % 3 === 2;
  if (resting || playful) {
    const candidates = STATIONS.filter(station => {
      const definition = ACTIVITIES[station.activity];
      const reserved = state.princesses.filter(item => item.autonomy.walk?.stationId === station.id).length;
      return worldForRoom(station.room) === worldForRoom(princess.room) && definition.need === (resting ? 'energy' : 'fun') && definition.target - princess.needs[definition.need] >= 8 &&
        Math.abs(roomIndex(station.room) - roomIndex(princess.room)) <= 2 &&
        occupiedSlots(state, station.id).length + reserved < station.slots.length;
    });
    candidates.sort((a, b) => {
      const score = (station: Station) => Math.abs(roomIndex(station.room) * ROOM_WIDTH + station.x - worldX) - (PRINCESSES[princess.id].favorite === station.activity ? 480 : 0) + (princess.lastPlayStation === station.id ? ROOM_WIDTH * 1.4 : 0);
      return score(a) - score(b);
    });
    if (candidates[0]) return { nextDecisionAt, walk: { room: candidates[0].room, x: candidates[0].x, stationId: candidates[0].id } };
  }
  const direction = (Math.floor(now / 14000) + index) % 2 ? -1 : 1;
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
    let coins = current.coins;
    const destination = activeDestination(current);
    const now = current.destinationClocks[destination];
    let cameraCenterX = current.cameraCenterX;
    const princesses = current.princesses.map(princess => {
      if (destinationForRoom(princess.room) !== destination) return princess;
      const needs = { ...princess.needs };
      for (const need of NEED_IDS) needs[need] = clamp(needs[need] - DECAY[need] * DIFFICULTIES[current.difficulty].decay * seconds, 0, 100);
      let activity = princess.activity;
      let x = princess.x;
      let y = princess.y;
      let happiness = clamp(princess.happiness + (Math.min(...Object.values(needs)) < 20 ? -0.08 : 0.025) * seconds, 0, 100);
      let autonomy = princess.autonomy;
      if (activity?.kind === 'active') {
        const station = getStation(activity.stationId);
        if (activity.stationId !== null && !station) throw new Error(`Missing active station: ${activity.stationId}`);
        const definition = ACTIVITIES[activity.activityId];
        const waitingForIngredients = activity.source === 'player' && activity.potion?.stage === 'ingredients';
        const elapsed = waitingForIngredients ? activity.elapsed : Math.min(activity.duration, activity.elapsed + step);
        let potion = activity.potion;
        if (potion) {
          const ingredients = activity.source === 'princess' ? RECIPES[potion.recipe].ingredients.slice(0, Math.min(3, Math.floor(elapsed / (activity.duration * 0.08)))) : potion.ingredients;
          potion = { ...potion, ingredients, stage: ingredients.length < 3 ? 'ingredients' : elapsed >= activity.duration * 0.78 ? 'reveal' : 'mixing' };
        }
        const gain = Math.max(0, definition.target - activity.initialNeed) * (elapsed - activity.elapsed) / activity.duration;
        needs[definition.need] = clamp(needs[definition.need] + gain, 0, 100);
        if (elapsed >= activity.duration) {
          needs[definition.need] = Math.max(needs[definition.need], definition.target);
          const favorite = PRINCESSES[princess.id].favorite === activity.activityId;
          if (activity.rewardEligible) {
            happiness = clamp(happiness + (favorite ? 4 : 2), 0, 100);
            hearts += favorite ? 2 : 1;
            coins = Math.min(Number.MAX_SAFE_INTEGER, coins + (favorite ? FAVORITE_COINS : CARE_COINS));
          }
          effects.push({ type: 'completed', princessId: princess.id, stationId: activity.stationId, activityId: activity.activityId, rewarded: activity.rewardEligible });
          x = station ? stationExitX(station) : x;
          y = 490;
          if (activity.source === 'player' && princess.id === current.selectedId && princess.room === current.cameraRoom) cameraCenterX = roomIndex(princess.room) * ROOM_WIDTH + x;
          autonomy = { nextDecisionAt: now + step + 28000, walk: null };
          activity = null;
        } else activity = { ...activity, elapsed, potion };
      }
      return { ...princess, x, y, needs, happiness, activity, autonomy };
    });
    for (const id of PRINCESS_IDS) if (current.hearts < PRINCESSES[id].invitation && hearts >= PRINCESSES[id].invitation && !current.princesses.some(princess => princess.id === id)) effects.push({ type: 'unlocked', princessId: id });
    current = { ...current, activeTime: current.activeTime + step, destinationClocks: { ...current.destinationClocks, [destination]: now + step }, princesses, hearts, coins, cameraCenterX };
    for (const station of STATIONS) {
      if (destinationForRoom(station.room) !== destination) continue;
      const waiting = current.princesses.filter(item => item.activity?.kind === 'waiting' && item.activity.stationId === station.id)
        .sort((a, b) => (a.activity?.kind === 'waiting' ? a.activity.queuedAt : 0) - (b.activity?.kind === 'waiting' ? b.activity.queuedAt : 0));
      for (const princess of waiting) {
        if (occupiedSlots(current, station.id).length >= station.slots.length) break;
        const autonomous = princess.activity?.source === 'princess';
        const recipe = princess.activity?.kind === 'waiting' ? princess.activity.recipe ?? 'starlight' : 'starlight';
        const transition = startAtStation(current, princess, station.id, !autonomous && princess.id === current.selectedId && princess.room === current.cameraRoom, autonomous, recipe);
        current = transition.state;
        effects.push(...transition.effects);
      }
    }
    if (current.autonomyEnabled) for (const id of current.princesses.map(princess => princess.id)) {
      let princess = current.princesses.find(item => item.id === id);
      if (!princess || destinationForRoom(princess.room) !== destination || princess.activity || held.has(id) || princess.poutUntil > princessClock(current, princess)) continue;
      if (!princess.autonomy.walk && princessClock(current, princess) >= princess.autonomy.nextDecisionAt) {
        princess = { ...princess, autonomy: chooseAutonomy(current, princess) };
        current = withPrincess(current, princess);
        effects.push({ type: 'wandering', princessId: id });
      }
      const walk = princess.autonomy.walk;
      if (!walk) continue;
      const rooms = roomsForWorld(worldForRoom(princess.room));
      const from = roomIndex(princess.room) * ROOM_WIDTH + princess.x;
      const target = roomIndex(walk.room) * ROOM_WIDTH + walk.x;
      const distance = target - from;
      const speed = (76 + PRINCESS_IDS.indexOf(id) * 3) * seconds;
      const position = Math.abs(distance) <= speed ? target : from + Math.sign(distance) * speed;
      let index = clamp(Math.floor(position / ROOM_WIDTH), 0, rooms.length - 1);
      let x = position - index * ROOM_WIDTH;
      if (distance > 0 && x > ROOM_WIDTH - 70 && index < roomIndex(walk.room)) { index++; x = 70; }
      else if (distance < 0 && x < 70 && index > roomIndex(walk.room)) { index--; x = ROOM_WIDTH - 70; }
      princess = { ...princess, room: rooms[index], x: clamp(x, 70, ROOM_WIDTH - 70), y: Math.min(490, princess.y + 24 * seconds), facing: distance < 0 ? -1 : 1 };
      const arrived = Math.abs(distance) <= speed;
      if (arrived) princess = { ...princess, autonomy: { ...princess.autonomy, walk: null } };
      current = withPrincess(current, princess);
      if (arrived && walk.stationId) {
        const station = getStation(walk.stationId);
        if (!station) throw new Error(`Missing autonomous station: ${walk.stationId}`);
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
  commit(state: MansionState, effects: GameEffect[] = []): void { if (!this.disposed) { this.apply({ state, effects }); this.notify(); } }
  private notify(): void { if (!this.disposed) for (const listener of this.snapshots) listener(this.state); }
  dispose(): void { this.disposed = true; this.snapshots.clear(); this.effects.clear(); this.held.clear(); }
}
