import { expect, type Page } from '@playwright/test';
import { PRINCESS_IDS, ROOM_WIDTH, roomIndex, type RoomId } from '../src/features/games/princess-mansion/data';
import { command, createAdventure, type MansionState } from '../src/features/games/princess-mansion/model';
import { SAVE_KEY, parseSave } from '../src/features/games/princess-mansion/persistence';

interface AudioProbe { nodes: HTMLAudioElement[]; played: string[]; contexts: number; sources: number; attempts: number }

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
    const ambient = probe.nodes.find(audio => audio.src.endsWith('palace-ambient.wav'));
    return {
      contexts: probe.contexts, sources: probe.sources, attempts: probe.attempts, played: probe.played,
      ambient: ambient ? { paused: ambient.paused, volume: ambient.volume, loop: ambient.loop, ready: ambient.readyState, error: ambient.error?.message } : null,
      playing: probe.nodes.filter(audio => !audio.paused).map(audio => audio.src),
    };
  });
}

export function careFixture(room: RoomId = 'dining'): MansionState {
  const state = createAdventure('medium', 'browser-mansion-fixture');
  state.tutorialSeen = true;
  state.cameraRoom = room;
  state.cameraCenterX = (roomIndex(room) + 0.5) * ROOM_WIDTH;
  state.princesses[0] = { ...state.princesses[0], room, needs: { satiety: 25, energy: 25, hygiene: 25, toiletComfort: 25, fun: 25 } };
  return state;
}

export async function seedMansion(page: Page, state: MansionState | null): Promise<void> {
  await page.addInitScript(({ raw, key }) => {
    if (sessionStorage.getItem('mansion-fixture-seeded')) return;
    sessionStorage.setItem('mansion-fixture-seeded', 'true');
    localStorage.setItem('mini-games-sound-muted', 'true');
    if (raw) localStorage.setItem(key, raw);
  }, { raw: state ? JSON.stringify(state) : null, key: SAVE_KEY });
}

export async function readyMansion(page: Page, locale = 'en'): Promise<void> {
  await page.goto(`/${locale}/games/princess-mansion`);
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.locator('canvas')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByTestId('station-royal-table').or(page.locator('[data-testid^="station-"]').first()).first()).toBeEnabled();
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
