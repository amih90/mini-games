import { expect, type Page } from '@playwright/test';
import { PRINCESS_IDS, ROOM_WIDTH, WORLD_HEIGHT, clamp, destinationForRoom, roomIndex, worldWidth, type RoomId } from '../src/features/games/princess-mansion/data';
import { command, createAdventure, pendingInvitations, type MansionState } from '../src/features/games/princess-mansion/model';
import { SAVE_KEY, parseSave } from '../src/features/games/princess-mansion/persistence';

interface AudioProbe { nodes: HTMLAudioElement[]; played: string[]; contexts: number; sources: number; attempts: number }

export async function failSaveWrites(page: Page): Promise<void> {
  await page.evaluate(key => {
    localStorage.setItem('mansion-simulate-quota', 'true');
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key && this.getItem('mansion-simulate-quota') === 'true') throw new DOMException('Simulated storage full', 'QuotaExceededError');
      write.call(this, name, value);
    };
  }, SAVE_KEY);
}

export async function trackAudio(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const probe: AudioProbe = { nodes: [], played: [], contexts: 0, sources: 0, attempts: 0 };
    Object.defineProperty(window, 'mansionAudioProbe', { value: probe });
    window.Audio = new Proxy(window.Audio, {
      construct(target, args) {
        const audio: HTMLAudioElement = Reflect.construct(target, args);
        probe.nodes.push(audio);
        audio.addEventListener('play', () => probe.played.push(audio.src));
        return audio;
      },
    });
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = class extends NativeAudioContext {
      constructor(options?: AudioContextOptions) { super(options); probe.contexts++; }
      createOscillator() { probe.sources++; return super.createOscillator(); }
      createBufferSource() { probe.sources++; return super.createBufferSource(); }
    };
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { probe.attempts++; return play.call(this); };
  });
}

export async function audioState(page: Page) {
  return page.evaluate(() => {
    const probe = (window as Window & { mansionAudioProbe?: AudioProbe }).mansionAudioProbe;
    if (!probe) throw new Error('Expected the native audio probe');
    const ambient = probe.nodes.find(audio => /(?:palace|beach)-ambient\.wav$/.test(audio.src));
    return {
      contexts: probe.contexts, sources: probe.sources, attempts: probe.attempts, played: probe.played,
      ambient: ambient ? { file: ambient.src.split('/').pop(), paused: ambient.paused, volume: ambient.volume, loop: ambient.loop, ready: ambient.readyState, error: ambient.error?.message } : null,
      ambientCount: probe.nodes.filter(audio => /(?:palace|beach)-ambient\.wav$/.test(audio.src)).length,
      playing: probe.nodes.filter(audio => !audio.paused).map(audio => audio.src),
    };
  });
}

export function careFixture(room: RoomId = 'dining'): MansionState {
  let state = createAdventure('medium', 'browser-mansion-fixture');
  state.tutorialSeen = true;
  const destination = destinationForRoom(room);
  if (destination !== 'home') state = command(state, { type: 'travel', destination, companions: ['liora'] }).state;
  state.cameraRoom = room;
  state.cameraCenterX = (roomIndex(room) + 0.5) * ROOM_WIDTH;
  state.princesses[0] = { ...state.princesses[0], room, needs: { satiety: 25, energy: 25, hygiene: 25, toiletComfort: 25, fun: 25 } };
  return state;
}

export async function seedMansion(page: Page, state: MansionState | null, options: { showInvitations?: boolean; muted?: boolean } = {}): Promise<void> {
  const snapshot = state && !options.showInvitations ? { ...state, acknowledgedInvitationIds: [...new Set([...state.acknowledgedInvitationIds, ...pendingInvitations(state)])] } : state;
  await seedRawMansion(page, snapshot ? JSON.stringify(snapshot) : null, options.muted ?? true);
}

export async function seedRawMansion(page: Page, raw: string | null, muted = true): Promise<void> {
  await page.addInitScript(({ raw, key, muted }) => {
    if (sessionStorage.getItem('mansion-fixture-seeded')) return;
    sessionStorage.setItem('mansion-fixture-seeded', 'true');
    localStorage.setItem('mini-games-sound-muted', String(muted));
    if (raw) localStorage.setItem(key, raw);
  }, { raw, key: SAVE_KEY, muted });
}

export async function readyMansion(page: Page, locale = 'en'): Promise<void> {
  await page.goto(`/${locale}/games/princess-mansion`);
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.locator('canvas')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-ready', 'true');
}

export async function worldPoint(page: Page, x: number, y: number): Promise<{ x: number; y: number }> {
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) throw new Error('Missing game canvas');
  const state = await savedMansion(page);
  const zoom = canvas.height / WORLD_HEIGHT;
  const width = worldWidth(state.cameraRoom);
  const displayWidth = canvas.width / zoom;
  const left = width < displayWidth ? (width - displayWidth) / 2 : clamp(state.cameraCenterX - displayWidth / 2, 0, width - displayWidth);
  return { x: canvas.x + (x - left) * zoom, y: canvas.y + y * zoom };
}

export async function savedMansion(page: Page): Promise<MansionState> {
  const raw = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
  if (!raw) throw new Error('Expected a saved mansion');
  const result = parseSave(raw);
  if (result.kind !== 'valid') throw new Error(`Expected a valid saved mansion: ${result.error}`);
  return result.state;
}

export function mansionThumbnailFixture(): MansionState {
  let state = careFixture();
  state.hearts = 100;
  for (const id of PRINCESS_IDS.slice(1)) state = command(state, { type: 'invite', id }).state;
  state.collectionCelebrated = true;
  state.princesses = state.princesses.map(princess => ({ ...princess, needs: { satiety: 35, energy: 75, hygiene: 85, toiletComfort: 85, fun: 75 } }));
  for (const id of PRINCESS_IDS.slice(0, 4)) state = command(state, { type: 'place', id, room: 'dining', x: 660, y: 480, stationId: 'royal-table' }).state;
  state = command(state, { type: 'place', id: 'ruby', room: 'dining', x: 180, y: 480, stationId: 'snack-table' }).state;
  for (const [id, x] of [['celeste', 1030], ['hazel', 350], ['nova', 70]] as const) state = command(state, { type: 'place', id, room: 'dining', x, y: 490 }).state;
  state = command(state, { type: 'camera', room: 'dining', centerX: ROOM_WIDTH * 2.5 }).state;
  return command(state, { type: 'select', id: 'liora', focus: false }).state;
}
