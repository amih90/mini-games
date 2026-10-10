import { test, expect } from '@playwright/test';
import {
  ACTIVITIES, PRINCESS_IDS, RECIPES, ROOM_WIDTH, STATIONS, destinationForRoom, getStation,
  type PrincessId, type RoomId,
} from '../src/features/games/princess-mansion/data';
import { CATALOG, MAX_TREATS } from '../src/features/games/princess-mansion/catalog';
import {
  advance, command, createAdventure, pendingInvitations, princessClock, type MansionState,
} from '../src/features/games/princess-mansion/model';
import { BACKUP_KEY, MansionSaveStore, SAVE_KEY, parseSave } from '../src/features/games/princess-mansion/persistence';
import legacy from './fixtures/princess-mansion-legacy.json';

function household(ids: readonly PrincessId[] = ['liora']): MansionState {
  let state = createAdventure('medium', 'expansion-contract');
  state.autonomyEnabled = false;
  state.hearts = 100;
  for (const id of ids.filter(id => id !== 'liora')) state = command(state, { type: 'invite', id }).state;
  return state;
}
function atRoom(state: MansionState, room: RoomId): MansionState {
  const destination = destinationForRoom(room);
  if (destination !== 'home') state = command(state, { type: 'travel', destination, companions: state.princesses.map(princess => princess.id) }).state;
  return command(state, { type: 'place', id: 'liora', room, x: 600, y: 480 }).state;
}
function roundTrip(state: MansionState): MansionState {
  const parsed = parseSave(JSON.stringify(state));
  expect(parsed.kind).toBe('valid');
  if (parsed.kind !== 'valid') throw new Error('Expected a valid expansion snapshot');
  expect(parsed.state).toEqual(state);
  return parsed.state;
}

test.describe('Mansion destination clocks and travel', () => {
  test('only companions leave and every home field freezes, including queued care and timers', () => {
    let state = household(['liora', 'mira', 'coral']);
    for (const id of ['mira', 'coral'] as const) state = command(state, { type: 'place', id, room: 'bathroom', x: 445, y: 480, stationId: 'bubble-bath' }).state;
    const home = structuredClone(state.princesses.slice(1));
    const camera = { room: state.cameraRoom, centerX: state.cameraCenterX };
    state = command(state, { type: 'travel', destination: 'beach', companions: ['liora'] }).state;
    state = advance(state, 60000).state;
    expect(state.princesses.slice(1)).toEqual(home);
    expect(state.destinationClocks).toEqual({ home: 0, mall: 0, beach: 60000 });
    expect(state.trip?.homeCamera).toEqual(camera);
    expect(state.princesses[0].needs.satiety).toBeLessThan(27);
    state = command(roundTrip(state), { type: 'return' }).state;
    expect(state.cameraRoom).toBe(camera.room);
    expect(state.cameraCenterX).toBe(camera.centerX);
    expect(state.princesses.slice(1)).toEqual(home);
    expect(advance(state, 100).state.princesses[1].activity?.kind).toBe('active');
    roundTrip(state);
  });

  test('all eight can travel; empty, duplicate, uninvited and second-party requests are rejected', () => {
    const state = household(PRINCESS_IDS);
    for (const companions of [[], ['liora', 'liora'], ['invalid']] as PrincessId[][]) {
      expect(command(state, { type: 'travel', destination: 'mall', companions }).state).toBe(state);
    }
    const trip = command(state, { type: 'travel', destination: 'mall', companions: [...PRINCESS_IDS] }).state;
    expect(trip.trip?.companions).toHaveLength(8);
    expect(new Set(trip.princesses.map(princess => princess.id)).size).toBe(8);
    expect(command(trip, { type: 'travel', destination: 'beach', companions: ['liora'] }).effects).toEqual([{ type: 'error', code: 'returnFirst' }]);
    roundTrip(trip);
    expect(command(household(), { type: 'travel', destination: 'mall', companions: ['mira'] }).state.trip).toBeNull();
  });

  test('an outing cannot rewrite home walks or timers by changing the household autonomy preference', () => {
    let state = household(['liora', 'mira']);
    state.autonomyEnabled = true;
    state.activeTime = 18300;
    state.destinationClocks.home = 18300;
    state.princesses[0].autonomy = { nextDecisionAt: 32000, walk: { room: 'dining', x: 862, stationId: null } };
    const home = structuredClone(state.princesses[0]);
    state = command(roundTrip(state), { type: 'travel', destination: 'beach', companions: ['mira'] }).state;
    for (const enabled of [false, true]) {
      const result = command(state, { type: 'autonomy', enabled });
      expect(result.state).toBe(state);
      expect(result.effects).toEqual([{ type: 'error', code: 'returnFirst' }]);
    }
    state = command(state, { type: 'ambient', enabled: false }).state;
    state = advance(state, 4000).state;
    expect(state.princesses[0]).toEqual(home);
    state = command(roundTrip(state), { type: 'return' }).state;
    expect(state.princesses[0]).toEqual(home);
    state = command(state, { type: 'autonomy', enabled: false }).state;
    expect(state.autonomyEnabled).toBe(false);
    expect(state.princesses[0].autonomy.walk).toBeNull();
    roundTrip(state);
  });

  test('departure releases care, preserves recovered needs, and returns to a safe anchor without restarting', () => {
    let state = household();
    state = command(state, { type: 'place', id: 'liora', room: 'bathroom', x: 445, y: 480, stationId: 'bubble-bath' }).state;
    state = advance(state, 2000).state;
    const hygiene = state.princesses[0].needs.hygiene;
    state = command(state, { type: 'travel', destination: 'mall', companions: ['liora'] }).state;
    expect(state.princesses[0].activity).toBeNull();
    expect(state.princesses[0].needs.hygiene).toBe(hygiene);
    const anchor = state.trip?.returns[0];
    expect(anchor?.x).toBeGreaterThan(445);
    state = advance(state, 4000).state;
    state = command(roundTrip(state), { type: 'return' }).state;
    expect(state.princesses[0]).toMatchObject(anchor ?? {});
    expect(state.princesses[0].activity).toBeNull();
    expect(state.hearts).toBe(100);
  });

  test('timer rebasing preserves remaining windows and never renews expired ones', () => {
    let state = household();
    state.activeTime = 60000;
    state.destinationClocks.home = 60000;
    state.princesses[0] = {
      ...state.princesses[0], poutUntil: 60300, refusal: { startedAt: 59850, attempts: 2, penalty: 2 },
      autonomy: { nextDecisionAt: 62900, walk: null },
    };
    state = command(state, { type: 'travel', destination: 'mall', companions: ['liora'] }).state;
    expect(state.princesses[0].poutUntil).toBe(300);
    expect(state.princesses[0].refusal.startedAt).toBe(-150);
    expect(state.princesses[0].autonomy.nextDecisionAt).toBe(2900);
    roundTrip(state);
    state = command(advance(state, 2000).state, { type: 'return' }).state;
    expect(state.princesses[0].poutUntil).toBe(60000);
    expect(state.princesses[0].autonomy.nextDecisionAt).toBe(60900);
    expect(princessClock(state, state.princesses[0])).toBe(60000);
    roundTrip(state);
  });

  test('off-site portraits, care, and cameras cannot teleport or modify home princesses', () => {
    const home = household(['liora', 'mira']);
    const away = command(home, { type: 'travel', destination: 'beach', companions: ['liora'] }).state;
    for (const action of [
      { type: 'select' as const, id: 'mira' as const },
      { type: 'cancel' as const, id: 'mira' as const },
      { type: 'place' as const, id: 'mira' as const, room: 'beach' as const, x: 400, y: 480 },
      { type: 'place' as const, id: 'liora' as const, room: 'dining' as const, x: 660, y: 480 },
      { type: 'camera' as const, room: 'basement' as const },
    ]) expect(command(away, action).state).toBe(away);
    const invited = command(away, { type: 'invite', id: 'coral' }).state;
    expect(invited.princesses[2].room).toBe('dining');
    expect(invited.trip).toEqual(away.trip);
    expect(invited.selectedId).toBe(away.selectedId);
    expect(invited.cameraCenterX).toBe(away.cameraCenterX);
    roundTrip(invited);
  });

  test('basement and playground use home time, but automatic walks cannot change floors/destinations', () => {
    const state = atRoom(household(['liora', 'mira']), 'basement');
    state.autonomyEnabled = true;
    state.princesses[0].needs.fun = 20;
    state.princesses[0].autonomy.nextDecisionAt = 0;
    state.destinationClocks.home = 60000;
    state.activeTime = 60000;
    const walked = advance(state, 100).state.princesses[0].autonomy.walk;
    expect(walked?.room).toBe('basement');
    expect(advance(state, 100).state.princesses[1].needs.satiety).toBeLessThan(state.princesses[1].needs.satiety);
    roundTrip(advance(state, 100).state);
  });
});

test.describe('Mansion leisure and reward eligibility', () => {
  test('every leisure attraction accepts full Fun without negative restoration, anger, or completion rewards', () => {
    for (const station of STATIONS.filter(station => ACTIVITIES[station.activity].policy === 'leisure')) {
      let state = atRoom(household(), station.room);
      state.princesses[0].needs.fun = 100;
      state.princesses[0].poutUntil = 2300;
      const started = command(state, { type: 'place', id: 'liora', room: station.room, x: station.x, y: 480, stationId: station.id });
      expect(started.effects.some(effect => effect.type === 'refused')).toBe(false);
      state = started.state;
      expect(state.princesses[0].poutUntil).toBe(0);
      if (station.activity === 'potion') for (const ingredient of RECIPES.starlight.ingredients) state = command(state, { type: 'ingredient', id: 'liora', ingredient }).state;
      const midway = advance(state, 1000).state;
      expect(midway.princesses[0].needs.fun).toBeGreaterThan(99.9);
      const completed = advance(roundTrip(midway), ACTIVITIES[station.activity].duration).state;
      expect(completed.princesses[0].needs.fun).toBeGreaterThan(98);
      expect(completed.hearts).toBe(state.hearts);
      expect(completed.coins).toBe(state.coins);
      expect(completed.princesses[0].happiness - state.princesses[0].happiness).toBeLessThan(1);
      roundTrip(completed);
    }
  });

  test('recipes lock as soon as the last ingredient starts mixing, before the first timer step', () => {
    let state = atRoom(household(), 'basement');
    state = command(state, { type: 'place', id: 'liora', room: 'basement', x: 320, y: 480, stationId: 'cauldron-left' }).state;
    for (const ingredient of RECIPES.starlight.ingredients) state = command(state, { type: 'ingredient', id: 'liora', ingredient }).state;
    expect(state.princesses[0].activity).toMatchObject({ elapsed: 0, potion: { stage: 'mixing' } });
    expect(command(state, { type: 'recipe', id: 'liora', recipe: 'blossom' }).state).toBe(state);
    roundTrip(state);
  });

  test('meaningful new play restores Fun and grants exactly one reward even across reload', () => {
    for (const stationId of ['royal-slide', 'storybook-treehouse', 'sandcastle-cove', 'shell-collection', 'shallow-splash']) {
      const station = getStation(stationId);
      if (!station) throw new Error(`Missing station ${stationId}`);
      let state = atRoom(household(), station.room);
      state.princesses[0].needs.fun = 20;
      state = command(state, { type: 'place', id: 'liora', room: station.room, x: station.x, y: 480, stationId }).state;
      state = roundTrip(advance(state, 1400).state);
      state = advance(state, ACTIVITIES[station.activity].duration - 1400).state;
      expect(state.princesses[0].needs.fun).toBeCloseTo(ACTIVITIES[station.activity].target, 1);
      expect(state.hearts).toBe(101);
      expect(state.coins).toBe(13);
      expect(advance(roundTrip(state), 1000).state.hearts).toBe(101);
    }
  });

  test('essential care keeps fullness refusal and favorites retain their larger coin/Heart award', () => {
    let state = household();
    state.princesses[0].needs.satiety = 100;
    expect(command(state, { type: 'place', id: 'liora', room: 'dining', x: 660, y: 480, stationId: 'royal-table' }).effects[0].type).toBe('refused');
    state.princesses[0].needs.satiety = 20;
    state = command(state, { type: 'place', id: 'liora', room: 'dining', x: 660, y: 480, stationId: 'royal-table' }).state;
    const complete = advance(state, ACTIVITIES.meal.duration).state;
    expect(complete.hearts).toBe(102);
    expect(complete.coins).toBe(14);
  });
});

test.describe('Mansion shared shopping and portable treats', () => {
  test('exact, insufficient, duplicate, inactive-shop, and quantity-limit purchases are explicit and safe', () => {
    let state = command(household(), { type: 'travel', destination: 'mall', companions: ['liora'] }).state;
    const zero = { ...state, coins: 0 };
    expect(command(zero, { type: 'buy', itemId: 'rose-gala' }).effects).toEqual([{ type: 'error', code: 'insufficientCoins' }]);
    state.coins = 18;
    state = command(state, { type: 'buy', itemId: 'rose-gala' }).state;
    expect(state.coins).toBe(0);
    expect(state.inventory.outfits).toEqual(['rose-gala']);
    expect(command(state, { type: 'buy', itemId: 'rose-gala' }).state).toBe(state);
    expect(command(state, { type: 'buy', itemId: 'plush-dragon' }).state).toBe(state);
    state = command({ ...state, coins: 50 }, { type: 'camera', room: 'icecream' }).state;
    state.inventory.treats.strawberry = MAX_TREATS;
    expect(command(state, { type: 'buy', itemId: 'strawberry' }).effects).toEqual([{ type: 'error', code: 'inventoryFull' }]);
    expect(command(command(state, { type: 'return' }).state, { type: 'buy', itemId: 'rose-gala' }).effects[0]).toEqual({ type: 'error', code: 'away' });
    roundTrip(state);
  });

  test('all prices debit coins only; shared outfits and toys can be equipped by different princesses', () => {
    let state = household(['liora', 'mira']);
    state.coins = 200;
    state = command(state, { type: 'travel', destination: 'mall', companions: ['liora', 'mira'] }).state;
    for (const item of CATALOG) {
      const room: RoomId = item.shop === 'outfits' ? 'boutique' : item.shop === 'toys' ? 'toyshop' : 'icecream';
      state = command(state, { type: 'camera', room }).state;
      state = command(state, { type: 'buy', itemId: item.id }).state;
    }
    expect(state.coins).toBe(200 - CATALOG.reduce((sum, item) => sum + item.price, 0));
    expect(state.hearts).toBe(100);
    state = command(state, { type: 'equip', id: 'mira', outfit: 'rose-gala' }).state;
    state = command(state, { type: 'return' }).state;
    state = command(state, { type: 'toy', id: 'liora', toy: 'plush-dragon' }).state;
    state = command(state, { type: 'toy', id: 'mira', toy: 'royal-train' }).state;
    const restored = roundTrip(state);
    expect(restored.princesses[1].outfit).toBe('rose-gala');
    expect(restored.princesses.map(princess => princess.toy)).toEqual(['plush-dragon', 'royal-train']);
    expect(command(state, { type: 'equip', id: 'mira', outfit: 'original' }).state.princesses[1].outfit).toBe('original');
  });

  test('a full princess refuses without losing a treat; accepted service debits once and never rewards or queues', () => {
    let state = household();
    state.inventory.treats.strawberry = 2;
    state.princesses[0].needs.satiety = 100;
    const refused = command(state, { type: 'serve', id: 'liora', treat: 'strawberry' });
    expect(refused.effects[0].type).toBe('refused');
    expect(refused.state.inventory.treats.strawberry).toBe(2);
    state.princesses[0].needs.satiety = 20;
    state = command(state, { type: 'serve', id: 'liora', treat: 'strawberry' }).state;
    expect(state.inventory.treats.strawberry).toBe(1);
    expect(state.princesses[0].activity).toMatchObject({ activityId: 'icecream', consumedTreatId: 'strawberry', rewardEligible: false, stationId: null });
    const completed = advance(roundTrip(advance(state, 1300).state), 6000).state;
    expect(completed.inventory.treats.strawberry).toBe(1);
    expect(completed.hearts).toBe(100);
    expect(completed.coins).toBe(10);
    expect(completed.princesses[0].needs.satiety).toBeGreaterThan(84);
    roundTrip(completed);
  });
});

test.describe('Mansion lesson steps and invitation notices', () => {
  test('manual ingredients, friendly wrong input, saved mixing/reveal and one completion reward', () => {
    let state = atRoom(household(), 'basement');
    state.princesses[0].needs.fun = 20;
    state = command(state, { type: 'place', id: 'liora', room: 'basement', x: 320, y: 480, stationId: 'cauldron-left' }).state;
    state = command(state, { type: 'recipe', id: 'liora', recipe: 'blossom' }).state;
    const wrong = command(state, { type: 'ingredient', id: 'liora', ingredient: 'crystal' });
    expect(wrong.state).toBe(state);
    expect(wrong.effects[0]).toMatchObject({ type: 'ingredient', correct: false });
    state = advance(state, 3000).state;
    expect(state.princesses[0].activity?.kind === 'active' && state.princesses[0].activity.elapsed).toBe(0);
    for (const ingredient of RECIPES.blossom.ingredients) state = roundTrip(command(state, { type: 'ingredient', id: 'liora', ingredient }).state);
    state = roundTrip(advance(state, 11000).state);
    expect(state.princesses[0].activity?.kind === 'active' && state.princesses[0].activity.potion?.stage).toBe('reveal');
    state = advance(state, 2000).state;
    expect(state.hearts).toBe(101);
    expect(state.coins).toBe(13);
    expect(advance(roundTrip(state), 3000).state.hearts).toBe(101);
  });

  test('queued lessons retain recipe and automatic lessons finish without player input or spending', () => {
    let state = atRoom(household(['liora', 'mira']), 'basement');
    for (const id of ['liora', 'mira'] as const) {
      state = command(state, { type: 'place', id, room: 'basement', x: 320, y: 480, stationId: 'cauldron-left' }).state;
      state = command(state, { type: 'recipe', id, recipe: 'blossom' }).state;
    }
    roundTrip(state);
    state = command(state, { type: 'cancel', id: 'liora' }).state;
    state = advance(state, 100).state;
    expect(state.princesses[1].activity?.kind === 'active' && state.princesses[1].activity.potion?.recipe).toBe('blossom');
    state = atRoom(household(), 'basement');
    state.autonomyEnabled = true;
    state.activeTime = 60000;
    state.destinationClocks.home = 60000;
    state.princesses[0].x = 320;
    state.princesses[0].needs.fun = 20;
    state.princesses[0].autonomy.nextDecisionAt = 0;
    state = advance(state, 15000).state;
    expect(state.princesses[0].activity).toBeNull();
    expect(state.hearts).toBe(101);
    expect(state.coins).toBe(13);
    roundTrip(state);
  });

  test('threshold notices queue, Later persists, invitations acknowledge and cannot duplicate arrivals', () => {
    let state = createAdventure('medium', 'unlock-notices');
    expect(pendingInvitations({ ...state, hearts: 3 })).toEqual([]);
    state.hearts = 11;
    expect(pendingInvitations(state)).toEqual(['mira', 'coral']);
    state = command(state, { type: 'acknowledge', id: 'mira' }).state;
    expect(pendingInvitations(roundTrip(state))).toEqual(['coral']);
    expect(state.princesses).toHaveLength(1);
    state = command(state, { type: 'invite', id: 'coral' }).state;
    expect(pendingInvitations(roundTrip(state))).toEqual([]);
    expect(command(state, { type: 'invite', id: 'coral' }).state).toBe(state);
    expect(state.hearts).toBe(11);
  });

  test('simultaneous care emits a newly eligible milestone exactly once', () => {
    let state = household(['liora', 'mira', 'coral', 'flora']);
    state.hearts = 26;
    state.acknowledgedInvitationIds = ['liora', 'mira', 'coral', 'flora'];
    for (const id of state.princesses.map(princess => princess.id)) {
      const princess = state.princesses.find(princess => princess.id === id);
      if (!princess) throw new Error('Expected the invited princess');
      princess.needs.satiety = 20;
      state = command(state, { type: 'place', id, room: 'dining', x: 660, y: 480, stationId: 'royal-table' }).state;
    }
    const result = advance(state, ACTIVITIES.meal.duration);
    expect(result.effects.filter(effect => effect.type === 'unlocked')).toEqual([{ type: 'unlocked', princessId: 'ruby' }]);
    expect(pendingInvitations(roundTrip(result.state))).toEqual(['ruby']);
  });
});

test.describe('Mansion expansion save contracts', () => {
  test('authentic schema 1/2 activities and walks migrate without replacing original progress or raw backup', () => {
    for (const snapshot of [legacy.schema1, legacy.schema2, legacy.walking, ...legacy.activities.map(entry => entry.snapshot)]) {
      const raw = JSON.stringify(snapshot);
      const parsed = parseSave(raw);
      expect(parsed.kind).toBe('valid');
      if (parsed.kind !== 'valid') throw new Error('Legacy migration failed');
      expect(parsed.state.destinationClocks.home).toBe(snapshot.activeTime);
      expect(parsed.state.princesses[0].needs).toEqual(snapshot.princesses[0].needs);
      if (snapshot.princesses[0].activity) expect(parsed.state.princesses[0].activity).toMatchObject(snapshot.princesses[0].activity);
      else expect(parsed.state.princesses[0].activity).toBeNull();
      expect(parsed.state.coins).toBe(10);
      expect(parsed.state.acknowledgedInvitationIds).toEqual(['liora']);
      roundTrip(parsed.state);
      const items = new Map([[SAVE_KEY, raw]]);
      const store = new MansionSaveStore({ getItem: key => items.get(key) ?? null, setItem: (key, value) => { items.set(key, value); } });
      store.load();
      const saved = store.save(parsed.state);
      expect(saved.ok).toBe(true);
      expect(items.get(BACKUP_KEY)).toBe(raw);
      const reloaded = parseSave(items.get(SAVE_KEY) ?? '');
      expect(reloaded.kind === 'valid' && reloaded.state.coins).toBe(10);
    }
  });

  test('rejects inconsistent clocks, parties, ownership, quantities, eligibility and lesson steps', () => {
    let state = command(household(['liora', 'mira']), { type: 'travel', destination: 'beach', companions: ['liora'] }).state;
    const cases: unknown[] = [
      { ...state, coins: 1.5 }, { ...state, coins: -1 },
      { ...state, destinationClocks: { home: 100, mall: 0, beach: 0 } },
      { ...state, trip: { ...state.trip, companions: [] } },
      { ...state, trip: { ...state.trip, returns: [] } },
      { ...state, cameraRoom: 'dining' },
      { ...state, inventory: { ...state.inventory, outfits: ['rose-gala', 'rose-gala'] } },
      { ...state, inventory: { ...state.inventory, treats: { strawberry: 100, vanilla: 0, blueberry: 0 } } },
      { ...state, princesses: state.princesses.map(princess => ({ ...princess, outfit: 'rose-gala' })) },
    ];
    state = atRoom(household(), 'basement');
    state = command(state, { type: 'place', id: 'liora', room: 'basement', x: 320, y: 480, stationId: 'cauldron-left' }).state;
    const princess = state.princesses[0];
    cases.push(
      { ...state, princesses: [{ ...princess, activity: { ...princess.activity, rewardEligible: false } }] },
      { ...state, princesses: [{ ...princess, activity: { ...princess.activity, potion: { recipe: 'starlight', ingredients: ['crystal'], stage: 'ingredients' } } }] },
      { ...state, princesses: [{ ...princess, activity: { ...princess.activity, potion: { recipe: 'starlight', ingredients: [], stage: 'reveal' } } }] },
    );
    for (const candidate of cases) expect(parseSave(JSON.stringify(candidate))).toEqual({ kind: 'invalid', error: 'corruptSave' });
    expect(parseSave(JSON.stringify({ ...state, schemaVersion: 4 })).kind).toBe('invalid');
    expect(state.cameraCenterX).toBeLessThanOrEqual(ROOM_WIDTH);
  });
});
