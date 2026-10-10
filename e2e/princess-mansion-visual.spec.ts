import { test, expect } from '@playwright/test';
import { PRINCESS_IDS, LEGACY_ROOM_IDS, ROOM_WIDTH, STATIONS } from '../src/features/games/princess-mansion/data';
import { command } from '../src/features/games/princess-mansion/model';
import { careFixture, mansionThumbnailFixture, readyMansion, seedMansion } from './princess-mansion-fixtures';

test('all eight storybook rooms render their furnished care poses', async ({ page }, testInfo) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let state = careFixture();
  state.hearts = 100;
  for (const id of PRINCESS_IDS.slice(1)) state = command(state, { type: 'invite', id }).state;
  state.collectionCelebrated = true;
  state.princesses = state.princesses.map(princess => ({ ...princess, needs: { satiety: 25, energy: 25, hygiene: 25, toiletComfort: 25, fun: 25 } }));
  const stations = ['bed-0', 'reading', 'royal-table', 'stall-left', 'bubble-bath', 'craft-easel', 'royal-piano', 'tree-swing'];
  for (const [index, id] of PRINCESS_IDS.entries()) {
    const station = STATIONS.find(item => item.id === stations[index]);
    if (!station) throw new Error(`Missing visual fixture station: ${stations[index]}`);
    state = command(state, { type: 'place', id, room: station.room, x: station.x, y: 480, stationId: station.id }).state;
    expect(state.princesses.find(princess => princess.id === id)?.activity?.stationId).toBe(station.id);
  }
  state = command(state, { type: 'camera', room: 'bedroom', centerX: ROOM_WIDTH / 2 }).state;
  await seedMansion(page, state);
  await page.addInitScript(() => Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await readyMansion(page);
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await expect(page.locator('canvas')).toHaveCount(1);
  for (const [index, room] of LEGACY_ROOM_IDS.entries()) {
    await page.locator('[aria-label="Choose a princess"] button').nth(index).click();
    await page.locator('nav[aria-label] button').nth(index).click();
    await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-room', room);
    await page.waitForTimeout(100);
    await page.screenshot({ path: testInfo.outputPath(`${room}.png`), animations: 'disabled' });
  }
  expect(errors).toEqual([]);
});

test('a complete eight-princess household remains responsive', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seedMansion(page, mansionThumbnailFixture());
  await readyMansion(page);
  await page.waitForTimeout(500);
  const timings = await page.evaluate(async () => {
    const intervals: number[] = [];
    return new Promise<{ frames: number; elapsed: number; medianFrame: number }>(resolve => {
      const started = performance.now();
      let previous = started;
      const frame = (now: number) => {
        intervals.push(now - previous);
        previous = now;
        if (now - started < 2000) {
          requestAnimationFrame(frame);
          return;
        }
        intervals.sort((a, b) => a - b);
        resolve({ frames: intervals.length, elapsed: now - started, medianFrame: intervals[Math.floor(intervals.length / 2)] });
      };
      requestAnimationFrame(frame);
    });
  });
  console.log('Eight-princess frame timings:', timings);
  await testInfo.attach('eight-princess-frame-timings', { body: JSON.stringify(timings), contentType: 'application/json' });
  expect(timings.frames).toBeGreaterThan(30);
  expect(timings.medianFrame).toBeLessThan(67);
  await page.getByRole('button', { name: 'Bubble bathroom', exact: true }).click();
  await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-room', 'bathroom');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'A quiet little moment' })).toBeVisible();
  expect(await page.locator('canvas').count()).toBe(1);
});
