import { test, expect, type Page } from '@playwright/test';
import en from '../messages/en.json';
import he from '../messages/he.json';
import zh from '../messages/zh.json';
import es from '../messages/es.json';
import { NEED_IDS, RECIPES } from '../src/features/games/princess-mansion/data';
import { command } from '../src/features/games/princess-mansion/model';
import { careFixture, mansionThumbnailFixture, readyMansion, savedMansion, seedMansion, worldPoint } from './princess-mansion-fixtures';

const dictionaries = { en, he, zh, es };
test.use({ screenshot: 'only-on-failure' });
test.describe.configure({ mode: 'parallel' });

function familyFixture() {
  let state = careFixture();
  state.hearts = 20;
  state.coins = 14;
  state.autonomyEnabled = false;
  for (const id of ['mira', 'coral', 'flora'] as const) state = command(state, { type: 'invite', id }).state;
  return command(state, { type: 'select', id: 'liora', focus: false }).state;
}

async function canvasFrame(page: Page) {
  const frame = await page.locator('canvas').boundingBox();
  if (!frame) throw new Error('Expected the visible mansion canvas');
  return frame;
}

async function unchangedFrame(page: Page, baseline: Awaited<ReturnType<typeof canvasFrame>>) {
  const current = await canvasFrame(page);
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    const layout = Math.abs(current[key] - baseline[key]) < 0.5 ? '' : await page.locator('canvas').evaluate(canvas => {
      const ancestors = [];
      for (let element: Element | null = canvas; element; element = element.parentElement) {
        ancestors.push({ tag: element.tagName, class: element.className, scrollTop: element.scrollTop, height: element.clientHeight, scrollHeight: element.scrollHeight });
      }
      return JSON.stringify({ scrollY, ancestors });
    });
    expect(current[key], `canvas ${key} ${layout}`).toBeCloseTo(baseline[key], 0);
  }
  await expect(page.locator('canvas')).toHaveCount(1);
}

async function visiblePictureTargets(page: Page) {
  const targets = await page.getByTestId('mansion-game').locator('button').evaluateAll(buttons => buttons.filter(button => getComputedStyle(button).display !== 'none').map(button => {
    const { width, height } = button.getBoundingClientRect();
    return { name: button.getAttribute('aria-label') ?? button.textContent, width, height };
  }));
  for (const target of targets) {
    expect(target.width, `${target.name} width`).toBeGreaterThanOrEqual(48);
    expect(target.height, `${target.name} height`).toBeGreaterThanOrEqual(48);
  }
}

for (const { name, width, height } of [
  { name: 'large-desktop', width: 2000, height: 1024 },
  { name: 'small-desktop', width: 800, height: 600 },
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 392 },
  { name: 'compact-landscape', width: 667, height: 375 },
]) {
  test(`${name}: mansion and every potion phase keep the same large canvas`, async ({ page }, testInfo) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height });
    await seedMansion(page, familyFixture());
    await readyMansion(page);
    await page.bringToFront();
    const canvas = await page.locator('canvas').elementHandle();
    if (!canvas) throw new Error('Expected the original renderer element');
    const baseline = await canvasFrame(page);
    expect(baseline.width).toBe(width);
    expect(baseline.height).toBeGreaterThanOrEqual(height * 0.55);
    await page.screenshot({ path: testInfo.outputPath(`${name}-mansion.png`), animations: 'disabled' });
    await page.getByTestId('floor-basement').click();
    await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-world', 'basement');
    await unchangedFrame(page, baseline);
    await page.getByTestId('station-cauldron-left').click();
    const lesson = page.getByTestId('potion-lesson');
    await expect(lesson).toHaveAttribute('data-stage', 'ingredients');
    await unchangedFrame(page, baseline);
    await page.getByTestId('recipe-blossom').click();
    await expect(page.getByTestId('ingredient-dewdrop')).toHaveAttribute('data-next', 'true');
    await page.getByTestId('ingredient-moonwater').click();
    await expect(page.getByTestId('ingredient-moonwater')).toHaveAttribute('data-wrong', 'true');
    await expect(page.getByTestId('ingredient-moonwater').getByText('×', { exact: true })).toBeVisible();
    await unchangedFrame(page, baseline);
    const help = page.getByTestId('help-lessons').getByRole('button');
    await help.click();
    await expect(help).toHaveAttribute('aria-expanded', 'true');
    await unchangedFrame(page, baseline);
    await help.click();
    await visiblePictureTargets(page);
    await expect.poll(async () => (await savedMansion(page)).princesses[0].activity?.stationId).toBe('cauldron-left');
    const face = await worldPoint(page, 320, 376);
    expect(await page.evaluate(point => document.elementFromPoint(point.x, point.y)?.tagName, face), 'potion pictures must not cover the princess face').toBe('CANVAS');
    await page.screenshot({ path: testInfo.outputPath(`${name}-ingredients.png`), animations: 'disabled' });
    for (const [index, ingredient] of RECIPES.blossom.ingredients.entries()) {
      await expect(page.getByTestId(`ingredient-${ingredient}`)).toHaveAttribute('data-next', 'true');
      await page.getByTestId(`ingredient-${ingredient}`).click();
      await unchangedFrame(page, baseline);
      if (index < 2) await expect(lesson.locator('[data-accepted="true"]')).toHaveCount(index + 1);
    }
    await expect(lesson).toHaveAttribute('data-stage', 'mixing');
    await page.bringToFront();
    await unchangedFrame(page, baseline);
    await expect(lesson).toHaveAttribute('data-stage', 'reveal', { timeout: 15000 });
    await unchangedFrame(page, baseline);
    await page.screenshot({ path: testInfo.outputPath(`${name}-reveal.png`), animations: 'disabled' });
    await expect(lesson).toHaveCount(0, { timeout: 6000 });
    await unchangedFrame(page, baseline);
    await page.getByTestId('station-cauldron-right').click();
    await expect(lesson).toHaveAttribute('data-side', 'left');
    await unchangedFrame(page, baseline);
    const otherFace = await worldPoint(page, 835, 376);
    expect(await page.evaluate(point => document.elementFromPoint(point.x, point.y)?.tagName, otherFace), 'the opposite notebook must leave the second princess face clear').toBe('CANVAS');
    await expect.poll(() => canvas.evaluate(element => element.isConnected)).toBe(true);
  });
}

test.describe('small-screen picture wishes and menus', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  for (const locale of ['en', 'he', 'zh', 'es'] as const) {
    test(`${locale}: touch pictures provide care, clothes, toys and treats without reading`, async ({ page }, testInfo) => {
      const state = familyFixture();
      state.inventory.outfits = ['rose-gala'];
      state.inventory.toys = ['plush-dragon'];
      state.inventory.treats.strawberry = 1;
      const copy = dictionaries[locale].princessMansion;
      await seedMansion(page, state);
      await readyMansion(page, locale);
      await page.bringToFront();
      await expect(page.getByRole('link', { name: dictionaries[locale].common.back, exact: true })).toBeVisible();
      const baseline = await canvasFrame(page);
      expect(baseline.height).toBeGreaterThan(580);
      expect(await page.getByTestId('mansion-game').evaluate(element => getComputedStyle(element).direction)).toBe(locale === 'he' ? 'rtl' : 'ltr');
      await visiblePictureTargets(page);
      for (const [need, room] of [['satiety', 'dining'], ['energy', 'bedroom'], ['hygiene', 'bathroom'], ['toiletComfort', 'restroom']] as const) {
        await page.getByTestId(`wish-${need}`).tap();
        await expect.poll(async () => (await savedMansion(page)).princesses[0].room).toBe(room);
        await expect.poll(async () => (await savedMansion(page)).princesses[0].activity?.kind).toBe('active');
        await unchangedFrame(page, baseline);
      }
      await page.getByTestId('floor-basement').tap();
      await page.getByTestId('wish-satiety').tap();
      await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-world', 'mansion');
      await unchangedFrame(page, baseline);
      expect(await page.getByRole('navigation', { name: copy.roomNavigation }).evaluate(element => getComputedStyle(element).direction)).toBe('ltr');
      await page.getByRole('button', { name: copy.shopping.bagTitle, exact: true }).tap();
      await page.getByRole('dialog').getByRole('button', { name: copy.shopping.wardrobeTitle, exact: true }).tap();
      await page.getByTestId('collection-rose-gala').getByRole('button', { name: copy.shopping.wear, exact: true }).tap();
      expect((await savedMansion(page)).princesses[0].outfit).toBe('rose-gala');
      await page.getByRole('button', { name: copy.shopping.bagTitle, exact: true }).tap();
      await page.getByRole('dialog').getByRole('button', { name: copy.shopping.toyboxTitle, exact: true }).tap();
      await page.getByTestId('collection-plush-dragon').getByRole('button', { name: copy.shopping.chooseToy, exact: true }).tap();
      expect((await savedMansion(page)).princesses[0].toy).toBe('plush-dragon');
      await page.getByTestId('floor-basement').tap();
      await page.getByTestId('station-cauldron-left').tap();
      await expect(page.getByTestId('ingredient-moonwater')).toHaveAttribute('data-next', 'true');
      await visiblePictureTargets(page);
      await unchangedFrame(page, baseline);
      await page.screenshot({ path: testInfo.outputPath(`${locale}-picture-potions.png`), animations: 'disabled' });
      await page.getByRole('button', { name: copy.pause, exact: true }).tap();
      await page.getByRole('button', { name: copy.newGame, exact: true }).tap();
      const confirm = page.getByRole('dialog', { name: copy.confirmTitle });
      await expect(confirm.getByRole('button', { name: copy.cancel, exact: true })).toBeFocused();
      await confirm.getByRole('button', { name: copy.cancel, exact: true }).tap();
      await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-adventure-id', state.adventureId);
      await unchangedFrame(page, baseline);
    });
  }
});

test('eight large portraits and keyboard potion help remain usable without resizing the renderer', async ({ page }, testInfo) => {
  const state = mansionThumbnailFixture();
  state.autonomyEnabled = false;
  await page.setViewportSize({ width: 1280, height: 800 });
  await seedMansion(page, state);
  await readyMansion(page);
  await page.bringToFront();
  const baseline = await canvasFrame(page);
  for (const princess of state.princesses) await expect(page.getByRole('button', { name: en.princessMansion.princesses[princess.id], exact: true }).locator('img').first()).toHaveAttribute('width', '64');
  await page.getByRole('button', { name: en.princessMansion.princesses.nova, exact: true }).click();
  await page.getByTestId('floor-basement').click();
  await page.getByTestId('station-cauldron-left').click();
  const help = page.getByTestId('help-lessons').getByRole('button');
  await help.focus();
  await page.keyboard.press('Space');
  await expect(help).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('mansion-game')).toHaveAttribute('data-moving', 'false');
  await page.keyboard.press('Space');
  await expect(help).toHaveAttribute('aria-expanded', 'false');
  await page.getByTestId('ingredient-moonwater').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('ingredient-stardust')).toHaveAttribute('data-next', 'true');
  await unchangedFrame(page, baseline);
  for (const need of NEED_IDS) await expect(page.getByTestId(`wish-${need}`).locator('img')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('eight-princess-picture-dashboard.png'), animations: 'disabled' });
});
