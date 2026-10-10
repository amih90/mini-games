import { expect, test, type Frame, type Page } from '@playwright/test';

interface SavedTower {
  type: string;
  x: number;
  y: number;
  skills: { power: number; range: number; special: number };
  evolutionStage: number;
  spentCoins: number;
  eeveeEvolution?: string | null;
  durability?: number;
}
interface Checkpoint {
  version: number;
  coins: number;
  lives: number;
  wave: number;
  power: number;
  bossesDefeated: number;
  finalEvolutionUnlocked: boolean;
  selectedTower: string;
  nextEnemyFamilyId: string;
  towers: SavedTower[];
  difficulty?: string;
  mapId?: string;
  camera?: { x: number; y: number; zoom: number };
  nextBossId?: string;
  nextWavePlan?: string[];
  familyQueue?: string[];
  bossHistory?: string[];
}
interface TestWindow extends Window {
  advancePokemon?: (seconds: number) => void;
  pokemonClockInitPath?: string;
  soundContext?: AudioContext;
  audioContextCount?: number;
  soundPlayCount?: number;
}

const RUN_KEY = 'mini-games:pokemon-tower-defense:run';
const PROFILE_KEY = 'mini-games:pokemon-tower-defense:profile';
const SOUND_KEY = 'mini-games-sound-muted';
const errors = new WeakMap<Page, string[]>();
const eeveeTower: SavedTower = {
  type: 'eevee', x: 120, y: 360, skills: { power: 1, range: 1, special: 1 },
  evolutionStage: 0, spentCoins: 240,
};

function checkpoint(overrides: Partial<Checkpoint> = {}): Checkpoint {
  return {
    version: 1, coins: 4000, lives: 10, wave: 5, power: 0,
    bossesDefeated: 1, finalEvolutionUnlocked: true, selectedTower: 'eevee',
    nextEnemyFamilyId: 'pidgey', towers: [eeveeTower],
    ...overrides,
  };
}

async function ready(page: Page, saved: Checkpoint | null = null, locale = 'en') {
  await page.addInitScript(({ saved, runKey, profileKey }) => {
    const testWindow: TestWindow = window;
    testWindow.pokemonClockInitPath = window.location.pathname;
    const gamePath = '/games/pokemon-tower-defense/index.html';
    // Newly attached iframes can still have an about:blank location.
    if (!window.location.pathname.includes(gamePath) &&
        !window.frameElement?.getAttribute('src')?.includes(gamePath)) return;
    if (!sessionStorage.getItem('pokemon-test-seeded')) {
      localStorage.setItem(profileKey, JSON.stringify({
        version: 1, bestWave: 0, bossStars: 0, discoveries: [], soundEnabled: false,
        gameSpeed: 1, tutorialComplete: true,
      }));
      if (saved) localStorage.setItem(runKey, JSON.stringify(saved));
      else localStorage.removeItem(runKey);
      sessionStorage.setItem('pokemon-test-seeded', 'true');
    }
    let callback: FrameRequestCallback | null = null;
    let frameId = 0;
    let time = performance.now();
    window.requestAnimationFrame = (next) => {
      callback = next;
      return ++frameId;
    };
    testWindow.advancePokemon = (seconds) => {
      time = Math.max(time, performance.now());
      for (let step = 0; step < Math.ceil(seconds * 60); step++) {
        time += 1000 / 60;
        const next = callback;
        callback = null;
        if (next) next(time);
      }
    };
  }, { saved, runKey: RUN_KEY, profileKey: PROFILE_KEY });
  await page.goto(`/games/pokemon-tower-defense/index.html?locale=${locale}`);
  await expect(page.locator('#startButton')).toBeVisible();
}

async function expectedShopIds(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const ids = (window as unknown as { PokemonTDData?: { SHOP_TOWER_IDS?: string[] } }).PokemonTDData?.SHOP_TOWER_IDS;
    if (!ids) throw new Error('Base-form shop roster was not initialized.');
    return ids;
  });
}

async function advance(page: Page | Frame, seconds: number) {
  await page.evaluate(seconds => {
    const testWindow: TestWindow = window;
    if (!testWindow.advancePokemon) {
      throw new Error(`Pokémon test clock is not initialized at ${window.location.pathname}; init path: ${testWindow.pokemonClockInitPath ?? 'script did not run'}.`);
    }
    testWindow.advancePokemon(seconds);
  }, seconds);
}

async function savedRun(page: Page): Promise<Checkpoint> {
  return page.evaluate(key => {
    const saved = localStorage.getItem(key);
    if (!saved) throw new Error('Expected a saved Pokémon checkpoint.');
    return JSON.parse(saved);
  }, RUN_KEY);
}

async function worldPoint(page: Page, x: number, y: number) {
  const canvas = page.locator('#gameCanvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Pokémon canvas is not visible.');
  const camera = await canvas.evaluate(element => ({
    x: Number(element.getAttribute('data-camera-x')), y: Number(element.getAttribute('data-camera-y')),
    zoom: Number(element.getAttribute('data-zoom')),
    width: Number(element.getAttribute('data-world-width')), height: Number(element.getAttribute('data-world-height')),
  }));
  return {
    x: box.x + (x - camera.x) * camera.zoom / camera.width * box.width,
    y: box.y + (y - camera.y) * camera.zoom / camera.height * box.height,
  };
}

async function clickWorld(page: Page, x: number, y: number, touch = false) {
  const point = await worldPoint(page, x, y);
  if (touch) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}

async function trackSoundContexts(page: Page) {
  await page.addInitScript(() => {
    const owner: TestWindow = window;
    const OriginalContext = window.AudioContext;
    owner.audioContextCount = 0;
    owner.soundPlayCount = 0;
    window.AudioContext = class extends OriginalContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        owner.audioContextCount = (owner.audioContextCount || 0) + 1;
        owner.soundContext = this;
      }
      override createOscillator() {
        owner.soundPlayCount = (owner.soundPlayCount || 0) + 1;
        return super.createOscillator();
      }
    };
  });
}

async function soundPlayCount(page: Page) {
  return page.evaluate(() => {
    const owner: TestWindow = window;
    if (owner.soundPlayCount === undefined) throw new Error('Shared sound tracker did not initialize.');
    return owner.soundPlayCount;
  });
}

test.use({ hasTouch: true });
test.beforeEach(async ({ page }) => {
  const pageErrors: string[] = [];
  errors.set(page, pageErrors);
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('https://raw.githubusercontent.com/**', route => route.fulfill({
    status: 200, contentType: 'image/svg+xml',
    headers: { 'access-control-allow-origin': '*' },
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="25" fill="#ffd84d"/></svg>',
  }));
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

test('shop offers base forms across generations, retains solo defenders, and filters evolved forms', async ({ page }) => {
  await ready(page);
  await page.locator('#startButton').click();
  await page.locator('#openShopButton').click();
  const shopIds = await expectedShopIds(page);
  expect(shopIds).toHaveLength(137);
  await expect(page.locator('.shop-tower-card')).toHaveCount(shopIds.length);
  await expect(page.locator('.buy-pokemon-button small')).toContainText(String(shopIds.length));
  await expect(page.locator('.shop-hint')).toContainText(String(shopIds.length));
  const expansion = await page.evaluate(() => {
    const data = (window as unknown as { PokemonTDData?: {
      EXPANSION_BASE_IDS?: string[];
      ADDITIONAL_TOWERS?: Record<string, { evolutions: { image: string }[] }>;
    } }).PokemonTDData;
    if (!data?.EXPANSION_BASE_IDS || !data.ADDITIONAL_TOWERS) {
      throw new Error('The 50-species expansion manifest was not initialized.');
    }
    return {
      bases: data.EXPANSION_BASE_IDS,
      evolved: [...new Set(data.EXPANSION_BASE_IDS.flatMap(id =>
        data.ADDITIONAL_TOWERS![id].evolutions.map(form => form.image.replace(/Animated$/, '')),
      ))],
    };
  });
  expect(expansion.bases).toHaveLength(50);
  for (const id of expansion.bases) await expect(page.locator(`[data-tower="${id}"]`)).toBeAttached();
  for (const id of expansion.evolved) await expect(page.locator(`[data-tower="${id}"]`)).toHaveCount(0);
  for (const id of ['mew', 'mewtwo', 'lugia', 'zapdos', 'moltres', 'arceus']) {
    await expect(page.locator(`[data-tower="${id}"]`)).toBeAttached();
  }
  const starters = [
    'bulbasaur', 'charmander', 'squirtle', 'chikorita', 'cyndaquil', 'totodile',
    'treecko', 'torchic', 'mudkip', 'turtwig', 'chimchar', 'piplup', 'snivy', 'tepig',
    'oshawott', 'chespin', 'fennekin', 'froakie', 'rowlet', 'litten', 'popplio',
    'grookey', 'scorbunny', 'sobble', 'sprigatito', 'fuecoco', 'quaxly',
  ];
  for (const id of starters) await expect(page.locator(`[data-tower="${id}"]`)).toBeAttached();
  for (const id of [
    'dragonite', 'vaporeon', 'jolteon', 'flareon', 'espeon', 'umbreon', 'leafeon', 'glaceon', 'sylveon',
    'croconaw', 'feraligatr', 'quilava', 'typhlosion', 'flaaffy', 'ampharos', 'lanturn', 'azumarill',
    'skiploom', 'jumpluff', 'sunflora', 'quagsire', 'ursaring', 'magcargo', 'piloswine', 'houndoom',
  ]) {
    await expect(page.locator(`[data-tower="${id}"]`)).toHaveCount(0);
  }
  await page.locator('[data-type="dragon"]').click();
  await expect(page.locator('[data-tower="dratini"]')).toBeAttached();
  await expect(page.locator('[data-tower="dragonite"]')).toHaveCount(0);
  await page.locator('[data-tower="dratini"]').click();
  await expect(page.locator('#selectedTowerName')).toHaveText('Dratini');
});

test('legacy saves restore evolved and directly purchased forms with their upgrades intact', async ({ page }) => {
  const legacyTowers: SavedTower[] = [
    { type: 'typhlosion', x: 120, y: 440, skills: { power: 2, range: 1, special: 3 }, evolutionStage: 1, spentCoins: 540 },
    { type: 'feraligatr', x: 360, y: 440, skills: { power: 1, range: 2, special: 0 }, evolutionStage: 0, spentCoins: 385 },
    { type: 'eevee', x: 600, y: 440, skills: { power: 1, range: 1, special: 1 }, evolutionStage: 1, spentCoins: 330, eeveeEvolution: 'jolteon' },
    { type: 'dragonite', x: 1000, y: 440, skills: { power: 3, range: 0, special: 2 }, evolutionStage: 0, spentCoins: 470 },
  ];
  await ready(page, checkpoint({ towers: legacyTowers, selectedTower: 'typhlosion' }));
  await page.locator('#continueButton').click();
  const restored = (await savedRun(page)).towers;
  expect(restored).toHaveLength(legacyTowers.length);
  for (const tower of legacyTowers) {
    expect(restored).toContainEqual(expect.objectContaining(tower as unknown as Record<string, unknown>));
  }
  await page.locator('#openShopButton').click();
  const shopIds = await expectedShopIds(page);
  await expect(page.locator('.shop-tower-card')).toHaveCount(shopIds.length);
  for (const id of ['typhlosion', 'feraligatr', 'dragonite', 'jolteon']) {
    await expect(page.locator(`[data-tower="${id}"]`)).toHaveCount(0);
  }
});

test('three difficulties change starting resources and lock once a run begins', async ({ page }) => {
  await ready(page);
  for (const [id, coins, lives] of [['easy', '220', '15'], ['hard', '150', '7'], ['medium', '180', '10']]) {
    await page.locator(`[data-difficulty="${id}"]`).click();
    await expect(page.locator('#coinValue')).toHaveText(coins);
    await expect(page.locator('#lifeValue')).toHaveText(lives);
    await expect(page.locator(`[data-difficulty="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
  }
  await page.locator('#startButton').click();
  expect((await savedRun(page)).difficulty).toBe('medium');
  await expect(page.locator('[data-difficulty="hard"]')).toBeDisabled();
  await expect(page.locator('#pauseButton')).toBeEnabled();
});

for (const evolution of ['vaporeon', 'jolteon', 'flareon', 'espeon', 'umbreon', 'leafeon', 'glaceon', 'sylveon']) {
  test(`Eevee can choose ${evolution}, reach mastery, and continue the saved branch`, async ({ page }) => {
    await ready(page, checkpoint());
    await page.locator('#continueButton').click();
    await clickWorld(page, 120, 360);
    await page.locator('[data-ability="evolution"]').click();
    await expect(page.locator('#eeveeEvolutionOptions button')).toHaveCount(8);
    await advance(page, 4);
    expect((await savedRun(page)).coins).toBe(4000);
    await expect(page.locator('#waveStatus')).toContainText('Starts in 2s');
    await page.locator(`[data-evolution="${evolution}"]`).click();
    let saved = await savedRun(page);
    expect(saved.coins).toBe(3910);
    expect(saved.towers[0]).toMatchObject({ type: 'eevee', evolutionStage: 1, eeveeEvolution: evolution });
    await expect(page.locator('#eeveeEvolutionChoices')).toBeHidden();
    await expect(page.locator('#upgradeName')).toHaveText(evolution[0].toUpperCase() + evolution.slice(1));
    for (const ability of ['power', 'range', 'special']) await page.locator(`[data-ability="${ability}"]`).click();
    await page.locator('[data-ability="evolution"]').click();
    saved = await savedRun(page);
    expect(saved.towers[0]).toMatchObject({ evolutionStage: 2, eeveeEvolution: evolution });
    await page.reload();
    await page.locator('#continueButton').click();
    await clickWorld(page, 120, 360);
    await expect(page.locator('#upgradeName')).toHaveText(`${evolution[0].toUpperCase() + evolution.slice(1)} · Mastery`);
    expect((await savedRun(page)).towers[0].eeveeEvolution).toBe(evolution);
  });
}

test('version 1 checkpoints without new fields retain the original map and Vaporeon', async ({ page }) => {
  await ready(page, checkpoint({ towers: [{ ...eeveeTower, evolutionStage: 1 }] }));
  await page.locator('#continueButton').click();
  await clickWorld(page, 120, 360);
  await expect(page.locator('#upgradeName')).toHaveText('Vaporeon');
  const saved = await savedRun(page);
  expect(saved).toMatchObject({ version: 1, difficulty: 'medium', mapId: 'classic' });
  expect(saved.towers[0].eeveeEvolution).toBe('vaporeon');
});

test('mixed Pidgey/Pidgeotto preview is the composition actually used by the next wave', async ({ page }) => {
  await ready(page, checkpoint({ towers: [] }));
  await page.locator('#continueButton').click();
  await expect(page.locator('#waveStatus')).toContainText('14× Pidgey + 6× Pidgeotto');
  const planned = (await savedRun(page)).nextWavePlan;
  expect(planned?.filter(image => image === 'pidgeyAnimated')).toHaveLength(14);
  expect(planned?.filter(image => image === 'pidgeottoAnimated')).toHaveLength(6);
  await advance(page, 2.5);
  await expect(page.locator('#waveValue')).toHaveText('6');
  await expect(page.locator('#waveStatus')).toContainText('/20 stopped · 14× Pidgey + 6× Pidgeotto');
});

test('saved family rotation and next-wave preview survive continuing', async ({ page }) => {
  const plan = [...Array<string>(14).fill('pidgeyAnimated'), ...Array<string>(6).fill('pidgeottoAnimated')];
  await ready(page, checkpoint({ towers: [], nextWavePlan: plan, familyQueue: ['gastly', 'dratini', 'geodude'] }));
  await page.locator('#continueButton').click();
  expect((await savedRun(page)).nextWavePlan).toEqual(plan);
  expect((await savedRun(page)).familyQueue).toEqual(['gastly', 'dratini', 'geodude']);
});

test('completing a wave takes a different family from the persisted rotation', async ({ page }) => {
  const towers = [120, 440, 600].map((x): SavedTower => ({
    type: 'arceus', x, y: 440, skills: { power: 3, range: 3, special: 3 },
    evolutionStage: 2, spentCoins: 2000,
  }));
  await ready(page, checkpoint({
    towers, selectedTower: 'pikachu', familyQueue: ['gastly', 'dratini', 'geodude'],
  }));
  await page.locator('#continueButton').click();
  await advance(page, 23);
  const saved = await savedRun(page);
  expect(saved.wave).toBe(6);
  expect(saved.nextEnemyFamilyId).toBe('gastly');
  expect(saved.familyQueue).toEqual(['dratini', 'geodude']);
  await expect(page.locator('#waveEnemyName')).toContainText('Haunter');
  await page.locator('#startWaveButton').press('Enter');
  await advance(page, 0.2);
  await expect(page.locator('#waveValue')).toHaveText('7');
  await expect(page.locator('#waveStatus')).toContainText('14× Gastly + 6× Haunter');
});

test('extra-large maps restore more than 80 valid defenders without truncating the saved team', async ({ page }) => {
  const towers = Array.from({ length: 256 }, (_, index): SavedTower => ({
    type: 'pikachu', x: 40 + (index % 16) * 80, y: 280 + Math.floor(index / 16) * 80,
    skills: { power: 0, range: 0, special: 0 }, evolutionStage: 0, spentCoins: 60,
  }));
  await ready(page, checkpoint({ wave: 0, mapId: 'volcano', selectedTower: 'pikachu', towers }));
  await page.locator('#continueButton').click();
  const restored = (await savedRun(page)).towers;
  expect(restored.length).toBeGreaterThan(80);
  await page.reload();
  await page.locator('#continueButton').click();
  expect((await savedRun(page)).towers).toEqual(restored);
});

test('Mewtwo boss appears with a different mechanic, and pausing freezes its ability timer', async ({ page }) => {
  await ready(page, checkpoint({ wave: 14, difficulty: 'hard', nextBossId: 'mewtwo', towers: [] }));
  await page.locator('#continueButton').click();
  await expect(page.locator('#waveEnemyName')).toContainText('Mewtwo');
  await advance(page, 3.5);
  await expect(page.locator('#bossHealth')).toBeVisible();
  await expect(page.locator('#bossHealthName')).toContainText('Mewtwo');
  await expect(page.locator('#waveStatus')).toContainText('Storm delays nearby defenders');
  const timer = await page.locator('#bossHealthStatus').textContent();
  await page.locator('#pauseButton').click();
  await advance(page, 5);
  await expect(page.locator('#bossHealthStatus')).toHaveText(timer || '');
  await page.locator('#resumeButton').click();
  await advance(page, 2);
  expect(await page.locator('#bossHealthStatus').textContent()).not.toBe(timer);
});

test('game over returns to the difficulty/map menu instead of immediately starting another run', async ({ page }) => {
  await ready(page, checkpoint({ wave: 30, difficulty: 'hard', lives: 1, towers: [] }));
  await page.locator('#continueButton').click();
  await advance(page, 35);
  await expect(page.locator('#gameOverPanel')).toBeVisible();
  await expect(page.locator('#lifeValue')).toHaveText('0');
  await page.locator('#restartButton').click();
  await expect(page.locator('#startPanel')).toBeVisible();
  await expect(page.locator('#gameOverPanel')).toBeHidden();
  await page.locator('[data-difficulty="easy"]').click();
  await page.locator('button[data-map="volcano"]').click();
  await expect(page.locator('#coinValue')).toHaveText('220');
  await expect(page.locator('#lifeValue')).toHaveText('15');
});

for (const [mapId, width, height] of [
  ['classic', 1600, 900], ['coast', 2240, 1260], ['volcano', 2880, 1620],
  ['switchback', 1600, 900], ['spiral', 1600, 900],
] as const) {
  test(`${mapId} map is selectable, rendered at its real size, and persistent on mobile`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await ready(page);
    await page.locator(`button[data-map="${mapId}"]`).click();
    await page.locator('#startButton').click();
    await advance(page, 0.1);
    await expect(page.locator('#gameCanvas')).toHaveAttribute('data-world-width', String(width));
    await expect(page.locator('#gameCanvas')).toHaveAttribute('data-world-height', String(height));
    expect((await savedRun(page)).mapId).toBe(mapId);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.locator('#gameCanvas').screenshot({ path: testInfo.outputPath(`${mapId}.png`) });
    await page.reload();
    await page.locator('#continueButton').click();
    await expect(page.locator('#gameCanvas')).toHaveAttribute('data-map', mapId);
  });
}

test('zoom/pan never places a tower during a drag, and zoomed mouse and keyboard placement agree', async ({ page }) => {
  await ready(page);
  await page.locator('#startButton').click();
  await page.locator('#gameCanvas').hover();
  await page.mouse.wheel(0, -100);
  const canvas = page.locator('#gameCanvas');
  await expect(canvas).toHaveAttribute('data-zoom', '1.5');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas unavailable for pan test.');
  const before = Number(await canvas.getAttribute('data-camera-x'));
  const x = box.x + box.width / 2;
  const y = box.y + box.height * 0.7;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 50, y - 35, { steps: 6 });
  await page.mouse.up();
  expect(Number(await canvas.getAttribute('data-camera-x'))).toBeGreaterThan(before);
  expect((await savedRun(page)).towers).toHaveLength(0);
  await clickWorld(page, 920, 440);
  expect((await savedRun(page)).towers[0]).toMatchObject({ x: 920, y: 440 });
  await page.locator('#openShopButton').click();
  await page.locator('[data-tower="pikachu"]').click();
  await canvas.press('ArrowRight');
  await canvas.press('Enter');
  expect((await savedRun(page)).towers[1]).toMatchObject({ x: 1000, y: 440 });
  await page.locator('#resetViewButton').click();
  await expect(canvas).toHaveAttribute('data-zoom', '1');
  await expect(canvas).toHaveAttribute('data-camera-x', '0');
});

test('touch can place and pan a bigger map without accidentally buying another defender', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.locator('button[data-map="coast"]').click();
  await page.locator('#startButton').click();
  await clickWorld(page, 120, 440, true);
  expect((await savedRun(page)).towers).toHaveLength(1);
  await page.locator('#gameCanvas').hover();
  await page.mouse.wheel(0, -100);
  await expect(page.locator('#gameCanvas')).toHaveAttribute('data-zoom', '1.5');
  const canvas = page.locator('#gameCanvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas unavailable for touch pan.');
  const before = Number(await canvas.getAttribute('data-camera-x'));
  const session = await page.context().newCDPSession(page);
  const point = { x: box.x + box.width * 0.65, y: box.y + box.height * 0.6 };
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x - 40, y: point.y - 15 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await session.detach();
  expect(Number(await canvas.getAttribute('data-camera-x'))).toBeGreaterThan(before);
  expect((await savedRun(page)).towers).toHaveLength(1);
});

for (const [width, height, locale] of [
  [1024, 768, 'en'], [768, 1024, 'en'], [1024, 600, 'he'], [1180, 820, 'es'],
] as const) {
  test(`tablet ${width}×${height} ${locale}: buy and place without scrolling or covering the map`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await ready(page, checkpoint({ wave: 0, towers: [], selectedTower: 'pikachu' }), locale);
    await page.locator('#continueButton').click();
    await page.locator('#openShopButton').tap();
    await expect(page.locator('#towerShop')).toBeVisible();
    await page.locator('[data-tower="charmander"]').tap();
    await expect(page.locator('#towerShop')).toBeHidden();
    await clickWorld(page, 120, 360, true);
    expect((await savedRun(page)).towers).toHaveLength(1);
    await clickWorld(page, 120, 360, true);
    await expect(page.locator('#upgradePanel')).toBeVisible();
    await advance(page, 0.1);
    const geometry = await page.evaluate(() => {
      const field = document.querySelector('#gameCanvas')!.getBoundingClientRect();
      const deck = document.querySelector('#commandDeck')!.getBoundingClientRect();
      const dock = document.querySelector('#upgradePanel')!.getBoundingClientRect();
      return {
        viewport: [innerWidth, innerHeight],
        scroll: [scrollX, scrollY],
        fits: document.documentElement.scrollHeight <= innerHeight &&
          document.documentElement.scrollWidth <= innerWidth,
        canvas: { x: field.x, y: field.y, width: field.width, height: field.height },
        outside: deck.top >= field.bottom || deck.bottom <= field.top,
        above: dock.bottom <= field.top,
        targets: [...document.querySelectorAll('#commandDeck button, .hero-actions button')].filter(
          element => element.getClientRects().length,
        ).every(element => {
          const box = element.getBoundingClientRect();
          return box.width >= 48 && box.height >= 48;
        }),
      };
    });
    expect(geometry.viewport).toEqual([width, height]);
    expect(geometry.scroll).toEqual([0, 0]);
    expect(geometry.fits).toBe(true);
    expect(geometry.outside).toBe(true);
    expect(geometry.above).toBe(true);
    expect(geometry.targets).toBe(true);
    expect(geometry.canvas.width / geometry.canvas.height).toBeCloseTo(16 / 9, 3);
    expect(geometry.canvas.height).toBeGreaterThan(220);
    console.log(`Tablet geometry ${width}×${height}: ${JSON.stringify(geometry)}`);
    await page.screenshot({ path: testInfo.outputPath(`tablet-${width}x${height}-${locale}.png`) });
  });
}

test('long press lifts without shifting the field, then mouse drag moves without spending coins', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await ready(page, checkpoint({ wave: 0, selectedTower: 'pikachu', towers: [{ ...eeveeTower, type: 'pikachu' }] }));
  await page.locator('#continueButton').click();
  const canvas = page.locator('#gameCanvas');
  const before = await canvas.boundingBox();
  const origin = await worldPoint(page, 120, 360);
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
  await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
  expect(await canvas.boundingBox()).toEqual(before);
  const destination = await worldPoint(page, 120, 440);
  await page.mouse.move(destination.x, destination.y, { steps: 5 });
  await advance(page, 0.1);
  await page.mouse.up();
  expect((await savedRun(page)).towers[0]).toMatchObject({ x: 120, y: 440 });
  expect((await savedRun(page)).coins).toBe(4000);
  await expect(canvas).toHaveAttribute('data-moving-tower', '');
});

test('touch can drag a lifted defender at zoom without moving the camera or overlapping another tower', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await ready(page, checkpoint({
    wave: 0, selectedTower: 'pikachu',
    towers: [{ ...eeveeTower, type: 'pikachu' }, { ...eeveeTower, type: 'squirtle', y: 440 }],
  }));
  await page.locator('#continueButton').click();
  await page.locator('#gameCanvas').hover();
  await page.mouse.wheel(0, -100);
  await expect(page.locator('#gameCanvas')).toHaveAttribute('data-zoom', '1.5');
  const canvas = page.locator('#gameCanvas');
  // Keep both original cells visible within a zoomed view.
  await canvas.press('ArrowLeft');
  const camera = [await canvas.getAttribute('data-camera-x'), await canvas.getAttribute('data-camera-y')];
  const session = await page.context().newCDPSession(page);
  // Grab the visible upper body, not the ground overlapped by Squirtle's art.
  const origin = await worldPoint(page, 120, 292);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] });
  await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
  const occupied = await worldPoint(page, 120, 440 - 68);
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [occupied] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect((await savedRun(page)).towers[0]).toMatchObject({ x: 120, y: 360 });
  await expect(canvas).toHaveAttribute('data-moving-tower', '');
  const clear = await worldPoint(page, 120, 520 - 68);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] });
  await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [clear] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect((await savedRun(page)).towers[0]).toMatchObject({ x: 120, y: 520 });
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [clear] });
  await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
  const drop = await worldPoint(page, 120, 600 - 68);
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [drop] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect((await savedRun(page)).towers[0]).toMatchObject({ x: 120, y: 600 });
  expect((await savedRun(page)).towers).toHaveLength(2);
  expect([await canvas.getAttribute('data-camera-x'), await canvas.getAttribute('data-camera-y')]).toEqual(camera);
  await session.detach();
});

test('touch hold supports release-then-tap, invalid ground, cancellation and short-tap upgrades', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await ready(page, checkpoint({ wave: 0, selectedTower: 'pikachu', towers: [{ ...eeveeTower, type: 'pikachu' }] }));
  await page.locator('#continueButton').click();
  const canvas = page.locator('#gameCanvas');
  const session = await page.context().newCDPSession(page);
  const origin = await worldPoint(page, 120, 360);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] });
  await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
  await clickWorld(page, 120, 185, true); // Path, not buildable.
  expect((await savedRun(page)).towers[0]).toMatchObject({ x: 120, y: 360 });
  await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
  await clickWorld(page, 120, 440, true);
  expect((await savedRun(page)).towers[0]).toMatchObject({ x: 120, y: 440 });
  await clickWorld(page, 120, 440, true);
  await expect(page.locator('#upgradePanel')).toBeVisible();
  await expect(canvas).toHaveAttribute('data-moving-tower', '');
  const moved = await worldPoint(page, 120, 440);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [moved] });
  await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(canvas).toHaveAttribute('data-moving-tower', '');
  expect((await savedRun(page)).towers).toHaveLength(1);
  await session.detach();
  await canvas.press('m');
  await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
  await canvas.press('Escape');
  await expect(canvas).toHaveAttribute('data-moving-tower', '');
  await expect(page.locator('#pausePanel')).toBeHidden();
});

for (const [difficulty, wave, count] of [
  ['easy', 4, 1], ['medium', 4, 2], ['hard', 4, 3], ['hard', 24, 5],
] as const) {
  test(`${difficulty} wave ${wave + 1} spawns exactly ${count} bosses and persists the squad`, async ({ page }) => {
    await ready(page, checkpoint({ wave, difficulty, towers: [], nextBossId: 'onix' }));
    await page.locator('#continueButton').click();
    const squad = (await savedRun(page)).nextWavePlan;
    expect(squad).toHaveLength(count);
    await page.reload();
    await page.locator('#continueButton').click();
    expect((await savedRun(page)).nextWavePlan).toEqual(squad);
    await advance(page, 12);
    await expect(page.locator('#gameCanvas')).toHaveAttribute('data-boss-count', String(count));
    await expect(page.locator('#waveEnemyName')).toContainText(`${count} bosses`);
  });
}

async function waitForThreat(page: Page) {
  await advance(page, 6);
  for (let step = 0; step < 80; step++) {
    if (Number(await page.locator('#gameCanvas').getAttribute('data-threat-count')) > 0) return;
    await advance(page, 0.1);
  }
  throw new Error('Boss did not telegraph an attack.');
}

test('a warned boss attack destroys a last-shield tower with feedback and a 65% refund', async ({ page }) => {
  await ready(page, checkpoint({
    wave: 4, difficulty: 'medium', nextBossId: 'onix',
    towers: [{ ...eeveeTower, type: 'pikachu', durability: 1, spentCoins: 60 }],
  }));
  await page.locator('#continueButton').click();
  await waitForThreat(page);
  await expect(page.locator('#toast')).toContainText('red ring');
  await expect(page.locator('#gameCanvas')).toHaveAttribute('data-tower-count', '1');
  await advance(page, 2.5);
  await expect(page.locator('#gameCanvas')).toHaveAttribute('data-tower-count', '0');
  await expect(page.locator('#toast')).toContainText('knocked out');
  await expect(page.locator('#coinValue')).toHaveText('4039');
});

test('moving out of a boss telegraph avoids damage, while old saves start with three shields', async ({ page }) => {
  await ready(page, checkpoint({
    wave: 4, difficulty: 'medium', nextBossId: 'onix',
    towers: [{ ...eeveeTower, type: 'pikachu' }],
  }));
  await page.locator('#continueButton').click();
  expect((await savedRun(page)).towers[0].durability).toBe(3);
  await waitForThreat(page);
  await clickWorld(page, 120, 360);
  await page.locator('#gameCanvas').press('m');
  await expect(page.locator('#gameCanvas')).not.toHaveAttribute('data-moving-tower', '');
  await clickWorld(page, 120, 600);
  await advance(page, 2.5);
  await expect(page.locator('#gameCanvas')).toHaveAttribute('data-tower-count', '1');
  await expect(page.locator('#upgradeBadge')).toContainText('3/3');
  await expect(page.locator('#coinValue')).toHaveText('4000');
});

test('Easy telegraphs but never destroys even a damaged defender', async ({ page }) => {
  await ready(page, checkpoint({
    wave: 4, difficulty: 'easy', nextBossId: 'onix',
    towers: [{ ...eeveeTower, type: 'pikachu', durability: 1 }],
  }));
  await page.locator('#continueButton').click();
  await waitForThreat(page);
  await advance(page, 2.5);
  await expect(page.locator('#gameCanvas')).toHaveAttribute('data-tower-count', '1');
  await expect(page.locator('#toast')).toContainText('resting');
});

for (const [width, height] of [[1024, 768], [768, 1024]] as const) {
  test(`portal tablet ${width}×${height} keeps the embedded game and its picture deck in view`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await ready(page, checkpoint({ wave: 0, towers: [], selectedTower: 'pikachu' }));
    await page.goto('/en/games/pokemon-tower-defense');
    await page.getByRole('dialog').getByRole('button', { name: /Got it/ }).click();
    const header = page.locator('header').first();
    const headerBox = await header.boundingBox();
    expect(headerBox!.height).toBeLessThanOrEqual(52);
    for (const control of await header.locator('button').all()) {
      const box = await control.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(48);
    }
    const frame = page.frames().find(frame => frame.url().includes('/games/pokemon-tower-defense/index.html'));
    if (!frame) throw new Error('Pokémon portal iframe is missing.');
    await frame.locator('#instructionsButton').focus();
    await expect(frame.locator('#instructionsButton')).toBeFocused();
    await frame.locator('#continueButton').click();
    await frame.locator('#openShopButton').tap();
    await frame.locator('[data-tower="pikachu"]').tap();
    const point = await frame.locator('#gameCanvas').boundingBox();
    if (!point) throw new Error('Embedded canvas is missing.');
    await page.touchscreen.tap(point.x + point.width * 120 / 1600, point.y + point.height * 360 / 900);
    await expect(frame.locator('#coinValue')).toHaveText('3940');
    const geometry = await frame.evaluate(() => {
      const canvas = document.querySelector('#gameCanvas')!.getBoundingClientRect();
      const deck = document.querySelector('#commandDeck')!.getBoundingClientRect();
      return {
        iframe: [innerWidth, innerHeight],
        canvas: [canvas.width, canvas.height],
        scroll: [scrollX, scrollY],
        fits: document.documentElement.scrollHeight <= innerHeight &&
          document.documentElement.scrollWidth <= innerWidth,
        outside: deck.top >= canvas.bottom || deck.bottom <= canvas.top,
      };
    });
    expect(geometry.fits).toBe(true);
    expect(geometry.outside).toBe(true);
    expect(geometry.scroll).toEqual([0, 0]);
    expect(geometry.canvas[1]).toBeGreaterThan(220);
    expect(geometry.iframe[1]).toBeGreaterThanOrEqual(height - 52);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    console.log(`Portal tablet ${width}×${height}: ${JSON.stringify(geometry)}`);
    await advance(frame, 0.1);
    await page.screenshot({ path: testInfo.outputPath(`portal-tablet-${width}x${height}.png`) });
    await page.getByRole('link', { name: 'Back' }).click();
    await expect(page).toHaveURL(/\/en\/games\/?$/);
    expect(await page.evaluate(() => ({
      bodyHeight: document.body.style.height, bodyOverflow: document.body.style.overflow,
      rootHeight: document.documentElement.style.height, rootOverflow: document.documentElement.style.overflow,
    }))).toEqual({ bodyHeight: '', bodyOverflow: '', rootHeight: '', rootOverflow: '' });
  });
}

for (const [locale, direction, shop] of [['en', 'ltr', 'Pokémon'], ['he', 'rtl', 'פוקימונים'], ['zh', 'ltr', '宝可梦'], ['es', 'ltr', 'Pokémon']]) {
  test(`${locale} translates the shop, progression, difficulty and map controls`, async ({ page }) => {
    await ready(page, checkpoint({ towers: [] }), locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('html')).toHaveAttribute('dir', direction);
    await page.locator('#continueButton').click();
    await page.locator('#openShopButton').click();
    await expect(page.locator('#towerShopTitle')).toContainText(shop);
    await page.locator('#closeShopButton').click();
    await expect(page.locator('#waveStatus')).not.toBeEmpty();
    await expect(page.locator('#difficultyValue')).not.toBeEmpty();
    await expect(page.locator('#mapValue')).not.toBeEmpty();
    if (locale !== 'he') {
      expect(await page.locator('body').innerText()).not.toMatch(/[\u0590-\u05ff]/);
    }
  });
}

test('portal instructions pause the iframe and preserve a separate manual pause', async ({ page }) => {
  await ready(page, checkpoint({ towers: [] }));
  await page.goto('/en/games/pokemon-tower-defense');
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('Eevee');
  await expect(modal).toContainText(/volcanic/i);
  await modal.getByRole('button', { name: /Got it/ }).click();
  const frame = page.frames().find(frame => frame.url().includes('/games/pokemon-tower-defense/index.html'));
  if (!frame) throw new Error('Portal did not load the Pokémon iframe.');
  await frame.locator('#continueButton').click();
  await frame.locator('#instructionsButton').click();
  await expect(modal).toBeVisible();
  const status = await frame.locator('#waveStatus').textContent();
  await advance(frame, 5);
  await expect(frame.locator('#waveStatus')).toHaveText(status || '');
  await modal.getByRole('button', { name: /Got it/ }).click();
  await advance(frame, 2.5);
  await expect(frame.locator('#waveValue')).toHaveText('6');
  await frame.locator('#pauseButton').click();
  await frame.locator('#instructionsButton').click();
  await expect(modal).toBeVisible();
  await modal.getByRole('button', { name: /Got it/ }).click();
  await expect(frame.locator('#pausePanel')).toBeVisible();
  await frame.locator('#resumeButton').click();
  await expect(frame.locator('#pausePanel')).toBeHidden();
});

test('ready standalone orb activates real gameplay power and shared portal audio', async ({ page }) => {
  await trackSoundContexts(page);
  await ready(page, checkpoint({ wave: 0, power: 100, towers: [] }));
  await page.goto('/en/games/pokemon-tower-defense');
  await page.getByRole('dialog').getByRole('button', { name: /Got it/ }).click();
  const frame = page.frames().find(frame => frame.url().includes('/games/pokemon-tower-defense/index.html'));
  if (!frame) throw new Error('Missing Pokémon iframe.');
  await frame.locator('#continueButton').click();
  await frame.locator('#soundButton').click();
  await advance(frame, 7);
  const power = frame.locator('.power-station #powerButton');
  await expect(power).toBeEnabled();
  await expect(frame.locator('#powerLabel')).toHaveText('Ready!');
  const before = await soundPlayCount(page);
  await power.click();
  await expect.poll(() => soundPlayCount(page)).toBeGreaterThan(before);
  await expect(frame.locator('#powerLabel')).toHaveText('0%');
  await expect(power).toBeDisabled();
  expect(await frame.evaluate(() => (window as TestWindow).audioContextCount)).toBe(0);
});

test('embedded game events use the shared sound owner without creating iframe audio', async ({ page }) => {
  await trackSoundContexts(page);
  await ready(page);
  await page.goto('/en/games/pokemon-tower-defense');
  await page.getByRole('dialog').getByRole('button', { name: /Got it/ }).click();
  const frame = page.frames().find(frame => frame.url().includes('/games/pokemon-tower-defense/index.html'));
  if (!frame) throw new Error('Portal did not load the Pokémon iframe.');
  await frame.locator('#startButton').click();
  const before = await soundPlayCount(page);
  await frame.locator('#soundButton').click();
  await expect.poll(() => soundPlayCount(page)).toBeGreaterThan(before);
  await expect.poll(() => page.evaluate(() => {
    const owner: TestWindow = window;
    return owner.audioContextCount;
  })).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => {
    const owner: TestWindow = window;
    return owner.soundContext?.state;
  })).toBe('running');
  for (const event of ['click', 'shoot', 'hit', 'success', 'levelUp', 'gameOver', 'powerUp']) {
    const beforeEvent = await soundPlayCount(page);
    await frame.evaluate(event => {
      window.parent.postMessage({
        source: 'pokemon-tower-defense', type: 'sound', event,
      }, window.location.origin);
    }, event);
    await expect.poll(() => soundPlayCount(page)).toBeGreaterThan(beforeEvent);
  }
  expect(await frame.evaluate(() => {
    const child: TestWindow = window;
    return child.audioContextCount;
  })).toBe(0);
});

for (const [muted, localEnabled] of [[true, true], [true, false], [false, true], [false, false]]) {
  test(`iframe sound reconciles the shared mute preference (portal muted ${muted}, local enabled ${localEnabled})`, async ({ page }) => {
    await trackSoundContexts(page);
    await ready(page);
    await page.evaluate(({ muted, localEnabled, profileKey, soundKey }) => {
      const saved = localStorage.getItem(profileKey);
      if (!saved) throw new Error('Expected a saved Pokémon profile.');
      localStorage.setItem(profileKey, JSON.stringify({ ...JSON.parse(saved), soundEnabled: localEnabled }));
      localStorage.setItem(soundKey, String(muted));
    }, { muted, localEnabled, profileKey: PROFILE_KEY, soundKey: SOUND_KEY });
    await page.goto('/en/games/pokemon-tower-defense');
    await page.getByRole('dialog').getByRole('button', { name: /Got it/ }).click();
    const frame = page.frames().find(frame => frame.url().includes('/games/pokemon-tower-defense/index.html'));
    if (!frame) throw new Error('Portal did not load the Pokémon iframe.');
    await frame.locator('#startButton').click();
    const button = frame.locator('#soundButton');
    await expect(button).toHaveAttribute('aria-pressed', String(muted || !localEnabled));
    expect(await frame.evaluate(key => {
      const saved = localStorage.getItem(key);
      if (!saved) throw new Error('Expected a saved Pokémon profile.');
      return JSON.parse(saved).soundEnabled;
    }, PROFILE_KEY)).toBe(localEnabled);
    if (!muted && localEnabled) {
      await button.click();
      await expect.poll(() => page.evaluate(key => localStorage.getItem(key), SOUND_KEY)).toBe('true');
      await expect(button).toHaveAttribute('aria-pressed', 'true');
    }
    const before = await soundPlayCount(page);
    await button.click();
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key), SOUND_KEY)).toBe('false');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => soundPlayCount(page)).toBeGreaterThan(before);
    const beforeRepeatedEnable = await soundPlayCount(page);
    await frame.evaluate(() => {
      const message = { source: 'pokemon-tower-defense', type: 'sound-preference', enabled: true };
      window.parent.postMessage(message, window.location.origin);
      window.parent.postMessage(message, window.location.origin);
    });
    await expect.poll(() => soundPlayCount(page)).toBeGreaterThanOrEqual(beforeRepeatedEnable + 2);
    expect(await page.evaluate(key => localStorage.getItem(key), SOUND_KEY)).toBe('false');
    expect(await frame.evaluate(() => {
      const game: TestWindow = window;
      return game.audioContextCount;
    })).toBe(0);
    await button.click();
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key), SOUND_KEY)).toBe('true');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(page.frameLocator('iframe').locator('#soundButton')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(key => localStorage.getItem(key), SOUND_KEY)).toBe('true');
  });
}
