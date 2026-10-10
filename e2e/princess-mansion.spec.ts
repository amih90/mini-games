import { test, expect, type Page } from '@playwright/test';
import { ACTIVITIES, LEGACY_ROOM_IDS, ROOM_WIDTH, STATIONS, roomIndex } from '../src/features/games/princess-mansion/data';
import { advance, command, createAdventure } from '../src/features/games/princess-mansion/model';
import { BACKUP_KEY, SAVE_KEY } from '../src/features/games/princess-mansion/persistence';
import { audioState, careFixture, failSaveWrites, readyMansion, savedMansion, seedMansion, trackAudio, worldPoint } from './princess-mansion-fixtures';

test.describe.configure({ mode: 'parallel' });

async function canvasColor(page: Page, x: number, y: number): Promise<number[]> {
  await expect.poll(() => page.locator('canvas').evaluate(canvas => {
    let opacity = 1;
    for (let node: Element | null = canvas; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
    return opacity;
  })).toBe(1);
  const point = await worldPoint(page, x, y);
  const bounds = await page.locator('canvas').boundingBox();
  if (!bounds) throw new Error('Missing game canvas');
  const png = await page.locator('canvas').screenshot({ scale: 'css' });
  return page.evaluate(async ({ imageData, x, y }) => {
    const image = new Image();
    image.src = imageData;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not inspect the rendered scene');
    context.drawImage(image, 0, 0);
    return [...context.getImageData(Math.round(x), Math.round(y), 1, 1).data];
  }, { imageData: `data:image/png;base64,${png.toString('base64')}`, x: point.x - bounds.x, y: point.y - bounds.y });
}

test('a new adventure starts, progresses, recharges and survives a site restart', async ({ page }) => {
  await seedMansion(page, null);
  await page.goto('/en/games/princess-mansion');
  await page.getByRole('button', { name: 'Medium A cozy everyday rhythm' }).click();
  await page.getByRole('button', { name: 'Begin our adventure' }).click();
  await page.getByRole('button', { name: "Got it! Let's Play! 🚀" }).click();
  await expect(page.getByTestId('station-royal-table')).toBeEnabled();
  await expect.poll(async () => Number(await page.getByTestId('mansion-game').getAttribute('data-active-time'))).toBeGreaterThan(0);
  await page.getByTestId('station-royal-table').click();
  await expect.poll(async () => (await savedMansion(page)).princesses[0].activity?.kind).toBe('active');
  const mid = await savedMansion(page);
  await page.goto('about:blank');
  await page.waitForTimeout(300);
  await readyMansion(page);
  expect((await savedMansion(page)).adventureId).toBe(mid.adventureId);
  await expect.poll(async () => (await savedMansion(page)).hearts, { timeout: 14000 }).toBe(2);
  await expect(page.getByRole('progressbar', { name: 'Food' })).toHaveAttribute('aria-valuenow', /9[345]/);
});

for (const activity of new Set(STATIONS.filter(station => LEGACY_ROOM_IDS.some(room => room === station.room)).map(station => station.activity))) {
  const station = STATIONS.find(item => item.activity === activity)!;
  test(`${activity} restores the intended need through the real game UI`, async ({ page }) => {
    test.setTimeout(40000);
    await seedMansion(page, careFixture(station.room));
    await readyMansion(page);
    await page.getByTestId(`station-${station.id}`).click();
    await expect.poll(async () => (await savedMansion(page)).princesses[0].activity?.kind).toBe('active');
    await expect.poll(async () => (await savedMansion(page)).hearts, { timeout: 26000 }).toBe(activity === 'meal' ? 2 : 1);
    const completed = await savedMansion(page);
    expect(completed.princesses[0].activity).toBeNull();
    expect(completed.princesses[0].needs[ACTIVITIES[activity].need]).toBeGreaterThan(ACTIVITIES[activity].target - 1);
  });
}

test('mouse dragging drops a princess at a table and background dragging pans the camera', async ({ page }) => {
  await seedMansion(page, careFixture());
  await readyMansion(page);
  const start = await worldPoint(page, 2 * ROOM_WIDTH + 940, 390);
  const end = await worldPoint(page, 2 * ROOM_WIDTH + 660, 390);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 12 });
  await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-moving', 'true');
  await page.mouse.up();
  await expect.poll(async () => (await savedMansion(page)).princesses[0].activity?.stationId).toBe('royal-table');
  const before = (await savedMansion(page)).cameraCenterX;
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) throw new Error('Missing canvas');
  await page.mouse.move(canvas.x + 350, canvas.y + 90);
  await page.mouse.down();
  await page.mouse.move(canvas.x + 200, canvas.y + 90, { steps: 8 });
  await page.mouse.up();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  expect((await savedMansion(page)).cameraCenterX).toBeGreaterThan(before);
});

test('edge scrolling carries a princess across rooms', async ({ page }) => {
  await seedMansion(page, careFixture());
  await readyMansion(page);
  const start = await worldPoint(page, 2 * ROOM_WIDTH + 940, 390);
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) throw new Error('Missing canvas');
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width - 15, start.y, { steps: 8 });
  await page.waitForTimeout(1500);
  await page.mouse.up();
  await expect.poll(async () => (await savedMansion(page)).princesses[0].room).not.toBe('dining');
  expect((await savedMansion(page)).cameraCenterX).toBeGreaterThan(2.5 * ROOM_WIDTH);
});

test('arrows, WASD, Space, Enter and Escape provide complete keyboard movement', async ({ page }) => {
  await seedMansion(page, careFixture());
  await readyMansion(page);
  await page.locator('canvas').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-room', 'dining');
  await page.keyboard.press('s');
  await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-room', 'restroom');
  await page.keyboard.press('w');
  await page.keyboard.down('Space');
  await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-moving', 'true');
  await page.keyboard.down('Space');
  await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-moving', 'true');
  await page.keyboard.up('Space');
  await page.keyboard.press('a');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('d');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-moving', 'false');
  await page.keyboard.press('Space');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-moving', 'false');
  await page.keyboard.down('Escape');
  await expect(page.getByRole('dialog', { name: 'A quiet little moment' })).toBeVisible();
  await page.keyboard.down('Escape');
  await expect(page.getByRole('dialog', { name: 'A quiet little moment' })).toBeVisible();
  await page.keyboard.up('Escape');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'A quiet little moment' })).toHaveCount(0);
});

test('dialogs trap keyboard focus and ignore repeated Escape dismissal', async ({ page }) => {
  await seedMansion(page, careFixture());
  await readyMansion(page);
  const pause = page.getByRole('button', { name: 'Pause', exact: true });
  await pause.click();
  const dialog = page.getByRole('dialog', { name: 'A quiet little moment' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.down('Escape');
  await page.keyboard.down('Escape');
  await page.keyboard.up('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(pause).toBeFocused();
});

test('room-and-care buttons move a princess without dragging and full-meter refusals remain visible', async ({ page }) => {
  const state = careFixture();
  state.princesses[0].needs.satiety = 100;
  await seedMansion(page, state);
  await readyMansion(page);
  await page.getByTestId('station-royal-table').click();
  await expect(page.getByText('Liora says, “Not now, thank you!”')).toBeVisible();
  const first = await savedMansion(page);
  expect(first.princesses[0].x).toBeGreaterThan(920);
  await page.getByTestId('station-royal-table').click();
  await expect(page.getByText("Liora wants a different activity. Let's listen.")).toBeVisible();
  expect((await savedMansion(page)).princesses[0].happiness).toBeLessThan(first.princesses[0].happiness);
  await page.getByRole('button', { name: 'Bubble bathroom', exact: true }).click();
  await page.getByTestId('station-bubble-bath').click();
  expect((await savedMansion(page)).princesses[0].room).toBe('bathroom');
});

test('pausing, hiding and closing never advance needs offline', async ({ page }) => {
  await seedMansion(page, careFixture());
  await readyMansion(page);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = await savedMansion(page);
  await page.waitForTimeout(1100);
  expect((await savedMansion(page)).activeTime).toBe(paused.activeTime);
  await page.getByRole('button', { name: 'Keep caring', exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hidden = await savedMansion(page);
  await page.waitForTimeout(1100);
  expect((await savedMansion(page)).activeTime).toBe(hidden.activeTime);
  expect((await savedMansion(page)).princesses[0].needs).toEqual(hidden.princesses[0].needs);
  await page.goto('about:blank');
  await page.waitForTimeout(1100);
  await readyMansion(page);
  expect((await savedMansion(page)).princesses[0].needs.satiety).toBeGreaterThan(hidden.princesses[0].needs.satiety - 1);
});

test('new-adventure confirmation and cancelled setup preserve the original save', async ({ page }) => {
  const original = careFixture();
  original.hearts = 16;
  await seedMansion(page, original);
  await readyMansion(page);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'New adventure', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect((await savedMansion(page)).adventureId).toBe(original.adventureId);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'New adventure', exact: true }).click();
  await page.getByRole('button', { name: 'Choose a new adventure' }).click();
  await page.getByRole('button', { name: 'Hard Busier needs and longer activities' }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect((await savedMansion(page)).hearts).toBe(16);
  expect((await savedMansion(page)).difficulty).toBe('medium');
});

test('a failed replacement write keeps the old adventure, and a successful replacement disposes the old scene', async ({ page }) => {
  const original = careFixture();
  await seedMansion(page, original);
  await readyMansion(page);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'New adventure', exact: true }).click();
  await page.getByRole('button', { name: 'Choose a new adventure' }).click();
  const before = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
  await failSaveWrites(page);
  await page.getByRole('button', { name: 'Begin our adventure' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('previous save is safe');
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(before);
  await page.evaluate(() => localStorage.setItem('mansion-simulate-quota', 'false'));
  await page.getByRole('button', { name: 'Begin our adventure' }).click();
  await page.getByRole('button', { name: "Got it! Let's Play! 🚀" }).click();
  await expect.poll(async () => (await savedMansion(page)).adventureId).not.toBe(original.adventureId);
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.getByTestId('station-royal-table').click();
  await expect.poll(async () => (await savedMansion(page)).princesses[0].activity?.kind).toBe('active');
});

test('autosave quota failures pause play and retry without losing the current activity', async ({ page }) => {
  await seedMansion(page, careFixture());
  await readyMansion(page);
  await failSaveWrites(page);
  await page.getByTestId('station-royal-table').click();
  await expect(page.getByRole('dialog', { name: "Let's protect your adventure" })).toBeVisible();
  const time = await page.getByTestId('mansion-game').getAttribute('data-active-time');
  await page.waitForTimeout(600);
  expect(await page.getByTestId('mansion-game').getAttribute('data-active-time')).toBe(time);
  await page.evaluate(() => localStorage.setItem('mansion-simulate-quota', 'false'));
  await page.getByRole('button', { name: 'Try saving again' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await savedMansion(page)).princesses[0].activity?.kind).toBe('active');
});

test('a second tab is read-only and cannot overwrite the active adventure', async ({ page, context }) => {
  await seedMansion(page, careFixture());
  await readyMansion(page);
  const second = await context.newPage();
  await second.goto('/en/games/princess-mansion');
  await expect(second.getByRole('dialog', { name: 'Your mansion is open elsewhere' })).toBeVisible();
  await second.close();
  await page.bringToFront();
  await page.getByTestId('station-royal-table').click();
  expect((await savedMansion(page)).princesses[0].activity?.kind).toBe('active');
});

test('a valid backup is offered explicitly rather than silently applied', async ({ page }) => {
  const state = careFixture();
  await page.addInitScript(({ primary, backup, raw }) => {
    if (sessionStorage.getItem('mansion-recovery-seeded')) return;
    sessionStorage.setItem('mansion-recovery-seeded', 'true');
    localStorage.setItem(primary, '{broken');
    localStorage.setItem(backup, raw);
  }, { primary: SAVE_KEY, backup: BACKUP_KEY, raw: JSON.stringify(state) });
  await page.goto('/en/games/princess-mansion');
  await expect(page.getByRole('dialog', { name: 'A safe copy is waiting' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore the safe copy' }).click();
  await expect(page.getByTestId('station-royal-table')).toBeEnabled();
  expect((await savedMansion(page)).adventureId).toBe(state.adventureId);
});

test('future save versions are retained, even when an older backup exists', async ({ page }) => {
  const state = careFixture();
  const raw = JSON.stringify({ ...state, schemaVersion: 4 });
  await page.addInitScript(({ primary, backup, raw, old }) => {
    localStorage.setItem(primary, raw);
    localStorage.setItem(backup, old);
  }, { primary: SAVE_KEY, backup: BACKUP_KEY, raw, old: JSON.stringify(state) });
  await page.goto('/en/games/princess-mansion');
  await expect(page.getByRole('dialog')).toContainText('saved by a newer game version');
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(raw);
  await expect(page.getByRole('button', { name: 'Restore the safe copy' })).toHaveCount(0);
});

test('unavailable storage is explained instead of crashing or claiming a successful save', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Storage blocked', 'SecurityError'); } }));
  await page.goto('/en/games/princess-mansion');
  await expect(page.getByRole('dialog', { name: "Let's protect your adventure" })).toContainText('Browser storage is unavailable');
  await expect(page.getByRole('button', { name: 'Reload', exact: true })).toBeEnabled();
});

test('unsupported Web Locks show the single-tab warning and external writes stop play', async ({ page }) => {
  await seedMansion(page, careFixture());
  await page.addInitScript(() => Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true }));
  await readyMansion(page);
  await expect(page.getByText('This browser cannot lock saves.', { exact: false })).toBeVisible();
  const replacement = careFixture();
  replacement.adventureId = 'external-replacement';
  await page.evaluate(({ key, raw }) => {
    localStorage.setItem(key, raw);
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: raw, storageArea: localStorage }));
  }, { key: SAVE_KEY, raw: JSON.stringify(replacement) });
  await expect(page.getByRole('dialog')).toContainText('Another tab or tool changed this save');
  expect((await savedMansion(page)).adventureId).toBe(replacement.adventureId);
});

test('invitations are optional, all eight original princesses load, and collection completion keeps the adventure', async ({ page }) => {
  const state = careFixture();
  state.hearts = 100;
  await seedMansion(page, state);
  await readyMansion(page);
  await page.getByRole('button', { name: 'Princess album', exact: true }).first().click();
  expect((await savedMansion(page)).princesses).toHaveLength(1);
  for (let index = 0; index < 7; index++) await page.getByRole('button', { name: 'Invite her', exact: true }).first().click();
  await expect(page.getByRole('dialog', { name: 'A home full of friendship!' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep caring together', exact: false }).click();
  await expect(page.getByTestId('station-royal-table')).toBeEnabled();
  const complete = await savedMansion(page);
  expect(complete.princesses).toHaveLength(8);
  expect(complete.collectionCelebrated).toBe(true);
  expect(complete.adventureId).toBe(state.adventureId);
  await page.reload();
  await expect(page.getByTestId('station-royal-table')).toBeEnabled();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

for (const locale of ['en', 'he', 'zh', 'es']) {
  test(`${locale} is fully localized and keeps physical room direction`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedMansion(page, careFixture());
    const errors: string[] = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await readyMansion(page, locale);
    const positions = await page.locator('nav[aria-label] button').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().x));
    expect(positions.every((position, index) => index === 0 || position > positions[index - 1])).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    if (locale === 'he') expect(await page.getByTestId('mansion-game').evaluate(element => getComputedStyle(element).direction)).toBe('rtl');
    await page.getByTestId('station-royal-table').click();
    expect((await savedMansion(page)).princesses[0].activity?.kind).toBe('active');
    expect(errors).toEqual([]);
  });
}

test('restoring a private visit reconstructs the closed door before the first scene frame', async ({ page }) => {
  let state = careFixture('restroom');
  state = command(state, { type: 'place', id: 'liora', room: 'restroom', x: 350, y: 480, stationId: 'stall-left' }).state;
  state = advance(state, 1700).state;
  state.cameraCenterX = roomIndex('restroom') * ROOM_WIDTH + 580;
  await seedMansion(page, state);
  await page.addInitScript(() => Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await readyMansion(page);
  expect((await savedMansion(page)).princesses[0].activity).toEqual(state.princesses[0].activity);
  await expect(page.getByTestId('station-stall-left')).toContainText('1/1');
  expect((await canvasColor(page, roomIndex('restroom') * ROOM_WIDTH + 350, 310)).slice(0, 3)).toEqual([209, 156, 152]);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async () => (await savedMansion(page)).hearts, { timeout: 9000 }).toBe(1);
  expect((await canvasColor(page, roomIndex('restroom') * ROOM_WIDTH + 350, 310)).slice(0, 3)).toEqual([241, 232, 216]);
});

test('missing artwork stops play, and retry reconstructs the intact saved adventure', async ({ page }) => {
  const state = careFixture();
  await seedMansion(page, state);
  await page.route('**/games/princess-mansion/rooms/bathroom.svg', route => route.abort());
  await page.goto('/en/games/princess-mansion');
  await expect(page.getByRole('dialog', { name: "The storybook couldn't open" })).toBeVisible();
  expect((await savedMansion(page)).adventureId).toBe(state.adventureId);
  await page.unroute('**/games/princess-mansion/rooms/bathroom.svg');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByTestId('station-royal-table')).toBeEnabled();
  await expect.poll(async () => Number(await page.getByTestId('mansion-game').getAttribute('data-active-time'))).toBeGreaterThan(0);
});

test('dirty progress is checkpointed within the ten-second autosave interval', async ({ page }) => {
  await seedMansion(page, careFixture());
  await readyMansion(page);
  await expect.poll(async () => (await savedMansion(page)).revision, { timeout: 12000 }).toBeGreaterThan(0);
  const saved = await savedMansion(page);
  expect(saved.activeTime).toBeGreaterThan(5000);
  expect(saved.princesses[0].needs.satiety).toBeLessThan(25);
});

test('one sound owner honors mute for both controls and completed world activities', async ({ page }) => {
  await trackAudio(page);
  await seedMansion(page, careFixture());
  await readyMansion(page);
  await page.bringToFront();
  await page.getByRole('button', { name: 'Sound Off', exact: true }).click();
  await page.getByTestId('station-royal-table').click();
  await page.getByRole('button', { name: 'Liora', exact: true }).click();
  await expect.poll(async () => (await audioState(page)).played.some(src => src.endsWith('munch.wav'))).toBe(true);
  await page.getByRole('button', { name: 'Sound On', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sound Off', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => (await audioState(page)).playing).toEqual([]);
  const muted = await audioState(page);
  expect(muted.attempts).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Stop activity', exact: true }).click();
  await page.getByRole('button', { name: 'Private restroom', exact: true }).click();
  await page.getByTestId('station-stall-left').click();
  await expect.poll(async () => (await savedMansion(page)).hearts, { timeout: 10000 }).toBe(1);
  const completed = await audioState(page);
  expect(completed.sources).toBe(muted.sources);
  expect(completed.attempts).toBe(muted.attempts);
  expect(completed.playing).toEqual([]);
  expect(completed.contexts).toBe(1);
});

test.describe('touch input', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test('a real touch drag feeds a princess and resize safely cancels a held move', async ({ page, context }, testInfo) => {
    const state = createAdventure('medium', 'phone-mansion-fixture');
    state.tutorialSeen = true;
    await seedMansion(page, state);
    await readyMansion(page);
    await expect(page.getByRole('img', { name: /Interactive princess mansion/ })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('first-phone-adventure.png'), animations: 'disabled' });
    const start = await worldPoint(page, 2 * ROOM_WIDTH + 940, 390);
    const end = await worldPoint(page, 2 * ROOM_WIDTH + 810, 390);
    expect(start.x).toBeGreaterThan(0);
    expect(start.x).toBeLessThan(390);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] });
    for (let step = 1; step <= 8; step++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + (end.x - start.x) * step / 8, y: end.y, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(async () => (await savedMansion(page)).princesses[0].activity?.stationId).toBe('royal-table');
    await page.getByRole('button', { name: 'Move princess', exact: true }).tap();
    await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-moving', 'true');
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-moving', 'false');
    await page.getByTestId('station-royal-table').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('station-royal-table')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await cdp.detach();
  });
});
