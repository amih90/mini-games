import { expect, test, type Frame, type Page } from '@playwright/test';

interface SavedTower {
  type: string;
  x: number;
  y: number;
  skills: { power: number; range: number; special: number };
  evolutionStage: number;
  spentCoins: number;
  eeveeEvolution?: string | null;
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

async function clickWorld(page: Page, x: number, y: number, touch = false) {
  const canvas = page.locator('#gameCanvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Pokémon canvas is not visible.');
  const camera = await canvas.evaluate(element => ({
    x: Number(element.getAttribute('data-camera-x')), y: Number(element.getAttribute('data-camera-y')),
    zoom: Number(element.getAttribute('data-zoom')),
    width: Number(element.getAttribute('data-world-width')), height: Number(element.getAttribute('data-world-height')),
  }));
  const point = {
    x: box.x + (x - camera.x) * camera.zoom / camera.width * box.width,
    y: box.y + (y - camera.y) * camera.zoom / camera.height * box.height,
  };
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

test('shop has 65 defenders, the requested legends, and all added type filters', async ({ page }) => {
  await ready(page);
  await page.locator('#openShopButton').click();
  await expect(page.locator('.shop-tower-card')).toHaveCount(65);
  for (const id of ['mew', 'mewtwo', 'dragonite', 'lugia', 'zapdos', 'moltres', 'arceus']) {
    await expect(page.locator(`[data-tower="${id}"]`)).toBeAttached();
  }
  await page.locator('[data-type="dragon"]').click();
  await expect(page.locator('.shop-tower-card')).toHaveCount(6);
  await page.locator('[data-tower="dragonite"]').click();
  await expect(page.locator('#selectedTowerName')).toHaveText('Dragonite');
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

for (const [mapId, width, height] of [['classic', 1600, 900], ['coast', 2240, 1260], ['volcano', 2880, 1620]] as const) {
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
  await page.locator('#zoomInButton').click();
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
  await page.locator('#zoomInButton').click();
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

for (const [locale, direction, shop] of [['en', 'ltr', 'Pokémon'], ['he', 'rtl', 'פוקימונים'], ['zh', 'ltr', '宝可梦'], ['es', 'ltr', 'Pokémon']]) {
  test(`${locale} translates the shop, progression, difficulty and map controls`, async ({ page }) => {
    await ready(page, checkpoint({ towers: [] }), locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('html')).toHaveAttribute('dir', direction);
    await page.locator('#openShopButton').click();
    await expect(page.locator('#towerShopTitle')).toContainText(shop);
    await page.locator('#closeShopButton').click();
    await page.locator('#continueButton').click();
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

test('embedded game events use the shared sound owner without creating iframe audio', async ({ page }) => {
  await trackSoundContexts(page);
  await ready(page);
  await page.goto('/en/games/pokemon-tower-defense');
  await page.getByRole('dialog').getByRole('button', { name: /Got it/ }).click();
  const frame = page.frames().find(frame => frame.url().includes('/games/pokemon-tower-defense/index.html'));
  if (!frame) throw new Error('Portal did not load the Pokémon iframe.');
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
