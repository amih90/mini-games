import { test, expect } from '@playwright/test';
import { audioState, careFixture, readyMansion, savedMansion, seedMansion, trackAudio } from './princess-mansion-fixtures';

test.describe.configure({ mode: 'parallel' });

test('real quiet ambience and playful effects use one shared context and respect pause, mute and visibility', async ({ page }) => {
  await trackAudio(page);
  await seedMansion(page, careFixture());
  await readyMansion(page);
  await page.bringToFront();
  expect((await audioState(page)).playing).toEqual([]);
  await page.getByRole('button', { name: 'Sound Off', exact: true }).click();
  await expect.poll(async () => (await audioState(page)).ambient?.paused).toBe(false);
  await expect.poll(async () => (await audioState(page)).ambient?.ready ?? 0).toBeGreaterThanOrEqual(2);
  const started = await audioState(page);
  expect(started.ambient?.volume).toBeLessThanOrEqual(0.15);
  expect(started.ambient?.loop).toBe(true);
  expect(started.ambient?.error).toBeUndefined();
  expect(started.contexts).toBe(1);
  await page.getByTestId('station-royal-table').click();
  await expect.poll(async () => (await audioState(page)).played.some(src => src.endsWith('munch.wav'))).toBe(true);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect.poll(async () => (await audioState(page)).ambient?.paused).toBe(true);
  await page.getByRole('button', { name: 'Keep caring', exact: true }).click();
  await expect.poll(async () => (await audioState(page)).ambient?.paused).toBe(false);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async () => (await audioState(page)).playing).toEqual([]);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async () => (await audioState(page)).ambient?.paused).toBe(false);
  await page.getByRole('button', { name: 'Sound On', exact: true }).click();
  await expect.poll(async () => (await audioState(page)).playing).toEqual([]);
  expect((await audioState(page)).contexts).toBe(1);
});

test('royal preferences persist and disabling ambience does not mute button effects', async ({ page }, testInfo) => {
  await trackAudio(page);
  await seedMansion(page, careFixture());
  await readyMansion(page);
  await page.getByRole('button', { name: 'Sound Off', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const ambient = page.getByRole('checkbox', { name: 'Soft palace ambience' });
  const autonomy = page.getByRole('checkbox', { name: 'Lively princesses' });
  await expect(ambient).toBeChecked();
  await expect(autonomy).toBeChecked();
  await ambient.uncheck();
  await autonomy.uncheck();
  await expect.poll(async () => (await savedMansion(page)).ambientEnabled).toBe(false);
  await expect.poll(async () => (await savedMansion(page)).autonomyEnabled).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('royal-preferences.png') });
  await page.getByRole('button', { name: 'Keep caring', exact: true }).click();
  await expect.poll(async () => (await audioState(page)).ambient?.paused).toBe(true);
  await page.getByRole('button', { name: 'Princess album', exact: true }).first().click();
  await expect.poll(async () => (await audioState(page)).played.some(src => src.endsWith('button.mp3'))).toBe(true);
  await page.reload();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByTestId('station-royal-table')).toBeEnabled();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(ambient).not.toBeChecked();
  await expect(autonomy).not.toBeChecked();
});

test('a princess walks without player input and manual care immediately overrides her plan', async ({ page }) => {
  const state = careFixture();
  state.princesses[0].needs.fun = 100;
  state.princesses[0].autonomy.nextDecisionAt = 500;
  await seedMansion(page, state);
  await readyMansion(page);
  await expect.poll(async () => (await savedMansion(page)).princesses[0].x).not.toBe(state.princesses[0].x);
  expect((await savedMansion(page)).cameraCenterX).toBe(state.cameraCenterX);
  await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-moving', 'false');
  await page.getByTestId('station-royal-table').click();
  await expect.poll(async () => (await savedMansion(page)).princesses[0].activity?.source).toBe('player');
  expect((await savedMansion(page)).princesses[0].autonomy.walk).toBeNull();
});

test('a princess chooses a useful nearby activity without being dragged', async ({ page }) => {
  const state = careFixture('lounge');
  state.activeTime = 60000;
  state.princesses[0].needs.energy = 80;
  state.princesses[0].autonomy.nextDecisionAt = 0;
  await seedMansion(page, state);
  await readyMansion(page);
  await expect.poll(async () => (await savedMansion(page)).princesses[0].activity?.source).toBe('princess');
  const saved = await savedMansion(page);
  expect(saved.princesses[0].activity?.stationId).toBe('reading');
  expect(saved.cameraCenterX).toBe(state.cameraCenterX);
  await expect.poll(async () => (await savedMansion(page)).princesses[0].needs.fun, { timeout: 15000 }).toBeGreaterThan(90);
});

test('failed sound assets have an explicit retry without blocking or replacing the adventure', async ({ page }) => {
  await page.route('**/audio/button.mp3', route => route.abort('failed'));
  await seedMansion(page, careFixture());
  await readyMansion(page);
  await page.getByRole('button', { name: 'Sound Off', exact: true }).click();
  await page.getByRole('button', { name: 'Princess album', exact: true }).first().click();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByText("The sounds couldn't play.", { exact: false })).toBeVisible();
  const id = await page.getByTestId('mansion-game').getAttribute('data-adventure-id');
  await page.unroute('**/audio/button.mp3');
  await page.getByRole('button', { name: 'Try sounds again' }).click();
  await expect(page.getByText("The sounds couldn't play.", { exact: false })).toHaveCount(0);
  await page.getByTestId('station-royal-table').click();
  await expect.poll(async () => (await savedMansion(page)).princesses[0].activity?.kind).toBe('active');
  await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-adventure-id', id ?? '');
});

test('joyful welcome, difficulty cards and princess album render with reduced motion', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seedMansion(page, null);
  await page.goto('/en/games/princess-mansion');
  const welcome = page.getByRole('dialog', { name: 'A little kingdom of kindness' });
  await expect(welcome).toBeVisible();
  await expect(welcome.locator('img')).toHaveCount(3);
  await expect(welcome.locator('[data-level]')).toHaveCount(3);
  expect(await welcome.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await page.screenshot({ path: testInfo.outputPath('joyful-welcome.png') });
  await page.getByRole('button', { name: 'Begin our adventure' }).click();
  await page.getByRole('button', { name: /Got it! Let's Play!/ }).click();
  await expect(page.getByTestId('station-royal-table')).toBeEnabled();
  await page.getByRole('button', { name: 'Princess album', exact: true }).first().click();
  const album = page.getByRole('dialog', { name: 'Princess album' });
  await expect(album.locator('article')).toHaveCount(8);
  await page.screenshot({ path: testInfo.outputPath('joyful-album.png') });
});
