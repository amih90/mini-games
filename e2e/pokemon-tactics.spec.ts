import { expect, test, type Page } from '@playwright/test';
import { PerspectiveCamera, Vector3 } from 'three';
import { ARENA_FOV, ARENA_FOCUS_HEIGHT, arenaCameraPosition } from '../src/features/games/pokemon-tactics/camera';
import { createCampaign, generateEnemies, getActiveUnit, transition } from '../src/features/games/pokemon-tactics/engine';
import type { GameAction, GameState } from '../src/features/games/pokemon-tactics/types';
import { getText } from '../src/features/games/pokemon-tactics/localization';
import { speciesIds, victoryReward } from '../src/features/games/pokemon-tactics/data';
import { pokemonName } from '../src/features/games/pokemon-tactics/localization';

const key = 'mini-games:pokemon-tactics:v1';
function act(state: GameState, action: GameAction) {
  const result = transition(state, action);
  if (result.error) throw new Error(result.error);
  return result.state;
}
function battle() {
  let state = createCampaign('medium');
  for (const [i, species] of (['pikachu', 'charmander', 'bulbasaur'] as const).entries()) {
    state = act(state, { type: 'buyCreature', species });
    state = act(state, { type: 'deploy', unitId: state.roster[i].id, position: { x: 3, y: 2 + i } });
  }
  return act(state, { type: 'startBattle' });
}
function outcome(winner: 'player' | 'enemy', stage = 1) {
  let state = battle();
  if (stage !== 1) {
    state = act(state, { type: 'reset', difficulty: 'easy' });
    state.stage = stage;
    state = act(state, { type: 'buyCreature', species: 'pikachu' });
    state = act(state, { type: 'deploy', unitId: state.roster[0].id, position: { x: 3, y: 3 } });
    state = act(state, { type: 'startBattle' });
  }
  state.battleUnits.forEach(unit => { if (unit.owner !== winner) unit.hp = 0; });
  const active = state.battleUnits.find(unit => unit.owner === winner)!;
  state.activeId = active.id;
  state.initiative = [active.id, ...state.initiative.filter(id => id !== active.id)];
  return act(state, { type: 'defend' });
}
async function save(page: Page) {
  return page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)!) as GameState, key);
}
async function open(page: Page, state?: GameState | string, locale = 'en') {
  const serialized = typeof state === 'string' ? state : state ? JSON.stringify(state) : null;
  await page.addInitScript(({ key, serialized }) => {
    if (sessionStorage.getItem('tactics-fixture')) return;
    if (serialized !== null) localStorage.setItem(key, serialized);
    else localStorage.removeItem(key);
    sessionStorage.setItem('tactics-fixture', '1');
  }, { key, serialized });
  await page.goto(`/${locale}/games/pokemon-tactics`);
  await expect(page.locator('.pt-game')).toBeVisible();
  if (serialized === null) {
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.locator(`[aria-label="${getText(locale).tutorialBuy}"]`)).toBeVisible();
    await modal.getByRole('button', { name: getText(locale).close, exact: true }).click();
  }
}
async function selectCell(page: Page, col: number, row: number) {
  const [currentCol, currentRow] = (await page.locator('.pt-cursor-label').innerText()).match(/\d+/g)!.map(Number);
  await page.locator('.pt-board').focus();
  for (let i = 0; i < Math.abs(col + 1 - currentCol); i++) await page.keyboard.press(col + 1 > currentCol ? 'ArrowRight' : 'ArrowLeft');
  for (let i = 0; i < Math.abs(row + 1 - currentRow); i++) await page.keyboard.press(row + 1 > currentRow ? 'ArrowDown' : 'ArrowUp');
  await page.keyboard.press('Enter');
}
async function settings(page: Page, locale = 'en') {
  await page.getByRole('button', { name: getText(locale).settings, exact: true }).click();
}
async function newCampaign(page: Page) {
  await settings(page);
  await page.getByRole('button', { name: 'New campaign', exact: true }).click();
}
async function fastMode(page: Page) {
  await settings(page);
  await page.getByLabel('Fast animations', { exact: true }).check();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
}
test.use({ viewport: { width: 1280, height: 900 }, launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });
test.setTimeout(60_000);

test('perspective camera fits court and creature bounds without flattening depth', () => {
  for (const { width, height } of [{ width: 1280, height: 562 }, { width: 800, height: 362 }, { width: 390, height: 579 }, { width: 544, height: 198 }, { width: 264, height: 579 }]) {
    const camera = new PerspectiveCamera(ARENA_FOV, width / height, .1, 180);
    camera.position.set(...arenaCameraPosition(width / height));
    camera.lookAt(0, ARENA_FOCUS_HEIGHT, 0);
    camera.updateMatrixWorld();
    for (const x of [-9, 9]) {
      for (const z of [-6, 6]) {
        for (const y of [0, 2.4]) {
          const corner = new Vector3(x, y, z).project(camera);
          expect(Math.abs(corner.x)).toBeLessThanOrEqual(.861);
          expect(Math.abs(corner.y)).toBeLessThanOrEqual(.861);
        }
      }
    }
    const near = new Vector3(1.2, 0, 4.2).project(camera);
    const far = new Vector3(1.2, 0, -4.2).project(camera);
    expect(near.x).toBeGreaterThan(far.x);
  }
});

test('picture-led camp controls stay usable without text or clipped cost badges', async ({ page }) => {
  let state = createCampaign('easy');
  state = act(state, { type: 'buyCreature', species: 'pikachu' });
  const unit = state.roster[0];
  state = act(state, { type: 'deploy', unitId: unit.id, position: { x: 2, y: 3 } });
  state.roster[0].hp -= 20;
  await open(page, state);
  await page.getByRole('button', { name: /^Select Pikachu/ }).click();
  const train = page.getByRole('button', { name: /^Train/ });
  const rest = page.getByRole('button', { name: getText('en').rest, exact: true });
  const bench = page.getByRole('button', { name: getText('en').bench, exact: true });
  await expect(train).toHaveClass(/pt-train-button/);
  await expect(bench).toHaveClass(/pt-bench-button/);
  await expect(rest).toHaveText('0');
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 800, height: 450 }]) {
    await page.setViewportSize(viewport);
    for (const button of [train, rest, bench]) {
      await expect(button).toBeInViewport();
    }
    expect(await train.evaluate(button => {
      const bounds = button.getBoundingClientRect();
      return [...button.children].every(child => {
        const rect = child.getBoundingClientRect();
        return rect.top >= bounds.top && rect.bottom <= bounds.bottom && rect.left >= bounds.left && rect.right <= bounds.right;
      });
    })).toBe(true);
  }
  await rest.click();
  expect((await save(page)).roster[0].hp).toBe(unit.maxHp);
  expect((await save(page)).gold).toBe(state.gold);
  await train.click();
  expect((await save(page)).roster[0].level).toBe(2);
  await bench.click();
  expect((await save(page)).deployment[unit.id]).toBeUndefined();
});

test('recruitment pages expose every base Pokémon and preserve selection and formation', async ({ page }) => {
  test.setTimeout(120_000);
  await open(page);
  await page.getByRole('button', { name: /^Recruit Pikachu/ }).click();
  await selectCell(page, 3, 2);
  const before = await save(page);
  const seen: string[] = [];
  const text = getText('en');
  await expect(page.getByRole('button', { name: text.previousPage, exact: true })).toBeDisabled();
  for (let index = 0; index < 10; index++) {
    await expect(page.getByRole('status', { name: text.shopPage, exact: true })).toHaveText(`${index + 1}/10`);
    await expect.poll(() => page.locator('.pt-stock button img').evaluateAll(images =>
      images.length > 0 && images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
    seen.push(...await page.locator('.pt-stock button img').evaluateAll(images => images.map(image => image.getAttribute('alt')!)));
    expect(await save(page)).toEqual(before);
    await expect(page.locator('.pt-roster-card[aria-pressed=true]')).toHaveCount(1);
    if (index < 9) await page.getByRole('button', { name: text.nextPage, exact: true }).click();
  }
  expect(seen).toEqual(speciesIds.map(id => pokemonName(id, 'en')));
  await expect(page.getByRole('button', { name: text.nextPage, exact: true })).toBeDisabled();
  const last = speciesIds.at(-1)!;
  await page.locator('.pt-stock button').last().click();
  expect((await save(page)).roster.at(-1)!.species).toBe(last);
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole('button', { name: text.previousPage, exact: true })).toBeInViewport();
    await expect(page.getByRole('button', { name: text.nextPage, exact: true })).toBeInViewport();
    await expect(page.locator('.pt-stock button').last()).toBeInViewport();
    await expect(page.locator('.pt-supplies')).toBeInViewport();
  }
  await page.getByRole('button', { name: text.previousPage, exact: true }).click();
  await expect(page.getByRole('status', { name: text.shopPage, exact: true })).toHaveText('9/10');
});

test('pause menu can start a confirmed new campaign without a separate field control', async ({ page }) => {
  const state = battle();
  await open(page, state);
  await expect(page.getByRole('button', { name: getText('en').fieldControls, exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = page.getByRole('dialog', { name: 'Paused', exact: true });
  await paused.getByRole('button', { name: 'New campaign', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(paused).toBeVisible();
  expect(await save(page)).toEqual(state);
  await paused.getByRole('button', { name: 'New campaign', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Difficulty', { exact: true }).selectOption('hard');
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await save(page)).phase).toBe('camp');
  expect((await save(page)).difficulty).toBe('hard');
  expect((await save(page)).roster).toEqual([]);
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
});

test('placing an uncached Pokémon keeps the battlefield and placement visible while its texture loads', async ({ page }) => {
  await open(page);
  await expect(page.getByText('Preparing your arena…', { exact: true })).toBeHidden({ timeout: 45_000 });
  await page.getByRole('button', { name: /^Recruit Pikachu/ }).click();
  await expect(page.locator('.pt-roster-card img')).toHaveJSProperty('complete', true);
  let releaseTexture!: () => void;
  const textureGate = new Promise<void>(resolve => { releaseTexture = resolve; });
  let textureRequested = false;
  await page.route('**/games/pokemon-tactics/pokemon/pikachu.png', async route => {
    textureRequested = true;
    await textureGate;
    await route.continue();
  });
  try {
    await selectCell(page, 3, 2);
    await expect.poll(() => textureRequested).toBe(true);
    await expect(page.locator('.pt-unit-label[data-unit-id="player-1"]')).toBeVisible();
    await expect(page.getByText('Preparing your arena…', { exact: true })).toHaveCount(0);
    expect((await save(page)).deployment['player-1']).toEqual({ x: 3, y: 2 });
    await selectCell(page, 2, 4);
    expect((await save(page)).deployment['player-1']).toEqual({ x: 2, y: 4 });
    await expect(page.locator('.pt-unit-label[data-unit-id="player-1"]')).toBeVisible();
    await expect(page.getByText('Preparing your arena…', { exact: true })).toHaveCount(0);
  } finally {
    releaseTexture();
  }
  await expect(page.locator('.pt-unit-label[data-unit-id="player-1"]')).toBeVisible();
  expect((await save(page)).deployment['player-1']).toEqual({ x: 2, y: 4 });
});

test('recruit, place through the actual canvas, keyboard cursor, save and resume', async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page);
  await expect(page.getByRole('button', { name: 'Start battle', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: /^Recruit Pikachu/ }).click();
  await expect(page.locator('.pt-unit-label')).toHaveCount(0);
  await expect(page.getByText('Preparing your arena…', { exact: true })).toBeHidden({ timeout: 20_000 });
  const canvas = page.locator('canvas');
  await expect.poll(async () => (await canvas.boundingBox())?.height ?? 0).toBeGreaterThan(500);
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Arena canvas has no layout');
  const camera = new PerspectiveCamera(ARENA_FOV, box.width / box.height, .1, 180);
  camera.position.set(...arenaCameraPosition(box.width / box.height));
  camera.lookAt(0, ARENA_FOCUS_HEIGHT, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  const point = new Vector3((3 - 5.5) * 1.2, .07, (2 - 3.5) * 1.2).project(camera);
  await canvas.click({ position: { x: (point.x + 1) * box.width / 2, y: (1 - point.y) * box.height / 2 } });
  await expect.poll(async () => (await save(page)).deployment['player-1']).toEqual({ x: 3, y: 2 });
  await page.locator('.pt-board').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('s');
  await expect(page.locator('.pt-cursor-label')).toContainText('Cell 5, 4');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start battle', exact: true })).toBeEnabled();
  expect((await save(page)).gold).toBe(340);
  await expect(page.locator('.pt-unit-label')).toHaveCount(1, { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('manual movement, damage confirmation, resources, AI progression and pause', async ({ page }) => {
  test.setTimeout(90_000);
  await open(page, battle());
  await expect(page.getByRole('progressbar', { name: 'Pikachu · Energy', exact: true })).toBeVisible({ timeout: 45_000 });
  await page.evaluate(() => {
    const events: { type: string; label: string; width: number; duration: string }[] = [];
    (window as Window & { tacticsBarEvents?: typeof events }).tacticsBarEvents = events;
    for (const type of ['transitionrun', 'transitionend']) {
      document.addEventListener(type, event => {
        const fill = event.target;
        if (!(fill instanceof HTMLElement) || !fill.matches('.pt-unit-label .pt-resource-bars i')) return;
        events.push({ type, label: fill.parentElement!.getAttribute('aria-label')!, width: fill.getBoundingClientRect().width, duration: getComputedStyle(fill).transitionDuration });
      }, true);
    }
  });
  await fastMode(page);
  await selectCell(page, 7, 2);
  await page.getByRole('button', { name: 'Move here', exact: true }).click();
  await page.getByRole('button', { name: /^Thunder Shock ·/ }).click();
  await selectCell(page, 10, 2);
  const before = await save(page);
  const preview = Number((await page.locator('.pt-preview').innerText()).match(/Damage preview: (\d+)/)![1]);
  await page.getByRole('button', { name: 'Confirm · Use move', exact: true }).click();
  await expect.poll(async () => (await save(page)).battleUnits.find(u => u.id === 'enemy-1-1')!.hp).toBe(55 - preview);
  await expect.poll(async () => getActiveUnit(await save(page))?.species).toBe('charmander');
  const after = await save(page);
  const pikachuEnergy = page.getByRole('progressbar', { name: 'Pikachu · Energy', exact: true });
  await expect(pikachuEnergy).toHaveAttribute('aria-valuenow', String(after.battleUnits.find(u => u.id === 'player-1')!.energy));
  await expect.poll(async () => page.evaluate(() => {
    const events = (window as Window & { tacticsBarEvents?: { type: string; label: string; width: number; duration: string }[] }).tacticsBarEvents ?? [];
    return ['Pikachu · Energy', 'Pikachu · Health'].every(label => {
      const start = events.find(e => e.label === label && e.type === 'transitionrun');
      const end = events.find(e => e.label === label && e.type === 'transitionend');
      return !!start && !!end && start.width > end.width && parseFloat(start.duration) > 0;
    });
  })).toBe(true);
  expect(after.battleUnits.find(u => u.id === 'player-1')!.energy).toBe(before.battleUnits[0].energy - 9);
  expect(after.battleUnits.find(u => u.id === 'player-1')!.hp).toBeLessThan(before.battleUnits[0].hp);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Paused', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Paused', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Defend', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Paused', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
});

test('attack impact commits HP and energy together, with flight suspended by pause', async ({ page }) => {
  const state = battle();
  state.battleUnits.find(u => u.id === 'player-1')!.position = { x: 7, y: 2 };
  await open(page, state);
  await expect(page.locator('.pt-unit-label')).toHaveCount(state.battleUnits.length, { timeout: 45_000 });
  await selectCell(page, 10, 2);
  const before = await save(page);
  await page.evaluate(() => {
    const confirm = document.querySelector<HTMLButtonElement>('.pt-actions .pt-primary')!;
    confirm.click();
  });
  await expect(page.locator('.pt-game')).toHaveAttribute('data-flight-progress', /.+/);
  expect(await save(page)).toEqual(before);
  await page.evaluate(() => document.querySelector<HTMLButtonElement>('.pt-hud button[title="Pause"]')!.click());
  const frozen = await page.locator('.pt-game').getAttribute('data-flight-progress');
  await page.waitForTimeout(650);
  expect(await save(page)).toEqual(before);
  expect(await page.locator('.pt-game').getAttribute('data-flight-progress')).toBe(frozen);
  await page.getByRole('button', { name: 'Resume', exact: true }).last().click();
  await expect(page.locator('.pt-game')).not.toHaveAttribute('data-flight-progress');
  const after = await save(page);
  expect(after.battleUnits.find(u => u.id === 'enemy-1-1')!.hp).toBeLessThan(before.battleUnits.find(u => u.id === 'enemy-1-1')!.hp);
  expect(after.battleUnits.find(u => u.id === 'player-1')!.energy).toBe(before.battleUnits.find(u => u.id === 'player-1')!.energy - 9);
});

test('evolve between rounds with a picture preview, preserve formation and resume the evolved team', async ({ page }) => {
  await open(page, outcome('player'));
  await page.getByRole('button', { name: 'Next encounter', exact: true }).click();
  await page.getByRole('button', { name: 'Select Charmander Level 1', exact: true }).click();
  const before = await save(page);
  await page.getByRole('button', { name: 'Evolve Charmander → Charmeleon · 200 Gold', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Evolve · Charmander', exact: true });
  await expect(preview.getByRole('img', { name: 'Charmeleon', exact: true })).toBeVisible();
  await preview.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await save(page)).toEqual(before);
  await page.getByRole('button', { name: 'Evolve Charmander → Charmeleon · 200 Gold', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm evolution', exact: true }).click();
  const evolved = await save(page);
  expect(evolved.gold).toBe(before.gold - 200);
  expect(evolved.roster.find(u => u.id === 'player-2')!.species).toBe('charmeleon');
  expect(evolved.deployment).toEqual(before.deployment);
  await expect(page.getByRole('button', { name: 'Select Charmeleon Level 1', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Select Charmeleon Level 1', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start battle', exact: true }).click();
  await expect.poll(async () => (await save(page)).battleUnits.some(u => u.species === 'charmeleon')).toBe(true);
  await expect(page.getByRole('progressbar', { name: 'Charmeleon · Energy', exact: true })).toHaveAttribute('aria-valuemax', '32', { timeout: 45_000 });
  const active = getActiveUnit(await save(page))!;
  await expect(page.locator('.pt-unit-mini').getByRole('progressbar', { name: 'Energy', exact: true })).toHaveAttribute('aria-valuenow', String(active.energy));
});

test('zero-gold Easy team can rest after defeat and return to battle without losing its formation', async ({ page }) => {
  const state = outcome('enemy');
  state.difficulty = 'easy';
  state.gold = 0;
  await open(page, state);
  await page.getByRole('button', { name: 'Return to camp', exact: true }).click();
  const camp = await save(page);
  await page.getByRole('button', { name: 'Rest team · Free healing and revival', exact: true }).click();
  const rested = await save(page);
  expect(rested.gold).toBe(0);
  expect(rested.roster.every(u => u.hp === u.maxHp && u.energy === u.maxEnergy)).toBe(true);
  expect(rested.deployment).toEqual(camp.deployment);
  await page.reload();
  await page.getByRole('button', { name: 'Start battle', exact: true }).click();
  await expect.poll(async () => (await save(page)).phase).toBe('battle');
});

test('Auto plays player turns, pauses with dialogs, supports takeover and stops after the encounter', async ({ page }) => {
  test.setTimeout(120_000);
  const state = battle();
  await open(page, state);
  await fastMode(page);
  const auto = page.getByRole('button', { name: 'Auto fight', exact: true });
  await expect(auto).toHaveAttribute('aria-pressed', 'false');
  await auto.click();
  await expect(auto).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Defend', exact: true })).toBeDisabled();
  await expect.poll(async () => JSON.stringify((await save(page)).battleUnits)).not.toBe(JSON.stringify(state.battleUnits));
  await settings(page);
  const suspended = await save(page);
  await page.waitForTimeout(800);
  expect(await save(page)).toEqual(suspended);
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await auto.click();
  await expect(auto).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => getActiveUnit(await save(page))?.owner).toBe('player');
  await page.waitForTimeout(350);
  const manual = await save(page);
  await page.waitForTimeout(800);
  expect(await save(page)).toEqual(manual);
  await auto.click();
  await expect.poll(async () => (await save(page)).phase, { timeout: 60_000 }).not.toBe('battle');
  await expect(auto).toHaveCount(0);
  const ended = await save(page);
  await page.waitForTimeout(800);
  expect(await save(page)).toEqual(ended);
  expect(ended.potions).toEqual(state.potions);
  if (ended.phase === 'victory') {
    await page.getByRole('button', { name: 'Next encounter', exact: true }).click();
    await page.getByRole('button', { name: 'Start battle', exact: true }).click();
    await expect(auto).toHaveAttribute('aria-pressed', 'false');
  }
  await page.reload();
  if ((await save(page)).phase === 'battle') await expect(auto).toHaveAttribute('aria-pressed', 'false');
});

test('selected overlapping Pokémon and its bars take visual priority over the other units', async ({ page }) => {
  const state = battle();
  state.battleUnits.find(u => u.id === 'player-1')!.position = { x: 3, y: 2 };
  state.battleUnits.find(u => u.id === 'player-2')!.position = { x: 3, y: 3 };
  await open(page, state);
  await expect(page.locator('.pt-unit-label')).toHaveCount(state.battleUnits.length, { timeout: 45_000 });
  await selectCell(page, 3, 3);
  const selected = page.locator('.pt-unit-label[data-unit-id="player-2"]');
  await expect(selected).toHaveAttribute('data-selected', 'true');
  const zIndex = (label: HTMLElement) => {
    let node: HTMLElement | null = label;
    while (node && node.style.zIndex === '') node = node.parentElement;
    return node ? Number(getComputedStyle(node).zIndex) : 0;
  };
  expect(await selected.evaluate(zIndex)).toBe(7);
  for (const label of await page.locator('.pt-unit-label:not([data-selected="true"])').all()) {
    expect(await label.evaluate(zIndex)).toBeLessThan(7);
  }
  await expect(page.locator('.pt-preview').getByRole('progressbar', { name: 'Target · Energy', exact: true })).toHaveAttribute('aria-valuenow', '12');
  expect((await save(page)).battleUnits.map(u => u.position)).toEqual(state.battleUnits.map(u => u.position));
  await page.locator('.pt-game').screenshot({ path: '.playwright-mcp/tactics-selected-priority.png' });
});

test('HP and blue energy bars touch without padding and knocked-out bars fade', async ({ page }) => {
  const state = battle();
  const fainted = state.battleUnits.find(u => u.species === 'bulbasaur')!;
  fainted.hp = 0;
  state.roster = state.roster.map(unit => unit.id === fainted.id ? { ...fainted, position: null } : unit);
  state.initiative = state.initiative.filter(id => id !== fainted.id);
  await open(page, state);
  const deadEnergy = page.locator('.pt-resource-bars.knocked-out').getByRole('progressbar', { name: 'Bulbasaur · Energy', exact: true });
  await expect(deadEnergy).toBeVisible({ timeout: 25_000 });
  for (const bars of await page.locator('.pt-resource-bars').all()) {
    const measurements = await bars.evaluate(el => {
      const hp = el.querySelector('.pt-health-bar')!.getBoundingClientRect();
      const energy = el.querySelector('.pt-energy-bar')!.getBoundingClientRect();
      const style = getComputedStyle(el);
      return { gap: energy.top - hp.bottom, padding: style.padding, opacity: style.opacity, knockedOut: el.classList.contains('knocked-out') };
    });
    expect(measurements.gap).toBe(0);
    expect(measurements.padding).toBe('0px');
    expect(Number(measurements.opacity)).toBe(measurements.knockedOut ? .45 : 1);
  }
  expect(await deadEnergy.locator('i').evaluate(el => getComputedStyle(el).backgroundImage)).toContain('51, 127, 203');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await deadEnergy.locator('i').evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
});

test('all defeat routes preserve losses, checkpoint rollback and replay difficulty', async ({ page }) => {
  const lost = outcome('enemy');
  await open(page, lost);
  await expect(page.getByRole('dialog').getByRole('button', { name: 'New campaign', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Return to camp', exact: true }).click();
  expect((await save(page)).roster.every(u => u.hp === 0)).toBe(true);
  await page.getByRole('button', { name: 'Retry checkpoint', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect.poll(async () => (await save(page)).phase).toBe('battle');
  expect((await save(page)).roster.every(u => u.hp > 0)).toBe(true);
  await newCampaign(page);
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Difficulty', { exact: true }).selectOption('hard');
  await dialog.getByRole('button', { name: 'Confirm', exact: true }).click();
  expect((await save(page)).difficulty).toBe('hard');
  expect((await save(page)).roster).toEqual([]);
});

test('victory advances once and the final boss ends the campaign', async ({ page }) => {
  const won = outcome('player');
  await open(page, won);
  await expect(page.getByLabel('Gold earned', { exact: true })).toContainText(`+${victoryReward(won.stage, won.difficulty)}`);
  await expect(page.getByRole('list', { name: 'Next rivals', exact: true }).getByRole('img')).toHaveCount(generateEnemies(2, won.difficulty).length);
  expect(await page.locator('.pt-next-rivals img').evaluateAll(images => images.map(image => image.getAttribute('alt')))).toEqual(generateEnemies(2, won.difficulty).map(unit => pokemonName(unit.species, 'en')));
  await expect(page.locator('.pt-next-goal')).toContainText(getText('en').victoryGoal);
  await expect(page.getByRole('dialog').getByRole('button', { name: 'New campaign', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Next encounter', exact: true }).click();
  expect((await save(page)).stage).toBe(2);
  expect((await save(page)).rewardedStages).toEqual([1]);
  expect((await save(page)).gold).toBe(won.gold);
  const final = outcome('player', 10);
  await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key, state: final });
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Campaign complete!', exact: true })).toBeVisible();
  await expect(page.getByLabel('Gold earned', { exact: true })).toContainText(`+${victoryReward(10, final.difficulty)}`);
  await expect(page.locator('.pt-next-rivals')).toHaveCount(0);
  await expect(page.locator('.pt-next-goal')).toContainText(getText('en').completedGoal);
  await expect(page.getByRole('button', { name: 'Next encounter', exact: true })).toHaveCount(0);
  await expect(page.getByRole('dialog').getByRole('button', { name: 'New campaign', exact: true })).toHaveCount(0);
});

for (const locale of ['en', 'he', 'zh', 'es']) {
  test(`victory previews the final boss and goal in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const won = outcome('player', 9);
    const text = getText(locale);
    await open(page, won, locale);
    const dialog = page.getByRole('dialog', { name: text.victory, exact: true });
    await expect(dialog.getByLabel(text.earnedGold, { exact: true })).toContainText('+500');
    await expect(dialog.locator('.pt-next-goal')).toContainText(text.bossGoal);
    await expect(dialog.getByRole('heading', { level: 3 })).toContainText('10/10');
    const rivals = generateEnemies(10, won.difficulty);
    expect(await dialog.locator('.pt-next-rivals img').evaluateAll(images => images.map(image => image.getAttribute('alt')))).toEqual(rivals.map(unit => pokemonName(unit.species, locale)));
    await expect(dialog.locator('.pt-next-rivals li')).toHaveCount(6);
    await expect(dialog.getByRole('button', { name: text.next, exact: true })).toBeInViewport();
    await page.setViewportSize({ width: 844, height: 390 });
    await dialog.getByRole('button', { name: text.next, exact: true }).scrollIntoViewIfNeeded();
    await expect(dialog.getByRole('button', { name: text.next, exact: true })).toBeInViewport();
    expect(await save(page)).toEqual(won);
  });
}

test('corrupt saves are retained until reset; storage failures are explicit', async ({ page }) => {
  await open(page, 'not-json');
  await expect(page.getByRole('alert').filter({ hasText: 'Saved progress could not be read' })).toBeVisible();
  await page.getByRole('button', { name: /^Recruit Pikachu/ }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe('not-json');
  await newCampaign(page);
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  expect((await save(page)).roster).toEqual([]);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  await page.getByRole('button', { name: /^Recruit Pikachu/ }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Progress could not be saved' })).toBeVisible();
  await page.getByRole('alert').filter({ hasText: 'Progress could not be saved' }).getByRole('button', { name: 'Close', exact: true }).click();
  await settings(page);
  await expect(page.locator('.pt-notice')).not.toContainText('Progress saved on this device');
});

test('unavailable WebGL is reported and keyboard formation controls still work', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
        return type === 'webgl2' ? null : Reflect.apply(original, this, [type, ...args]);
      },
    });
  });
  await open(page);
  await expect(page.getByRole('alert').filter({ hasText: 'The arena could not load' })).toBeVisible();
  await page.getByRole('button', { name: /^Recruit Pikachu/ }).click();
  await selectCell(page, 3, 2);
  await page.getByRole('button', { name: 'Start battle', exact: true }).click();
  expect((await save(page)).phase).toBe('battle');
});

test('three themes, all locales, RTL, mobile touch and instructions', async ({ browser }) => {
  test.setTimeout(120_000);
  for (const locale of ['en', 'he', 'zh', 'es']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await open(page, undefined, locale);
    await expect(page.locator('.pt-game')).toHaveAttribute('dir', locale === 'he' ? 'rtl' : 'ltr');
    for (const theme of ['classic', 'moonwell', 'obsidian']) {
      await settings(page, locale);
      await page.locator('.pt-toolbar select').first().selectOption(theme);
      await expect(page.locator('.pt-game')).toHaveClass(new RegExp(`pt-theme-${theme}`));
      await page.getByRole('dialog').getByRole('button', { name: getText(locale).close, exact: true }).click();
    }
    await page.locator('.pt-stock button').first().tap();
    expect((await save(page)).roster[0].species).toBe('charmander');
    await expect(page.getByText(getText(locale).loading, { exact: true })).toBeHidden({ timeout: 45_000 });
    const canvas = page.locator('canvas');
    await expect.poll(async () => {
      const box = await canvas.boundingBox();
      const board = await page.locator('.pt-board').boundingBox();
      return !!box && !!board && Math.abs(box.width - board.width) < 1 && Math.abs(box.height - board.height) < 1;
    }).toBe(true);
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Arena canvas has no layout');
    const camera = new PerspectiveCamera(ARENA_FOV, box.width / box.height, .1, 180);
    camera.position.set(...arenaCameraPosition(box.width / box.height));
    camera.lookAt(0, ARENA_FOCUS_HEIGHT, 0);
    camera.updateMatrixWorld();
    const point = new Vector3((3 - 5.5) * 1.2, .07, (2 - 3.5) * 1.2).project(camera);
    await canvas.tap({ position: { x: (point.x + 1) * box.width / 2, y: (1 - point.y) * box.height / 2 } });
    expect((await save(page)).deployment['player-1']).toEqual({ x: 3, y: 2 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await context.close();
  }
});

test('camp and battle fit the viewport and the command dock never covers the court', async ({ page }) => {
  test.setTimeout(120_000);
  await open(page);
  for (const size of [{ width: 800, height: 600 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    for (const phase of ['camp', 'battle']) {
      const state = phase === 'camp' ? act(createCampaign('easy'), { type: 'buyCreature', species: 'charmander' }) : battle();
      await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key, state });
      await page.reload();
      await expect(page.locator('.pt-dock')).toBeVisible();
      if (phase === 'camp') {
        const rosterCard = page.getByRole('button', { name: 'Select Charmander Level 1', exact: true });
        await rosterCard.focus();
        await rosterCard.press('Enter');
      }
      const bounds = await page.locator('.pt-game').evaluate(el => {
        const board = el.querySelector('.pt-board')!.getBoundingClientRect();
        const dock = el.querySelector('.pt-dock')!.getBoundingClientRect();
        const root = el.getBoundingClientRect();
        return { boardBottom: board.bottom, dockTop: dock.top, rootBottom: root.bottom, dockBottom: dock.bottom, overflow: el.scrollHeight > el.clientHeight };
      });
      expect(bounds.boardBottom).toBeLessThanOrEqual(bounds.dockTop + 1);
      expect(bounds.dockBottom).toBeLessThanOrEqual(size.height + 1);
      expect(bounds.rootBottom).toBeLessThanOrEqual(size.height + 1);
      expect(bounds.overflow).toBe(false);
      if (phase === 'camp') {
        expect(await page.locator('.pt-shop').evaluate(el => el.scrollHeight > el.clientHeight + 1), `Shop overflow at ${size.width}×${size.height}`).toBe(false);
        for (const supply of await page.locator('.pt-shop button').all()) {
          const rect = await supply.boundingBox();
          expect(rect!.y + rect!.height).toBeLessThanOrEqual(bounds.dockTop + 1);
        }
      }
      const buttons = await page.locator('.pt-dock button').evaluateAll(nodes => nodes.map(node => {
        const rect = node.getBoundingClientRect();
        return { right: rect.right, left: rect.left, bottom: rect.bottom, height: rect.height };
      }));
      for (const rect of buttons) {
        expect(rect.right).toBeLessThanOrEqual(size.width + 1);
        expect(rect.left).toBeGreaterThanOrEqual(-1);
        expect(rect.bottom).toBeLessThanOrEqual(size.height + 1);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      }
    }
  }
});

test('local chiptune starts after a gesture and pauses with mute and dialogs', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.Audio = class extends NativeAudio {
      constructor(src?: string) { super(src); Reflect.set(window, '__tacticsMusic', this); }
    };
    localStorage.setItem('mini-games-sound-muted', 'false');
  });
  await open(page, createCampaign('easy'));
  const musicState = () => page.evaluate(() => {
    const audio = Reflect.get(window, '__tacticsMusic') as HTMLAudioElement;
    return { paused: audio.paused, volume: audio.volume, loop: audio.loop, src: audio.src };
  });
  expect((await musicState()).paused).toBe(true);
  await page.getByRole('button', { name: /^Recruit Pikachu/ }).click();
  await expect.poll(async () => (await musicState()).paused).toBe(false);
  expect(await musicState()).toMatchObject({ volume: .14, loop: true });
  expect((await musicState()).src).toContain('/games/pokemon-tactics/music/jump.mp3');
  await page.getByRole('button', { name: 'Sound On', exact: true }).click();
  await expect.poll(async () => (await musicState()).paused).toBe(true);
  await page.getByRole('button', { name: 'Sound Off', exact: true }).click();
  await expect.poll(async () => (await musicState()).paused).toBe(false);
  await settings(page);
  await expect.poll(async () => (await musicState()).paused).toBe(true);
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await expect.poll(async () => (await musicState()).paused).toBe(false);
  const asset = await page.request.get('/games/pokemon-tactics/music/jump.mp3');
  expect(asset.ok()).toBe(true);
});
