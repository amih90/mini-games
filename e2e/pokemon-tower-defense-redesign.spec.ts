import { expect, test, type Page, type Frame } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

interface Tower { id: number; type: string; x: number; y: number; spentCoins: number; skills: { power: number; range: number; special: number }; evolutionStage: number }
interface Enemy { x: number; y: number; segment: number; speed: number; boss: boolean; dead: boolean; escaped: boolean }
interface Point { x: number; y: number; distance: number }
interface AuditWindow extends Window {
  __td: {
    state: () => {
      towers: Tower[]; enemies: Enemy[]; coins: number; paused: boolean; wave: number;
      waveActive: boolean; lives: number; bossShieldAvailable: boolean;
      power: number; selectedTowerId: number | null; movingTowerId: number | null;
      buildSelectionActive: boolean;
      camera: { x: number; y: number; zoom: number };
    };
    route: () => Point[];
    advanceEnemies: (dt: number) => void;
    draw: () => void;
    prepare: () => void;
    begin: () => void;
    spawn: () => void;
    hit: (x: number, y: number) => Tower | undefined;
    blocked: (x: number, y: number) => number;
    hud: () => void;
  };
  PokemonTDData: {
    routeDistance: (route: Point[], x: number, y: number) => number;
    SHOP_TOWER_IDS?: string[];
    EXPANSION_BASE_IDS?: string[];
    POKEMON?: Record<string, { dex: number; en: string; he: string; zh: string; es: string }>;
    ADDITIONAL_TOWERS?: Record<string, { cost: number; element: string; evolutions: { image: string }[] }>;
  };
}
const source = readFileSync(path.join(__dirname, '../public/games/pokemon-tower-defense/game.js'), 'utf8');
// Test-only observation seam. The shipped game deliberately exposes no mutable
// simulation globals. Do not replace images: these tests also exercise real art.
const instrumented = source.replace('  resetGame();\n  loadAssets();', `
  window.__td = { state: () => state, route: () => PATH, advanceEnemies: updateEnemies,
    draw, prepare: prepareNextWave, begin: beginWave, spawn: spawnEnemy,
    hit: hitTower, blocked: distanceToPath, hud: updateHud };
  resetGame();
  loadAssets();`);
const runKey = 'mini-games:pokemon-tower-defense:run';
const tower = { type: 'pikachu', x: 120, y: 360, spentCoins: 240,
  skills: { power: 1, range: 1, special: 1 }, evolutionStage: 0 };
test.use({ hasTouch: true, viewport: { width: 1024, height: 768 } });
test.setTimeout(90_000);

async function load(page: Page, options: { locale?: string; zoom?: boolean; towers?: typeof tower[]; coins?: number; finalEvolutionUnlocked?: boolean } = {}) {
  await page.route('**/games/pokemon-tower-defense/game.js', route =>
    route.fulfill({ contentType: 'application/javascript', body: instrumented }));
  await page.addInitScript(({ runKey, tower, options }) => {
    if (!sessionStorage.getItem('pokemon-redesign-seeded')) {
    localStorage.setItem('mini-games:pokemon-tower-defense:profile', JSON.stringify({
      version: 1, tutorialComplete: true, soundEnabled: false, difficulty: 'medium', mapId: 'classic',
    }));
    localStorage.setItem(runKey, JSON.stringify({
      version: 1, coins: options.coins ?? 4000, lives: 10, wave: 0, selectedTower: 'pikachu', difficulty: 'medium',
      mapId: 'classic', towers: options.towers ?? [tower],
      finalEvolutionUnlocked: options.finalEvolutionUnlocked ?? false,
      camera: options.zoom ? { x: 0, y: 180, zoom: 1.5 } : { x: 0, y: 0, zoom: 1 },
    }));
    sessionStorage.setItem('pokemon-redesign-seeded', 'true');
    }
    // Stop only simulation animation; pointer hold timers and native touch stay real.
    if (location.pathname.includes('/games/pokemon-tower-defense/index.html') ||
        window.frameElement?.getAttribute('src')?.includes('/games/pokemon-tower-defense/index.html')) {
      window.requestAnimationFrame = () => 1;
    }
  }, { runKey, tower, options });
  await page.goto(`/games/pokemon-tower-defense/index.html?locale=${options.locale ?? 'en'}`);
  await page.locator('#continueButton').click();
  await page.evaluate(() => (window as unknown as AuditWindow).__td.draw());
}
async function point(page: Page, x: number, y: number) {
  return page.locator('canvas').evaluate((canvas, { x, y }) => {
    const rect = canvas.getBoundingClientRect(), c = (window as unknown as AuditWindow).__td.state().camera;
    return { x: rect.x + (x-c.x)*c.zoom/Number(canvas.dataset.worldWidth)*rect.width,
      y: rect.y + (y-c.y)*c.zoom/Number(canvas.dataset.worldHeight)*rect.height };
  }, { x, y });
}
async function snapshot(page: Page) {
  return page.evaluate(() => {
    const state = (window as unknown as AuditWindow).__td.state();
    return { towers: state.towers, coins: state.coins, camera: state.camera, paused: state.paused };
  });
}

async function expectFullShop(game: Page | Frame) {
  const ids = await game.evaluate(() => {
    const roster = (window as unknown as AuditWindow).PokemonTDData.SHOP_TOWER_IDS;
    if (!roster) throw new Error('Base-form shop roster was not initialized.');
    return roster;
  });
  await expect(game.locator('.shop-tower-card')).toHaveCount(ids.length);
  return ids;
}

async function captureRealArt(page: Page, filename: string, game: Page | Frame = page) {
  if (!process.env.POKEMON_ARTIFACT_DIR) return;
  await game.waitForFunction(() => [...document.images].filter(image => {
    const r = image.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 &&
      getComputedStyle(image).visibility !== 'hidden' && image.src.includes('/sprites/pokemon/');
  }).every(image => image.complete && image.naturalWidth > 0), null, { polling: 100, timeout: 20_000 });
  await game.evaluate(() => (window as unknown as AuditWindow).__td.draw());
  await page.addStyleTag({ content: 'nextjs-portal { visibility: hidden !important; }' });
  await page.screenshot({ path: path.join(process.env.POKEMON_ARTIFACT_DIR, filename) });
}

for (const locale of ['en', 'he']) for (const viewport of [
  { width: 1024, height: 768 }, { width: 768, height: 1024 },
  { width: 2000, height: 693 }, { width: 1920, height: 1080 },
]) {
  test(`${locale} ${viewport.width}x${viewport.height}: compact portal header and real-art inspector/shop fit without scroll`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await load(page, { locale });
    await page.goto(`/${locale}/games/pokemon-tower-defense`);
    await page.getByRole('dialog').locator('button').last().click();
    const game = page.frames().find(frame => frame.url().includes('/games/pokemon-tower-defense/index.html'));
    if (!game) throw new Error('Missing embedded Pokémon game.');
    await game.locator('#continueButton').click();
    const header = await page.locator('header').first().boundingBox();
    expect(header!.height).toBe(51);
    expect(await game.evaluate(() => innerHeight)).toBe(viewport.height - 51);
    const canvas = game.locator('canvas'), bounds = await canvas.boundingBox();
    await page.touchscreen.tap(bounds!.x + 120 / 1600 * bounds!.width, bounds!.y + 292 / 900 * bounds!.height);
    await expect(game.locator('#upgradePanel')).toBeVisible();
    for (const selector of ['#openShopButton', '#sellTowerButton']) {
      const button = game.locator(selector), box = (await button.boundingBox())!;
      const art = (await button.locator('.commerce-art').boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeGreaterThanOrEqual(48);
      expect(art.width).toBeGreaterThanOrEqual(48);
      expect(art.x).toBeGreaterThanOrEqual(box.x);
      expect(art.x + art.width).toBeLessThanOrEqual(box.x + box.width);
      expect(art.y + art.height).toBeLessThanOrEqual(box.y + box.height);
    }
    await expect(game.locator('#sellTowerValue')).toHaveText('156');
    for (const tile of await game.locator('.ability-button').all()) {
      const bounds = (await tile.boundingBox())!;
      const art = (await tile.locator('.ability-icon').boundingBox())!;
      expect(art.x).toBeGreaterThanOrEqual(bounds.x);
      expect(art.x + art.width).toBeLessThanOrEqual(bounds.x + bounds.width);
      expect(art.width).toBeGreaterThanOrEqual(92);
    }

    await captureRealArt(page, `portal-inspector-${locale}-${viewport.width}x${viewport.height}.png`, game);
    await game.locator('#openShopButton').tap();
    await expectFullShop(game);
    await captureRealArt(page, `portal-shop-${locale}-${viewport.width}x${viewport.height}.png`, game);
    for (const context of [page, game]) {
      expect(await context.evaluate(() => [
        document.documentElement.scrollWidth - innerWidth,
        document.documentElement.scrollHeight - innerHeight,
      ])).toEqual([0, 0]);
    }
    await game.locator('#closeShopButton').tap();
    expect(await canvas.boundingBox()).toEqual(bounds);
    if (locale === 'he') await expect(game.locator('html')).toHaveAttribute('dir', 'rtl');
  });
}

const johtoAdditions = 'totodile croconaw feraligatr cyndaquil quilava typhlosion mareep flaaffy ampharos chinchou lanturn marill azumarill hoppip skiploom jumpluff sunkern sunflora wooper quagsire teddiursa ursaring slugma magcargo swinub piloswine houndour houndoom skarmory shuckle'.split(' ');
const johtoBases = 'totodile cyndaquil mareep chinchou marill hoppip sunkern wooper teddiursa slugma swinub houndour skarmory shuckle'.split(' ');
const evolvedJohtoForms = 'croconaw feraligatr quilava typhlosion flaaffy ampharos lanturn azumarill skiploom jumpluff sunflora quagsire ursaring magcargo piloswine houndoom'.split(' ');
const addedStarterBases = 'treecko turtwig chimchar snivy tepig oshawott chespin fennekin froakie litten popplio grookey scorbunny sobble sprigatito fuecoco quaxly'.split(' ');
const expansionBases = 'bellsprout tentacool doduo drowzee krabby horsea spinarak aipom gligar lotad seedot aron electrike trapinch shroomish cranidos shieldon shellos drifloon snover stunky sandile darumaka joltik litwick axew golett honedge skiddo goomy phantump bergmite grubbin salandit mareanie jangmo-o morelull rookidee blipbug toxel impidimp silicobra cufant sizzlipede pawmi tarountula nacli tadbulb shroodle frigibax'.split(' ');

test('all 50 new base choices and 69 evolution forms have unique real artwork and fit landscape/portrait shops', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await load(page, { coins: 50000, towers: [] });
  const data = await page.evaluate(() => {
    const roster = (window as unknown as AuditWindow).PokemonTDData;
    const bases = roster.EXPANSION_BASE_IDS!;
    const towers = roster.ADDITIONAL_TOWERS!;
    const pokemon = roster.POKEMON!;
    const species = [...new Set(bases.flatMap(id => [
      id, ...towers[id].evolutions.map(form => form.image.replace(/Animated$/, '')),
    ]))];
    return { bases, species, dex: Object.fromEntries(species.map(id => [id, pokemon[id].dex])) };
  });
  expect(data.bases).toEqual(expansionBases);
  expect(data.bases).toHaveLength(50);
  expect(data.species).toHaveLength(119);
  await page.locator('#openShopButton').click();
  await expectFullShop(page);
  const artwork = await page.evaluate(async dexById => Promise.all(
    Object.entries(dexById).map(async ([id, dex]) => {
      const image = new Image();
      image.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dex}.png`;
      await image.decode();
      return { id, dex, width: image.naturalWidth, height: image.naturalHeight };
    }),
  ), data.dex);
  expect(artwork).toHaveLength(119);
  for (const image of artwork) {
    expect(image.width, image.id).toBeGreaterThanOrEqual(400);
    expect(image.height, image.id).toBeGreaterThanOrEqual(400);
  }
  for (const id of data.bases) await expect(page.locator(`[data-tower="${id}"]`)).toBeAttached();
  await page.locator('[data-type="ghost"]').click();
  for (const id of ['drifloon', 'litwick', 'phantump']) {
    await expect(page.locator(`[data-tower="${id}"]`)).toBeAttached();
  }
  await captureRealArt(page, 'pokemon-expansion-shop-landscape.png');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator('[data-type="all"]').click();
  await expectFullShop(page);
  await page.locator('[data-type="ghost"]').click();
  for (const id of ['drifloon', 'litwick', 'phantump']) {
    await expect(page.locator(`[data-tower="${id}"]`)).toBeAttached();
  }
  await captureRealArt(page, 'pokemon-expansion-shop-portrait.png');
  for (const context of [page]) {
    expect(await context.evaluate(() => [
      document.documentElement.scrollWidth - innerWidth,
      document.documentElement.scrollHeight - innerHeight,
    ])).toEqual([0, 0]);
  }
});

for (const [id, first, final, dex, mastery] of [
  ['litwick', 'Lampent', 'Chandelure', 609, false],
  ['horsea', 'Seadra', 'Kingdra', 230, false],
  ['tentacool', 'Tentacruel', 'Tentacruel', 73, true],
] as const) {
  test(`${id}: buy, place, evolve and restore the new ${first} → ${final} line`, async ({ page }) => {
    await load(page, { coins: 5000, towers: [], finalEvolutionUnlocked: true });
    const cost = await page.evaluate(id =>
      (window as unknown as AuditWindow).PokemonTDData.ADDITIONAL_TOWERS![id].cost, id);
    await page.locator('#openShopButton').click();
    await expectFullShop(page);
    await page.locator(`[data-tower="${id}"]`).click();
    const p = await point(page, 120, 360);
    await page.mouse.click(p.x, p.y);
    let saved = await snapshot(page);
    expect(saved.towers).toHaveLength(1);
    expect(saved.towers[0]).toMatchObject({ type: id, evolutionStage: 0, spentCoins: cost });
    expect(saved.coins).toBe(5000 - cost);

    await page.mouse.click(p.x, p.y);
    for (const ability of ['power', 'range', 'special']) await page.locator(`[data-ability="${ability}"]`).click();
    await page.locator('[data-ability="evolution"]').click();
    saved = await snapshot(page);
    expect(saved.towers[0]).toMatchObject({ type: id, evolutionStage: 1 });
    await expect(page.locator('#upgradeName')).toHaveText(first);

    for (const ability of ['power', 'range', 'special']) await page.locator(`[data-ability="${ability}"]`).click();
    await page.locator('[data-ability="evolution"]').click();
    saved = await snapshot(page);
    expect(saved.towers[0]).toMatchObject({ type: id, evolutionStage: 2 });
    const finalLabel = mastery ? `${final} · Mastery` : final;
    await expect(page.locator('#upgradeName')).toHaveText(finalLabel);
    await expect(page.locator('#heroPortrait')).toHaveAttribute('src', new RegExp(`official-artwork/${dex}\\.png$`));

    await page.reload();
    await page.locator('#continueButton').click();
    await page.mouse.click(p.x, p.y);
    const restored = await snapshot(page);
    expect(restored.towers[0]).toMatchObject({ type: id, evolutionStage: 2 });
    expect(restored.towers[0].spentCoins).toBe(saved.towers[0].spentCoins);
    expect(restored.coins).toBe(saved.coins);
    await expect(page.locator('#upgradeName')).toHaveText(finalLabel);
    await expect(page.locator('#heroPortrait')).toHaveAttribute('src', new RegExp(`official-artwork/${dex}\\.png$`));
  });
}

    test('Johto and new-generation starter art loads while only base forms can be bought', async ({ page }) => {
      test.setTimeout(180_000);
      await load(page, { coins: 50000, towers: [] });
      const art = await page.evaluate(async ids => {
        const data = (window as unknown as { PokemonTDData: {
          POKEMON: Record<string, { dex: number }>;
          ADDITIONAL_TOWERS: Record<string, { cost: number; element: string; evolutions: { image: string }[] }>;
        } }).PokemonTDData;
        const species = [...new Set(ids.flatMap(id => [id, ...data.ADDITIONAL_TOWERS[id].evolutions.map(form => form.image.replace('Animated', ''))]))];
        return Promise.all(species.map(async id => {
          const image = new Image();
          image.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.POKEMON[id].dex}.png`;
          await image.decode();
          return { id, width: image.naturalWidth, height: image.naturalHeight };
        }));
      }, [...johtoAdditions, ...addedStarterBases]);
      expect(art).toHaveLength(81);
      for (const image of art) {
        expect(image.width, image.id).toBeGreaterThanOrEqual(400);
        expect(image.height, image.id).toBeGreaterThanOrEqual(400);
      }
      await page.locator('#openShopButton').click();
      await expectFullShop(page);
      for (const id of johtoBases) await expect(page.locator(`[data-tower="${id}"]`)).toBeAttached();
      for (const id of evolvedJohtoForms) await expect(page.locator(`[data-tower="${id}"]`)).toHaveCount(0);
      for (const id of addedStarterBases) await expect(page.locator(`[data-tower="${id}"]`)).toBeAttached();
      await page.locator('#closeShopButton').click();
      for (const id of johtoBases) {
        await page.locator('#openShopButton').click();
        await expectFullShop(page);
        const cost = await page.evaluate(id => (window as unknown as { PokemonTDData: {
          ADDITIONAL_TOWERS: Record<string, { cost: number }>;
        } }).PokemonTDData.ADDITIONAL_TOWERS[id].cost, id);
        const before = (await snapshot(page)).coins;
        await page.locator(`[data-tower="${id}"]`).click();
        expect((await snapshot(page)).coins).toBe(before);
        const p = await point(page, 120, 360);
        await page.mouse.click(p.x, p.y);
        expect((await snapshot(page)).coins).toBe(before - cost);
        expect((await snapshot(page)).towers[0].type).toBe(id);
        await page.reload();
        await page.locator('#continueButton').click();
        expect((await snapshot(page)).towers[0].type).toBe(id);
        expect((await snapshot(page)).coins).toBe(before - cost);
        await page.mouse.click(p.x, p.y);
        const expectedDex = await page.evaluate(id => (window as unknown as { PokemonTDData: {
          POKEMON: Record<string, { dex: number }>;
        } }).PokemonTDData.POKEMON[id].dex, id);
        await expect(page.locator('#heroPortrait')).toHaveAttribute('src', new RegExp(`official-artwork/${expectedDex}\\.png$`));
        await expect(page.locator('#sellTowerValue')).toHaveText(String(Math.floor(cost * 0.65)));
        await page.locator('#sellTowerButton').click();
        expect((await snapshot(page)).coins).toBe(before - cost + Math.floor(cost * 0.65));
        expect((await snapshot(page)).towers).toHaveLength(0);
      }
    });

    for (const locale of ['en', 'he', 'zh', 'es']) {
      test(`${locale}: Johto purchase, type filter and restore retain localized species and real art`, async ({ page }) => {
        await load(page, { locale, towers: [] });
        const expectedIds = await page.evaluate(() => (window as unknown as AuditWindow).PokemonTDData.SHOP_TOWER_IDS!);
        await expect(page.locator('#dexValue')).toHaveText(String(expectedIds.length));
        await page.locator('#openShopButton').click();
        await expect(page.locator('.buy-pokemon-button small')).toContainText(String(expectedIds.length));
        await expect(page.locator('.shop-hint')).toContainText(String(expectedIds.length));
        const allIds = await page.locator('.shop-tower-card').evaluateAll(cards => cards.map(card => (card as HTMLElement).dataset.tower!));
        expect(new Set(allIds).size).toBe(expectedIds.length);
        expect(allIds.sort()).toEqual([...expectedIds].sort());
        await page.locator('[data-type="water"]').click();
        expect(await page.locator('.shop-tower-card').count()).toBeGreaterThan(0);
        await expect(page.locator('[data-tower="totodile"]')).toBeAttached();
        await expect(page.locator('[data-tower="cyndaquil"]')).toHaveCount(0);
        await page.locator('[data-tower="totodile"]').click();
        const p = await point(page, 120, 360);
        await page.mouse.click(p.x, p.y);
        expect((await snapshot(page)).coins).toBe(3932);
        await page.reload();
        await page.locator('#continueButton').click();
        await page.mouse.click(p.x, p.y);
        await expect(page.locator('#upgradeName')).toHaveText({
          en: 'Totodile', he: 'טוטודייל', zh: '小锯鳄', es: 'Totodile',
        }[locale]!);
        await expect(page.locator('#heroPortrait')).toHaveAttribute('src', /official-artwork\/158\.png$/);
        await expect(page.locator('#selectedTowerType')).not.toBeEmpty();
        await expect(page.locator('#sellTowerButton')).toHaveAttribute('aria-label', /44/);
        if (locale === 'he') await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      });
    }

    for (const [id, first, last, dex] of [
      ['totodile', 'Croconaw', 'Feraligatr', 160],
      ['cyndaquil', 'Quilava', 'Typhlosion', 157],
    ] as const) {
      test(`${id}: starter evolution costs, ranks, final form and restore`, async ({ page }) => {
        await load(page, { towers: [{ ...tower, type: id }], finalEvolutionUnlocked: true });
        const p = await point(page, 120, 360);
        await page.mouse.click(p.x, p.y);
        await page.locator('[data-ability="evolution"]').click();
        await expect(page.locator('#upgradeName')).toHaveText(first);
        expect((await snapshot(page)).coins).toBe(3935); // round(68 × .95)
        expect((await snapshot(page)).towers[0].evolutionStage).toBe(1);
        await expect(page.locator('[data-ability="evolution"]')).toBeDisabled();
        for (const ability of ['power', 'range', 'special']) await page.locator(`[data-ability="${ability}"]`).click();
        const before = (await snapshot(page)).coins;
        await page.locator('[data-ability="evolution"]').click();
        expect((await snapshot(page)).coins).toBe(before - 116); // round(68 × 1.7)
        expect((await snapshot(page)).towers[0]).toMatchObject({
          type: id, evolutionStage: 2, skills: { power: 2, range: 2, special: 2 },
        });
        await expect(page.locator('#upgradeName')).toHaveText(last);
        await expect(page.locator('#heroPortrait')).toHaveAttribute('src', new RegExp(`official-artwork/${dex}\\.png$`));
        await page.reload();
        await page.locator('#continueButton').click();
        await page.mouse.click(p.x, p.y);
        await expect(page.locator('#upgradeName')).toHaveText(last);
        await expect(page.locator('[data-ability="evolution"]')).toBeDisabled();
        await expect(page.locator('#sellTowerPortrait')).toHaveAttribute('src', new RegExp(`official-artwork/${dex}\\.png$`));
      });
    }

    for (const locale of ['en', 'he']) {
      test(`${locale}: phone portrait illustrated Buy and Sell fit without stealing battlefield height`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await load(page, { locale });
        const p = await point(page, 120, 292);
        await page.touchscreen.tap(p.x, p.y);
        await expect(page.locator('#upgradePanel')).toBeVisible();
        const teamBounds = (await page.locator('.team-workspace').boundingBox())!;
        for (const selector of ['.command-deck', '.power-station', '#openShopButton', '#sellTowerButton', '.ability-bar']) {
          const bounds = (await page.locator(selector).boundingBox())!;
          expect(bounds.x).toBeGreaterThanOrEqual(0);
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
          if (selector === '#sellTowerButton' || selector === '.ability-bar') {
            expect(bounds.y + bounds.height).toBeLessThanOrEqual(teamBounds.y + teamBounds.height);
          }
        }
        for (const selector of ['#openShopButton', '#sellTowerButton']) {
          const bounds = (await page.locator(selector).boundingBox())!;
          const art = (await page.locator(`${selector} .commerce-art`).boundingBox())!;
          expect(bounds.width).toBeGreaterThanOrEqual(48);
          expect(bounds.height).toBeGreaterThanOrEqual(48);
          expect(art.width).toBeGreaterThanOrEqual(48);
          expect(art.x).toBeGreaterThanOrEqual(bounds.x);
          expect(art.x + art.width).toBeLessThanOrEqual(bounds.x + bounds.width);
          expect(art.y + art.height).toBeLessThanOrEqual(bounds.y + bounds.height);
        }
        const canvas = (await page.locator('canvas').boundingBox())!;
        expect(canvas.height).toBeGreaterThan(150);
        await expect(page.locator('#sellTowerValue')).toHaveText('156');
        await captureRealArt(page, `commerce-inspector-${locale}-390x844.png`);
        await page.locator('#openShopButton').tap();
        await expectFullShop(page);
        await page.locator('#closeShopButton').tap();
        expect(await page.locator('canvas').boundingBox()).toEqual(canvas);
      });
    }

for (const locale of ['en', 'he']) for (const viewport of [
  { width: 1024, height: 768 }, { width: 768, height: 1024 },
]) {
  test(`${locale} ${viewport.width}x${viewport.height}: inspector keeps full shop available for repeated arbitrary purchases`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await load(page, { locale });
    const tap = async (x: number, y: number) => {
      const p = await point(page, x, y);
      await page.touchscreen.tap(p.x, p.y);
    };
    const canvas = page.locator('canvas'), bounds = await canvas.boundingBox();
    await tap(120, 292);
    await expect(page.locator('#upgradePanel')).toBeVisible();
    const original = (await snapshot(page)).towers[0];
    await expect(page.locator('#moveTowerButton, .direction-pad, #keyboardActionButton, .quick-team')).toHaveCount(0);
    for (const illustration of await page.locator('.ability-icon > svg, .ability-icon > img').all()) {
      const size = await illustration.boundingBox();
      expect(size!.width).toBeGreaterThanOrEqual(88);
      expect(size!.height).toBeGreaterThanOrEqual(88);
    }
    for (const prose of await page.locator('.ability-button strong, .ability-detail').all()) {
      await expect(prose).toBeHidden();
    }
    for (const tile of await page.locator('.ability-button').all()) {
      await expect(tile).toHaveAttribute('aria-label', /.+/);
      await expect(tile).toHaveAttribute('title', /.+/);
    }
    const buyBounds = await page.locator('#openShopButton').boundingBox();
    const inspectorBounds = await page.locator('#upgradePanel').boundingBox();
    expect(buyBounds!.x + buyBounds!.width <= inspectorBounds!.x ||
      inspectorBounds!.x + inspectorBounds!.width <= buyBounds!.x).toBe(true);
    await captureRealArt(page, `inspector-${locale}-${viewport.width}x${viewport.height}.png`);

    // An empty-map dismissal is not an accidental second purchase.
    const beforeDismissal = await snapshot(page);
    await tap(120, 440);
    await expect(page.locator('#upgradePanel')).toBeHidden();
    expect(await snapshot(page)).toEqual(beforeDismissal);
    for (const [index, species] of ['mewtwo', 'squirtle', 'eevee', 'mew'].entries()) {
      await tap(120, 292);
      await expect(page.locator('#upgradePanel')).toBeVisible();
      if (index === 1) {
        await canvas.press('m');
        await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
      }
      const before = await snapshot(page);
      // No X click: reproduce purchase directly from an open inspector.
      await page.locator('#openShopButton').tap();
      await expect(page.locator('#towerShop')).toBeVisible();
      await page.locator('[data-type="all"]').tap();
      await expectFullShop(page);
      await expect(page.locator('.shop-tower-card:disabled')).toHaveCount(0);
      if (index === 0) await captureRealArt(page, `shop-${locale}-${viewport.width}x${viewport.height}.png`);
      if (index === 1) await page.locator('[data-type="water"]').tap();
      const card = page.locator(`[data-tower="${species}"]`);
      const cost = parseInt(await card.locator('.card-price').innerText(), 10);
      await card.tap();
      await expect(page.locator('#towerShop')).toBeHidden();
      await expect(page.locator('#upgradePanel')).toBeHidden();
      await expect(canvas).toHaveAttribute('data-moving-tower', '');
      expect((await snapshot(page)).coins).toBe(before.coins);
      await tap(120, 440 + index * 80);
      const after = await snapshot(page);
      expect(after.towers).toHaveLength(before.towers.length + 1);
      expect(after.towers.at(-1)).toMatchObject({ type: species, x: 120, y: 440 + index * 80, spentCoins: cost });
      expect(after.coins).toBe(before.coins - cost);
      expect(after.towers[0]).toEqual(original);
      expect(await canvas.boundingBox()).toEqual(bounds);
    }
    expect(await page.evaluate(() => ({
      x: document.documentElement.scrollWidth - innerWidth,
      y: document.documentElement.scrollHeight - innerHeight,
    }))).toEqual({ x: 0, y: 0 });
    if (locale === 'he') await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });
}

test('all roster selection stays free even when placement is unaffordable', async ({ page }) => {
  await load(page, { coins: 1 });
  const p = await point(page, 120, 292);
  await page.touchscreen.tap(p.x, p.y);
  await expect(page.locator('[data-ability="power"]')).toBeDisabled();
  await expect(page.locator('[data-ability="power"]')).toHaveClass(/is-unaffordable/);
  await page.locator('#openShopButton').tap();
  await expectFullShop(page);
  await expect(page.locator('.shop-tower-card:disabled')).toHaveCount(0);
  await page.locator('[data-tower="mewtwo"]').tap();
  await expect(page.locator('#selectedTowerName')).toHaveText('Mewtwo');
  const before = await snapshot(page), destination = await point(page, 120, 440);
  await page.touchscreen.tap(destination.x, destination.y);
  expect(await snapshot(page)).toEqual(before);
  await expect(page.locator('#toast')).toContainText('coins');
});

test('large upgrade tiles retain prices, rank progress, affordability and evolution purchases', async ({ page }) => {
  await load(page, { towers: [{ ...tower, skills: { power: 0, range: 0, special: 0 } }] });
  const p = await point(page, 120, 292);
  await page.mouse.click(p.x, p.y);
  const evolution = page.locator('[data-ability="evolution"]');
  await expect(evolution).toBeDisabled();
  await expect(evolution).toHaveClass(/is-locked/);
  await expect(evolution.locator('.ability-ranks i')).toHaveCount(3);
  await expect(evolution.locator('.ability-ranks .is-filled')).toHaveCount(0);
  await expect(evolution.locator('.ability-state svg')).toBeVisible();
  await expect(evolution.locator('.ability-price')).toHaveText('70 ◈');
  for (const ability of ['power', 'range', 'special'] as const) {
    const tile = page.locator(`[data-ability="${ability}"]`);
    await expect(tile).toHaveClass(/is-affordable/);
    const cost = parseInt(await tile.locator('.ability-price').innerText(), 10), before = await snapshot(page);
    await tile.tap();
    const after = await snapshot(page);
    expect(after.coins).toBe(before.coins - cost);
    expect(after.towers[0].skills[ability]).toBe(1);
    await expect(tile.locator('.ability-ranks .is-filled')).toHaveCount(1);
  }
  await expect(evolution).toBeEnabled();
  await expect(evolution.locator('.ability-icon img')).toHaveAttribute('src', /\/26\.png/);
  const before = await snapshot(page), cost = parseInt(await evolution.locator('.ability-price').innerText(), 10);
  await evolution.tap();
  expect((await snapshot(page)).coins).toBe(before.coins - cost);
  expect((await snapshot(page)).towers[0].evolutionStage).toBe(1);
  await expect(page.locator('#upgradeName')).toHaveText('Raichu');
  // The next evolution is locked: its six prerequisite dots show three earned
  // purchases, while the actual evolution stage has independently become one.
  await expect(evolution.locator('.ability-ranks i')).toHaveCount(6);
  await expect(evolution.locator('.ability-ranks .is-filled')).toHaveCount(3);
  await expect(evolution).toHaveClass(/is-locked/);
  await expect(evolution.locator('.ability-price')).toHaveText('145 ◈');
  const power = page.locator('[data-ability="power"]');
  await power.tap();
  await power.tap();
  await expect(power).toBeDisabled();
  await expect(power).toHaveClass(/is-maxed/);
  await expect(power.locator('.ability-price')).toHaveText('✓');
  await expect(power.locator('.ability-state svg')).toBeVisible();
  await expect(power.locator('.ability-ranks .is-filled')).toHaveCount(3);
});

for (const reduced of [false, true]) {
  test(`picture-first upgrades ${reduced ? 'respect reduced motion' : 'have gentle aura, sparks and purchase feedback'}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await load(page);
    const p = await point(page, 120, 292);
    await page.touchscreen.tap(p.x, p.y);
    const power = page.locator('[data-ability="power"]'), icon = power.locator('.ability-icon');
    expect(await icon.evaluate(element => ({
      aura: getComputedStyle(element, '::before').animationName,
      sparks: getComputedStyle(element, '::after').animationName,
      pointer: getComputedStyle(element, '::after').pointerEvents,
    }))).toEqual({
      aura: reduced ? 'none' : 'tile-aura',
      sparks: reduced ? 'none' : 'tile-sparks',
      pointer: 'none',
    });
    expect(await page.locator('.hero-portrait').evaluate(element =>
      getComputedStyle(element, '::before').animationName)).toBe(reduced ? 'none' : 'tile-aura');
    if (!reduced) {
      expect(await icon.evaluate(element => getComputedStyle(element, '::before').animationDuration)).toBe('4s');
      expect(await icon.evaluate(element => getComputedStyle(element, '::after').animationDuration)).toBe('18s');
    }
    const before = await snapshot(page), cost = parseInt(await power.locator('.ability-price').innerText(), 10);
    await power.tap();
    expect((await snapshot(page)).coins).toBe(before.coins - cost);
    expect(await power.evaluate(element => getComputedStyle(element).animationName))
      .toBe(reduced ? 'none' : 'tile-celebrate');
    // Both motion preferences retain purchases, rank dots and meaningful labels.
    await expect(power.locator('.ability-ranks .is-filled')).toHaveCount(2);
    await expect(power).toHaveAttribute('aria-label', /Power/);
    await expect(power.locator('strong')).toBeHidden();
    await expect(power.locator('.ability-detail')).toBeHidden();
  });
}

test('keyboard M, WASD, arrows and Enter relocate without a Move button or coins', async ({ page }) => {
  await load(page);
  const p = await point(page, 120, 292), canvas = page.locator('canvas');
  await page.mouse.click(p.x, p.y);
  await canvas.press('m');
  await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
  await canvas.press('s');
  await canvas.press('ArrowDown');
  await canvas.press('Enter');
  expect((await snapshot(page)).towers[0]).toMatchObject({ x: 120, y: 520, spentCoins: 240 });
  expect((await snapshot(page)).coins).toBe(4000);
  await expect(canvas).toHaveAttribute('data-moving-tower', '');
});

for (const touch of [false, true]) for (const locale of ['en', 'he']) {
  test(`${touch ? 'native touch' : 'mouse'} ${locale}: upper-body hold tolerates drift, lifts and drops freely at zoom`, async ({ page }) => {
    await load(page, { locale, zoom: true });
    const canvas = page.locator('canvas'), bounds = await canvas.boundingBox(), before = await snapshot(page);
    expect(await page.evaluate(() => (window as unknown as AuditWindow).__td.hit(120, 292)?.type)).toBe('pikachu');
    const origin = await point(page, 120, 292), drop = await point(page, 120, 440 - 68);
    const cdp = await page.context().newCDPSession(page);
    if (touch) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] });
    else { await page.mouse.move(origin.x, origin.y); await page.mouse.down(); }
    // Reproduce child finger drift BEFORE lift rather than waiting motionless.
    await page.waitForTimeout(160);
    const drift = { x: origin.x + 13, y: origin.y + 9 };
    if (touch) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [drift] });
    else await page.mouse.move(drift.x, drift.y);
    await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
    expect(await canvas.boundingBox()).toEqual(bounds);
    if (touch) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [drop] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else { await page.mouse.move(drop.x, drop.y, { steps: 4 }); await page.mouse.up(); }
    const after = await snapshot(page);
    expect(after.towers[0]).toMatchObject({ x: 120, y: 440, spentCoins: 240 });
    expect(after.coins).toBe(before.coins);
    expect(after.camera).toEqual(before.camera);
    expect(after.paused).toBe(false);
    await expect(canvas).toHaveAttribute('data-moving-tower', '');
    await cdp.detach();
  });
}

test('invalid occupied/path drops and browser cancellation safely keep investment and original position', async ({ page }) => {
  await load(page, { towers: [tower, { ...tower, type: 'squirtle', y: 440 }] });
  const cdp = await page.context().newCDPSession(page);
  const canvas = page.locator('canvas');
  for (const destination of [{ x: 120, y: 440 }, { x: 280, y: 280 }]) {
    const origin = await point(page, 120, 292), drop = await point(page, destination.x, destination.y - 68);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] });
    await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [drop] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect((await snapshot(page)).towers[0]).toMatchObject({ x: 120, y: 360 });
    expect((await snapshot(page)).coins).toBe(4000);
    await expect(canvas).toHaveAttribute('data-moving-tower', '');
    await expect(page.locator('#toast')).toContainText('empty');
  }
  const origin = await point(page, 120, 292);
  for (const cancel of ['touchCancel', 'Escape']) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] });
    await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
    if (cancel === 'Escape') {
      await canvas.press('Escape');
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    expect((await snapshot(page)).towers[0]).toMatchObject({ x: 120, y: 360 });
    expect((await snapshot(page)).paused).toBe(false);
    await expect(canvas).toHaveAttribute('data-moving-tower', '');
  }
  await page.touchscreen.tap(origin.x, origin.y);
  await expect(page.locator('#upgradePanel')).toBeVisible();
  await expect(canvas).toHaveAttribute('data-moving-tower', '');
  await cdp.detach();
});

test('old invalid-route saves receive full investment, a localized explanation and a compatible checkpoint', async ({ page }) => {
  await load(page, { locale: 'es', towers: [{ ...tower, x: 280, y: 280, spentCoins: 777 }, tower] });
  const state = await snapshot(page);
  expect(state.towers).toHaveLength(1);
  expect(state.coins).toBe(4777);
  await expect(page.locator('#toast')).toContainText('777');
  await expect(page.locator('#toast')).toContainText('inversión');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), runKey);
  expect(saved.version).toBe(1);
  expect(saved.routeVersion).toBe(2);
  expect(saved.towers[0].spentCoins).toBe(240);
});

for (const mapId of ['classic', 'coast', 'volcano', 'switchback', 'spiral']) {
  test(`${mapId}: live enemies, fast bosses and placement share the painted route`, async ({ page }) => {
    await load(page, { towers: [] });
    // Use the normal menu selection and spawning logic, not synthetic enemies.
    await page.reload();
    await page.locator(`button[data-map="${mapId}"]`).click();
    await page.locator('#startButton').click();
    const report = await page.evaluate(() => {
      const w = window as unknown as AuditWindow, audit = w.__td, state = audit.state(), route = audit.route();
      state.wave = 4; state.lives = 99;
      audit.prepare(); audit.begin(); audit.spawn();
      state.bossShieldAvailable = false;
      const enemy = state.enemies[0]; enemy.speed = 1750;
      let maxError = 0, samples = 0;
      for (let i = 0; i < 600 && !enemy.escaped; i++) {
        audit.advanceEnemies(0.017);
        const error = w.PokemonTDData.routeDistance(route, enemy.x, enemy.y);
        maxError = Math.max(error, maxError);
        if (audit.blocked(enemy.x, enemy.y) > 0.000001) throw new Error('Placement route diverged.');
        samples++;
      }
      audit.draw();
      return { maxError, samples, boss: enemy.boss, escaped: enemy.escaped };
    });
    expect(report.boss).toBe(true);
    expect(report.maxError).toBeLessThan(0.000001);
    expect(report.samples).toBeGreaterThan(30);
    expect(report.escaped).toBe(true);
  });
}

      for (const mode of ['inspector', 'shop purchase', 'keyboard move', 'invalid lifted drop', 'active hold', 'active lift', 'X']) {
        test(`${mode}: right-click/X fully disarms selection without mutation or pause, then purchase works`, async ({ page }) => {
          await load(page);
          const canvas = page.locator('canvas'), origin = await point(page, 120, 292);
          await page.mouse.click(origin.x, origin.y);
          await expect(page.locator('#upgradePanel')).toBeVisible();
          if (mode === 'shop purchase') {
            await page.locator('#openShopButton').click();
            await page.locator('[data-tower="mewtwo"]').click();
          } else if (mode === 'keyboard move') {
            await canvas.press('m');
          } else if (mode.includes('hold') || mode.includes('lift') || mode === 'invalid lifted drop') {
            await page.mouse.move(origin.x, origin.y);
            await page.mouse.down();
            if (mode !== 'active hold') await expect(canvas).not.toHaveAttribute('data-moving-tower', '');
            if (mode === 'invalid lifted drop') {
              const road = await point(page, 280, 212);
              await page.mouse.move(road.x, road.y, { steps: 3 });
              await page.mouse.up();
              await expect(canvas).toHaveAttribute('data-moving-tower', '');
            }
          }
          const before = await snapshot(page);
          if (mode === 'X') await page.locator('#closeUpgradeButton').click();
          else {
            const empty = await point(page, 120, 520);
            await page.mouse.click(empty.x, empty.y, { button: 'right' });
          }
          await page.mouse.up();
          // A pending hold must not resurrect selection after cancellation.
          await page.waitForTimeout(550);
          await expect(page.locator('#upgradePanel')).toBeHidden();
          await expect(canvas).toHaveAttribute('data-moving-tower', '');
          await expect(canvas).toHaveAttribute('data-build-selection', 'false');
          await expect(page.locator('.selected-pokemon-card')).toHaveClass(/is-inactive/);
          expect(await page.evaluate(() => {
            const state = (window as unknown as AuditWindow).__td.state();
            return [state.selectedTowerId, state.movingTowerId, state.buildSelectionActive];
          })).toEqual([null, null, false]);
          // Mouse and keyboard clicks cannot spend while the remembered species is idle.
          const empty = await point(page, 120, 520);
          await page.mouse.click(empty.x, empty.y);
          await canvas.press('Enter');
          expect(await snapshot(page)).toEqual(before);
          await page.locator('#openShopButton').click();
          await expect(page.locator('.shop-tower-card[aria-pressed="true"]')).toHaveCount(0);
          await page.locator('[data-tower="squirtle"]').click();
          await expect(canvas).toHaveAttribute('data-build-selection', 'true');
          await page.mouse.click(empty.x, empty.y);
          const after = await snapshot(page);
          expect(after.towers).toHaveLength(before.towers.length + 1);
          expect(after.towers[0]).toEqual(before.towers[0]);
          expect(after.towers.at(-1)).toMatchObject({ type: 'squirtle', x: 120, y: 520 });
          expect(after.coins).toBe(before.coins - after.towers.at(-1)!.spentCoins);
          expect(after.paused).toBe(false);
          const menus = await page.evaluate(() => {
            const canvas = document.querySelector('canvas')!;
            const field = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
            const outside = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
            canvas.dispatchEvent(field);
            document.querySelector('.title-bar')!.dispatchEvent(outside);
            return [field.defaultPrevented, outside.defaultPrevented];
          });
          expect(menus).toEqual([true, false]);
        });
      }

      for (const locale of ['en', 'he']) for (const viewport of [
        { width: 2000, height: 693 }, { width: 1920, height: 1080 },
        { width: 1024, height: 768 }, { width: 768, height: 1024 },
      ]) {
        test(`${locale} ${viewport.width}x${viewport.height}: cohesive cockpit dimensions and real-art states`, async ({ page }) => {
          await page.setViewportSize(viewport);
          await load(page, { locale });
          await page.reload();
          await captureRealArt(page, `cockpit-start-${locale}-${viewport.width}x${viewport.height}.png`);
          expect((await page.locator('#startPanel').boundingBox())!.width).toBeLessThanOrEqual(760);
          await page.locator('#continueButton').click();
          const canvas = page.locator('canvas'), before = await canvas.boundingBox();
          expect(Math.abs(before!.width / before!.height - 16 / 9)).toBeLessThan(.01);
          const header = (await page.locator('.title-bar').boundingBox())!;
          const deck = (await page.locator('.command-deck').boundingBox())!;
          expect(header.width).toBeLessThanOrEqual(968);
          expect(deck.width).toBe(header.width);
          expect(Math.abs(header.x - deck.x)).toBeLessThan(1);
          expect(deck.height).toBe(168);
          await expect(page.locator('#zoomInButton, #zoomOutButton, #zoomValue, .utility-row')).toHaveCount(0);
          await expect(page.locator('.title-actions #powerButton')).toHaveCount(0);
          const power = (await page.locator('#powerButton').boundingBox())!;
          expect([power.width, power.height]).toEqual([96, 96]);
          expect(power.y).toBeGreaterThanOrEqual(deck.y);
          expect(power.y + power.height).toBeLessThanOrEqual(deck.y + deck.height);
          const status = (await page.locator('.battle-status').boundingBox())!;
          const controls = (await page.locator('.title-actions').boundingBox())!;
          const gap = locale === 'he' ? status.x - controls.x - controls.width : controls.x - status.x - status.width;
          expect(gap).toBeGreaterThanOrEqual(0);
          expect(gap).toBeLessThanOrEqual(16);
          for (const chip of await page.locator('.stat').all()) {
            const size = (await chip.boundingBox())!;
            expect(size.height).toBeGreaterThanOrEqual(56);
            expect(size.width).toBeLessThan(160);
            await expect(chip).toHaveAttribute('aria-label', /.+: \d+/);
            await expect(chip).toHaveAttribute('title', /.+: \d+/);
            expect((await chip.locator('svg').boundingBox())!.width).toBeGreaterThanOrEqual(34);
          }
          if (viewport.width > 1200) {
            expect(before!.height).toBeGreaterThan(viewport.height * .5);
            expect((await page.locator('.game-shell').boundingBox())!.width).toBeLessThanOrEqual(1200);
            expect(await page.locator('.game-stage').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
          }
          await page.evaluate(() => {
            const audit = (window as unknown as AuditWindow).__td;
            audit.state().power = 63;
            audit.hud(); audit.begin(); audit.spawn(); audit.draw();
          });
          await expect(page.locator('#powerLabel')).toHaveText('63%');
          await expect(page.locator('#powerButton')).toBeDisabled();
          await captureRealArt(page, `cockpit-battle-${locale}-${viewport.width}x${viewport.height}.png`);
          const origin = await point(page, 120, 292);
          await page.mouse.click(origin.x, origin.y);
          await expect(page.locator('.hero-actions #closeUpgradeButton')).toBeVisible();
          await captureRealArt(page, `cockpit-inspector-${locale}-${viewport.width}x${viewport.height}.png`);
          await page.locator('#openShopButton').click();
          await expectFullShop(page);
          expect((await page.locator('.tower-shop-panel').boundingBox())!.width).toBeLessThanOrEqual(840);
          await captureRealArt(page, `cockpit-shop-${locale}-${viewport.width}x${viewport.height}.png`);
          await page.locator('#closeShopButton').click();
          expect(await canvas.boundingBox()).toEqual(before);
          expect(await page.evaluate(() => [
            document.documentElement.scrollWidth - innerWidth, document.documentElement.scrollHeight - innerHeight,
          ])).toEqual([0, 0]);
        });
      }

for (const reduced of [false, true]) {
      test(`96px ready power: ${reduced ? 'reduced motion' : 'animated aura'} and existing activation`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
        await load(page);
        await page.evaluate(() => {
          const audit = (window as unknown as AuditWindow).__td;
          audit.begin(); audit.spawn(); audit.state().power = 100; audit.hud();
        });
        const power = page.locator('#powerButton');
        await expect(power).toBeEnabled();
        await expect(power).toHaveClass(/is-ready/);
        await expect(page.locator('#powerLabel')).toHaveText('Ready!');
        expect(await power.evaluate(el => getComputedStyle(el, '::before').animationName)).toBe(reduced ? 'none' : 'power-aura');
        await captureRealArt(page, `cockpit-power-ready-${reduced ? 'reduced' : 'animated'}.png`);
        const before = await snapshot(page);
        await power.click();
        await expect(page.locator('#powerLabel')).toHaveText('0%');
        await expect(power).toBeDisabled();
        expect(await page.evaluate(() => (window as unknown as AuditWindow).__td.state().power)).toBe(0);
        // Power may award coins for a defeated enemy, but never mutates the team or pauses.
        expect((await snapshot(page)).towers).toEqual(before.towers);
        expect((await snapshot(page)).paused).toBe(false);
      });
}

test('cancelled build selection survives a compatible saved-run reload', async ({ page }) => {
  await load(page);
  await page.locator('canvas').click({ button: 'right' });
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), runKey);
  expect(saved.version).toBe(1);
  expect(saved.selectedTower).toBe('pikachu');
  expect(saved.buildSelectionActive).toBe(false);
  await page.reload();
  await page.locator('#continueButton').click();
  await expect(page.locator('canvas')).toHaveAttribute('data-build-selection', 'false');
  await page.locator('canvas').press('Enter');
  expect((await snapshot(page)).coins).toBe(saved.coins);
  expect((await snapshot(page)).towers).toHaveLength(saved.towers.length);
});
