import { test, expect } from '@playwright/test';
import { ACTIVITIES, DIFFICULTIES, LEGACY_ROOM_IDS, PRINCESS_IDS, ROOM_WIDTH, STATIONS } from '../src/features/games/princess-mansion/data';
import { MansionController, advance, command, createAdventure, occupiedSlots, type MansionState } from '../src/features/games/princess-mansion/model';
import { BACKUP_KEY, MansionSaveStore, SAVE_KEY, parseSave } from '../src/features/games/princess-mansion/persistence';
import legacy from './fixtures/princess-mansion-legacy.json';

const originalStations = STATIONS.filter(station => LEGACY_ROOM_IDS.some(room => room === station.room));

function adventure(): MansionState {
  return createAdventure('medium', 'model-test-adventure');
}
function storage() {
  const items = new Map<string, string>();
  return { items, getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => { items.set(key, value); } };
}

test.describe('Princess Mansion care model', () => {
  test('starts with one princess and a meaningful first meal', () => {
    const state = adventure();
    expect(state.princesses.map(item => item.id)).toEqual(['liora']);
    expect(state.princesses[0].needs.satiety).toBeLessThan(30);
    expect(state.cameraCenterX).toBe(ROOM_WIDTH * 2 + state.princesses[0].x);
    expect(STATIONS.every(station => station.slots.length > 0)).toBe(true);
  });

  test('a meal recharges gradually and rewards exactly once', () => {
    const original = adventure();
    const started = command(original, { type: 'place', id: 'liora', room: 'dining', x: 650, y: 480, stationId: 'royal-table' }).state;
    expect(started.princesses[0].activity?.kind).toBe('active');
    const halfway = advance(started, 4000);
    expect(halfway.state.princesses[0].needs.satiety).toBeGreaterThan(27);
    expect(halfway.state.princesses[0].needs.satiety).toBeLessThan(95);
    expect(halfway.state.hearts).toBe(0);
    const completed = advance(halfway.state, 5000);
    expect(completed.effects.filter(effect => effect.type === 'completed')).toHaveLength(1);
    expect(completed.state.hearts).toBe(2);
    expect(completed.state.princesses[0].activity).toBeNull();
    expect(advance(completed.state, 1000).state.hearts).toBe(2);
    expect(original.princesses[0].needs.satiety).toBe(27);
  });

  test('the first full-meter refusal is friendly and insistence is capped', () => {
    let state = adventure();
    state = { ...state, princesses: [{ ...state.princesses[0], needs: { ...state.princesses[0].needs, satiety: 100 } }] };
    const action = { type: 'place' as const, id: 'liora' as const, room: 'dining' as const, x: 650, y: 480, stationId: 'royal-table' };
    const first = command(state, action);
    expect(first.effects[0].type).toBe('refused');
    expect(first.state.princesses[0].happiness).toBe(80);
    state = first.state;
    for (let attempt = 0; attempt < 12; attempt++) state = command(state, action).state;
    expect(state.princesses[0].happiness).toBe(74);
    expect(state.hearts).toBe(0);
    expect(state.princesses[0].activity).toBeNull();
  });

  test('every activity restores its own intended need', () => {
    for (const station of originalStations) {
      let state = adventure();
      state = { ...state, princesses: [{ ...state.princesses[0], room: station.room, needs: { satiety: 25, energy: 25, hygiene: 25, toiletComfort: 25, fun: 25 } }] };
      const result = command(state, { type: 'place', id: 'liora', room: station.room, x: station.x, y: 480, stationId: station.id });
      const completed = advance(result.state, ACTIVITIES[station.activity].duration + 10).state;
      const need = ACTIVITIES[station.activity].need;
      expect(completed.princesses[0].needs[need]).toBeCloseTo(ACTIVITIES[station.activity].target, 1);
      expect(completed.hearts).toBeGreaterThan(0);
    }
  });

  test('invitations are earned, optional, and accepted once', () => {
    let state = adventure();
    expect(command(state, { type: 'invite', id: 'mira' }).effects[0].type).toBe('error');
    state = { ...state, hearts: 100 };
    expect(state.princesses).toHaveLength(1);
    for (const id of PRINCESS_IDS.slice(1)) state = command(state, { type: 'invite', id }).state;
    expect(state.princesses).toHaveLength(8);
    const duplicate = command(state, { type: 'invite', id: 'mira' });
    expect(duplicate.effects[0].type).toBe('error');
    expect(duplicate.state.princesses).toHaveLength(8);
  });

  test('busy stations queue, release on cancellation, and admit the next princess', () => {
    let state = { ...adventure(), hearts: 100 };
    state = command(state, { type: 'invite', id: 'mira' }).state;
    state = command(state, { type: 'place', id: 'liora', room: 'bathroom', x: 445, y: 480, stationId: 'bubble-bath' }).state;
    state = command(state, { type: 'place', id: 'mira', room: 'bathroom', x: 445, y: 480, stationId: 'bubble-bath' }).state;
    expect(occupiedSlots(state, 'bubble-bath')).toEqual([0]);
    expect(state.princesses[1].activity?.kind).toBe('waiting');
    state = command(state, { type: 'cancel', id: 'liora' }).state;
    state = advance(state, 100).state;
    expect(state.princesses[0].activity).toBeNull();
    expect(state.princesses[1].activity?.kind).toBe('active');
    expect(occupiedSlots(state, 'bubble-bath')).toEqual([0]);
  });

  test('one princess receives care without changing another princess needs', () => {
    let state = { ...adventure(), hearts: 100 };
    state = command(state, { type: 'invite', id: 'mira' }).state;
    const miraBefore = state.princesses[1].needs.satiety;
    state = command(state, { type: 'place', id: 'liora', room: 'dining', x: 650, y: 480, stationId: 'royal-table' }).state;
    state = advance(state, 2000).state;
    expect(state.princesses[0].needs.satiety).toBeGreaterThan(27);
    expect(state.princesses[1].needs.satiety).toBeLessThan(miraBefore);
  });

  test('care keeps the selected princess visible without stealing another room camera', () => {
    let state = command(adventure(), { type: 'place', id: 'liora', room: 'dining', x: 660, y: 480, stationId: 'royal-table' }).state;
    expect(state.cameraCenterX).toBe(ROOM_WIDTH * 2 + 660);
    const completed = advance(state, ACTIVITIES.meal.duration).state;
    expect(completed.cameraCenterX).toBe(ROOM_WIDTH * 2 + completed.princesses[0].x);
    state = command(state, { type: 'camera', room: 'yard', centerX: ROOM_WIDTH * 7.5 }).state;
    const elsewhere = advance(state, ACTIVITIES.meal.duration).state;
    expect(elsewhere.cameraRoom).toBe('yard');
    expect(elsewhere.cameraCenterX).toBe(state.cameraCenterX);
  });

  test('automatic queue admission does not move a camera watching another princess', () => {
    let state = { ...adventure(), hearts: 100 };
    state = command(state, { type: 'invite', id: 'mira' }).state;
    for (const id of ['liora', 'mira'] as const) state = command(state, { type: 'place', id, room: 'bathroom', x: 445, y: 480, stationId: 'bubble-bath' }).state;
    state = command(state, { type: 'select', id: 'liora', focus: false }).state;
    state = command(state, { type: 'camera', room: 'yard' }).state;
    const elsewhere = advance(state, ACTIVITIES.bath.duration).state;
    expect(elsewhere.princesses[1].activity?.kind).toBe('active');
    expect(elsewhere.cameraRoom).toBe('yard');
    expect(elsewhere.cameraCenterX).toBe(state.cameraCenterX);
  });

  test('difficulty changes both decay and action duration', () => {
    const easy = advance(createAdventure('easy', 'easy'), 5000).state;
    const hard = advance(createAdventure('hard', 'hard'), 5000).state;
    expect(easy.princesses[0].needs.satiety).toBeGreaterThan(hard.princesses[0].needs.satiety);
    const started = command(hard, { type: 'place', id: 'liora', room: 'dining', x: 650, y: 480, stationId: 'royal-table' }).state.princesses[0].activity;
    expect(started?.kind === 'active' && started.duration).toBe(ACTIVITIES.meal.duration * DIFFICULTIES.hard.duration);
  });

  test('pause reasons compose and a resumed frame cannot advance offline time', () => {
    const controller = new MansionController(adventure());
    controller.pause('hidden', true);
    controller.pause('instructions', true);
    controller.tick(60000);
    expect(controller.state.activeTime).toBe(0);
    controller.pause('hidden', false);
    controller.tick(60000);
    expect(controller.state.activeTime).toBe(0);
    controller.pause('instructions', false);
    controller.tick(60000);
    expect(controller.state.activeTime).toBe(200);
    controller.dispose();
    controller.tick(1000);
    expect(controller.state.activeTime).toBe(200);
  });
});

test.describe('Princess Mansion gentle autonomy', () => {
  test('wanders deterministically without moving the camera or spending hearts', () => {
    const initial = adventure();
    const first = advance(initial, 18300);
    expect(first.effects.some(effect => effect.type === 'wandering')).toBe(true);
    expect(first.state.princesses[0].x).not.toBe(initial.princesses[0].x);
    expect(first.state.princesses[0].autonomy.walk).not.toBeNull();
    expect(first.state.cameraCenterX).toBe(initial.cameraCenterX);
    expect(first.state.hearts).toBe(0);
    expect(advance(initial, 18300)).toEqual(first);
    expect(initial.princesses[0].autonomy.walk).toBeNull();
  });

  test('walks into a neighboring room, plays by herself and leaves the camera alone', () => {
    let state = adventure();
    state.activeTime = 60000;
    state.destinationClocks.home = 60000;
    state.cameraRoom = 'yard';
    state.cameraCenterX = ROOM_WIDTH * 7.5;
    state.princesses[0].autonomy.nextDecisionAt = 0;
    state.princesses[0].needs.fun = 20;
    const walking = advance(state, 100).state;
    expect(walking.princesses[0].autonomy.walk?.stationId).toBe('reading');
    state = advance(walking, 20000).state;
    expect(state.princesses[0].room).toBe('lounge');
    expect(state.princesses[0].activity?.source).toBe('princess');
    expect(state.princesses[0].activity?.stationId).toBe('reading');
    const result = advance(state, 10000);
    expect(result.effects.filter(effect => effect.type === 'completed')).toHaveLength(1);
    expect(result.state.princesses[0].needs.fun).toBeGreaterThan(90);
    expect(result.state.cameraCenterX).toBe(ROOM_WIDTH * 7.5);
    expect(result.state.cameraRoom).toBe('yard');
    expect(result.state.princesses[0].needs.satiety).toBeLessThan(30);
  });

  test('respects player pickup and only suppresses the carried princess autonomy', () => {
    let state = { ...adventure(), hearts: 100 };
    state = command(state, { type: 'invite', id: 'mira' }).state;
    const controller = new MansionController(state);
    controller.hold('test-carry', 'liora');
    for (let step = 0; step < 210; step++) controller.tick(100);
    expect(controller.state.princesses[0].x).toBe(state.princesses[0].x);
    expect(controller.state.princesses[1].x).not.toBe(state.princesses[1].x);
    controller.hold('test-carry', null);
    controller.tick(100);
    expect(controller.state.princesses[0].autonomy.walk).not.toBeNull();
    const moved = command(controller.state, { type: 'place', id: 'liora', room: 'dining', x: 1020, y: 490 }).state;
    expect(moved.princesses[0].autonomy.walk).toBeNull();
    expect(advance(moved, 10000).state.princesses[0].x).toBe(1020);
    controller.dispose();
  });

  test('stops autonomous movement while paused or disabled and supports useful naps', () => {
    let state = adventure();
    state.princesses[0].needs.energy = 20;
    state.princesses[0].autonomy.nextDecisionAt = 0;
    state = advance(state, 100).state;
    expect(state.princesses[0].autonomy.walk?.stationId).toBe('couch-left');
    const controller = new MansionController(state);
    controller.pause('menu', true);
    controller.tick(60000);
    expect(controller.state).toEqual(state);
    state = command(state, { type: 'autonomy', enabled: false }).state;
    const x = state.princesses[0].x;
    expect(advance(state, 60000).state.princesses[0].x).toBe(x);
    expect(state.princesses[0].autonomy.walk).toBeNull();
    state = command(state, { type: 'autonomy', enabled: true }).state;
    const rested = advance(state, 60000).state;
    expect(rested.princesses[0].needs.energy).toBeGreaterThan(65);
    expect(rested.autonomyEnabled).toBe(true);
    controller.dispose();
  });

  test('reservations and occupied slots prevent an automatic crowd at one attraction', () => {
    let state = { ...adventure(), hearts: 100, activeTime: 60000, destinationClocks: { home: 60000, mall: 0, beach: 0 } };
    for (const id of PRINCESS_IDS.slice(1)) state = command(state, { type: 'invite', id }).state;
    state.princesses = state.princesses.map(princess => ({
      ...princess, room: 'lounge', needs: { ...princess.needs, fun: 20 }, autonomy: { nextDecisionAt: 0, walk: null },
    }));
    state = advance(state, 100).state;
    expect(state.princesses.filter(princess => princess.autonomy.walk?.stationId === 'reading')).toHaveLength(2);
    const completed = advance(state, 20000).state;
    expect(occupiedSlots(completed, 'reading').length).toBeLessThanOrEqual(2);
    expect(parseSave(JSON.stringify(completed)).kind).toBe('valid');
  });
});

test.describe('Princess Mansion persistence', () => {
  test('migrates the original save and its unfinished care without losing progress', () => {
    const raw = JSON.stringify(legacy.schema1);
    const parsed = parseSave(raw);
    expect(parsed.kind).toBe('valid');
    if (parsed.kind !== 'valid') throw new Error('Original save migration failed');
    expect(parsed.state.schemaVersion).toBe(3);
    expect(parsed.state.adventureId).toBe(legacy.schema1.adventureId);
    expect(parsed.state.princesses[0].needs).toEqual(legacy.schema1.princesses[0].needs);
    expect(parsed.state.princesses[0].activity).toMatchObject(legacy.schema1.princesses[0].activity);
    expect(parsed.state.ambientEnabled).toBe(true);
    expect(parsed.state.autonomyEnabled).toBe(true);
    expect(advance(parsed.state, 7200).state.hearts).toBe(2);
    const port = storage();
    port.items.set(SAVE_KEY, raw);
    const store = new MansionSaveStore(port);
    expect(store.load().kind).toBe('valid');
    expect(store.save(parsed.state).ok).toBe(true);
    expect(port.items.get(BACKUP_KEY)).toBe(raw);
  });

  test('round-trips a walk and preferences and rejects malformed autonomy', () => {
    const walking = advance(adventure(), 18300).state;
    const quiet = command(walking, { type: 'ambient', enabled: false }).state;
    expect(parseSave(JSON.stringify(quiet))).toEqual({ kind: 'valid', state: quiet });
    for (const autonomy of [
      { nextDecisionAt: -1, walk: null },
      { nextDecisionAt: 0, walk: { room: 'dining', x: 999999, stationId: null } },
      { nextDecisionAt: 0, walk: { room: 'bedroom', x: 350, stationId: 'stall-left' } },
      { nextDecisionAt: 0, walk: { room: 'restroom', x: 350, stationId: 'stall-left' } },
    ]) expect(parseSave(JSON.stringify({ ...quiet, princesses: [{ ...quiet.princesses[0], autonomy }] })).kind).toBe('invalid');
    expect(parseSave(JSON.stringify({ ...quiet, autonomyEnabled: false })).kind).toBe('invalid');
    expect(parseSave(JSON.stringify({ ...quiet, ambientEnabled: 'yes' })).kind).toBe('invalid');
  });

  test('round-trips every mid-activity state without offline decay or duplicate rewards', () => {
    for (const station of originalStations) {
      const initial = adventure();
      initial.princesses[0].needs = { satiety: 25, energy: 25, hygiene: 25, toiletComfort: 25, fun: 25 };
      const started = command(initial, { type: 'place', id: 'liora', room: station.room, x: station.x, y: 480, stationId: station.id }).state;
      expect(started.princesses[0].activity?.kind).toBe('active');
      const mid = advance(started, 1300).state;
      const parsed = parseSave(JSON.stringify({ ...mid, savedAt: 1 }));
      expect(parsed.kind).toBe('valid');
      if (parsed.kind !== 'valid') throw new Error('Mid-action snapshot rejected');
      expect(parsed.state).toEqual({ ...mid, savedAt: 1 });
      const completed = advance(parsed.state, 20000).state;
      const reloaded = parseSave(JSON.stringify(completed));
      expect(reloaded.kind).toBe('valid');
      if (reloaded.kind === 'valid') expect(advance(reloaded.state, 1000).state.hearts).toBe(completed.hearts);
    }
  });

  test('rejects corrupt JSON, non-finite values, unknown content and unsupported versions', () => {
    const state = adventure();
    for (const value of ['not-json', JSON.stringify({ ...state, hearts: -1 }), JSON.stringify({ ...state, schemaVersion: 4 }),
      JSON.stringify({ ...state, princesses: [{ ...state.princesses[0], x: -1 }] }),
      JSON.stringify({ ...state, princesses: [{ ...state.princesses[0], id: 'not-a-princess' }] }),
      JSON.stringify({ ...state, activeTime: Infinity })]) expect(parseSave(value).kind).toBe('invalid');
    expect(parseSave(JSON.stringify({ ...state, schemaVersion: 2.5 }))).toEqual({ kind: 'invalid', error: 'corruptSave' });
    expect(parseSave(JSON.stringify({ ...state, schemaVersion: 4 }))).toEqual({ kind: 'invalid', error: 'newerSave' });
  });

  test('rejects duplicate station ownership rather than restoring an inconsistent stall', () => {
    let state = { ...adventure(), hearts: 100 };
    state = command(state, { type: 'invite', id: 'mira' }).state;
    state = command(state, { type: 'place', id: 'liora', room: 'restroom', x: 350, y: 480, stationId: 'stall-left' }).state;
    const activity = state.princesses[0].activity;
    const corrupted = { ...state, princesses: [state.princesses[0], { ...state.princesses[1], room: 'restroom', activity }] };
    expect(parseSave(JSON.stringify(corrupted)).kind).toBe('invalid');
  });

  test('maintains a validated backup and offers explicit recovery', () => {
    const port = storage();
    const store = new MansionSaveStore(port);
    expect(store.load().kind).toBe('empty');
    const first = store.save(adventure());
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error('Initial save failed');
    const second = store.save(advance(first.state, 300).state);
    expect(second.ok).toBe(true);
    expect(parseSave(port.items.get(BACKUP_KEY) ?? '').kind).toBe('valid');
    port.items.set(SAVE_KEY, 'corrupted');
    expect(new MansionSaveStore(port).load().kind).toBe('recoverable');
  });

  test('detects stale writers without overwriting a newer save', () => {
    const port = storage();
    const first = new MansionSaveStore(port);
    const stale = new MansionSaveStore(port);
    first.load(); stale.load();
    expect(first.save(adventure()).ok).toBe(true);
    const before = port.items.get(SAVE_KEY);
    expect(stale.save(adventure())).toEqual({ ok: false, error: 'conflict' });
    expect(port.items.get(SAVE_KEY)).toBe(before);
  });

  test('a failed new-adventure write preserves the old primary save', () => {
    const port = storage();
    const store = new MansionSaveStore(port);
    store.load();
    expect(store.save(adventure()).ok).toBe(true);
    const old = port.items.get(SAVE_KEY);
    let fail = true;
    const failing = new MansionSaveStore({ getItem: port.getItem, setItem(key, value) {
      if (fail && key === SAVE_KEY) throw new DOMException('Full', 'QuotaExceededError');
      port.setItem(key, value);
    } });
    failing.load();
    expect(failing.save(createAdventure('easy', 'replacement'))).toEqual({ ok: false, error: 'quota' });
    expect(port.items.get(SAVE_KEY)).toBe(old);
    fail = false;
    expect(failing.save(createAdventure('easy', 'replacement')).ok).toBe(true);
  });
});
