import { test, Page, Frame } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { mansionThumbnailFixture, readyMansion, seedMansion } from './princess-mansion-fixtures';

const GAMES_DIR = path.join(__dirname, '..', 'src', 'features', 'games');
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'public', 'images', 'games', 'screenshots');

// Games that go directly to 'playing' when difficulty is clicked (no idle step)
const GAMES_DIRECT_TO_PLAYING = new Set([
  'chicken-invaders',
  'army-runner',
  'sprint-race',
  'nascar-cars',
]);

// Games that need a canvas click (not a button) to transition from idle→playing
// NOTE: only games whose canvas element itself has onClick={...} should be listed here
const GAMES_CANVAS_CLICK_TO_START = new Set([
  'flappy-bird',  // canvas has onClick={jump}
  'ping-pong',    // canvas has onClick handlers
  'brick-breaker',// canvas has onClick handlers
  'dino-run',     // canvas has onClick handlers
  // tetris uses an overlay *button* for startGame, NOT a canvas click
]);

// Extra wait after starting (ms) — games with slow render startup need more time
const EXTRA_PLAY_WAIT: Record<string, number> = {
  'chicken-invaders': 4000,
  'army-runner': 4000,
  'tower-defense': 3000,
  'solar-system-3d': 4000,
  'number-tower-3d': 3000,
};

function getGameSlugs(): string[] {
  const targetSlug = process.env.GAME_SLUG;
  if (targetSlug) return [targetSlug];

  const dirs = fs.readdirSync(GAMES_DIR, { withFileTypes: true });
  return dirs
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => {
      if (['shared', 'registry', 'common'].includes(name)) return false;
      const dirPath = path.join(GAMES_DIR, name);
      const files = fs.readdirSync(dirPath);
      return files.some((f) => f.endsWith('Game.tsx') || f === 'game.config.ts');
    });
}

async function tryClick(page: Page | Frame, selector: string, timeout = 800): Promise<boolean> {
  try {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout })) {
      await el.click({ force: true });
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

async function clickCanvas(page: Page): Promise<boolean> {
  try {
    const canvas = page.locator('canvas').first();
    if (await canvas.isVisible({ timeout: 1000 })) {
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        return true;
      }
    }
  } catch { /* ignore */ }
  return false;
}

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const slugs = getGameSlugs();

for (const slug of slugs) {
  test(`generate thumbnail for ${slug}`, async ({ page }) => {
    // Playwright default viewport is 1280×720 — game pages should fill nicely
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${slug}.png`);

    if (slug === 'princess-mansion') {
      await page.setViewportSize({ width: 1280, height: 800 });
      await seedMansion(page, mansionThumbnailFixture());
      await page.addInitScript(() => Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await readyMansion(page);
      await page.locator('canvas').screenshot({ path: screenshotPath, type: 'png' });
      console.log(`Screenshot saved: ${screenshotPath}`);
      return;
    }

    if (slug === 'pokemon-tower-defense') {
      test.setTimeout(90_000);
      await page.setViewportSize({ width: 1280, height: 960 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const runtimeErrors: string[] = [];
      page.on('pageerror', (error) => runtimeErrors.push(error.message));

      // Seed the existing version-1 checkpoint before either document loads.
      // These cells are clear of the path and terrain; late-path legendaries
      // leave room for a visible mixed wave near the smaller starter team.
      const defenders = [
        { type: 'pikachu', x: 120, y: 280, evolutionStage: 0 },
        { type: 'cyndaquil', x: 360, y: 200, evolutionStage: 1 },
        { type: 'bulbasaur', x: 360, y: 520, evolutionStage: 1 },
        { type: 'totodile', x: 600, y: 440, evolutionStage: 1 },
        { type: 'eevee', x: 840, y: 360, evolutionStage: 1 },
        { type: 'mewtwo', x: 1000, y: 280, evolutionStage: 0 },
        { type: 'dragonite', x: 1000, y: 600, evolutionStage: 0 },
        { type: 'lugia', x: 1240, y: 520, evolutionStage: 0 },
        { type: 'arceus', x: 1400, y: 440, evolutionStage: 0 },
      ];
      const profile = {
        version: 1,
        bestWave: 7,
        bossStars: 1,
        discoveries: defenders.map((tower) => tower.type),
        soundEnabled: false,
        gameSpeed: 1,
        tutorialComplete: true,
        difficulty: 'medium',
        mapId: 'classic',
      };
      const run = {
        version: 1,
        savedAt: 0,
        difficulty: 'medium',
        mapId: 'classic',
        camera: { zoom: 1, x: 0, y: 0 },
        coins: 360,
        lives: 10,
        wave: 6,
        power: 60,
        bossesDefeated: 1,
        finalEvolutionUnlocked: true,
        selectedTower: 'mewtwo',
        nextEnemyFamilyId: 'pidgey',
        towers: defenders.map((tower) => ({
          ...tower,
          skills: { power: 1, range: 1, special: 1 },
          spentCoins: 400,
          eeveeEvolution: tower.type === 'eevee' ? 'sylveon' : null,
        })),
      };
      await page.addInitScript(({ profile, run }) => {
        // Install for every new document, before storage access. The iframe's
        // initial about:blank document does not yet have its final pathname.
        const NativeImage = window.Image;
        const spriteImages: HTMLImageElement[] = [];
        (window as Window & { __pokemonThumbnailImages?: HTMLImageElement[] })
          .__pokemonThumbnailImages = spriteImages;
        const TrackedImage = function (...args: ConstructorParameters<typeof Image>) {
          const image = new NativeImage(...args);
          spriteImages.push(image);
          return image;
        };
        TrackedImage.prototype = HTMLImageElement.prototype;
        window.Image = TrackedImage as unknown as typeof Image;

        let seed = 1337;
        Math.random = () => {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          return seed / 4294967296;
        };

        // Root and iframe share storage; either committed document can seed
        // the checkpoint even if the initial blank document has no access.
        try {
          localStorage.setItem('mini-games:pokemon-tower-defense:profile', JSON.stringify(profile));
          localStorage.setItem('mini-games:pokemon-tower-defense:run', JSON.stringify(run));
        } catch { /* Storage is unavailable in the initial blank document. */ }
      }, { profile, run });

      await page.goto('/en/games/pokemon-tower-defense', { waitUntil: 'networkidle' });
      await page.getByRole('dialog').waitFor();
      const embedded = page.frames().find((frame) =>
        frame.url().includes('/games/pokemon-tower-defense/index.html'),
      );
      if (!embedded) throw new Error('Pokémon Tower Defense iframe did not load');

      const waitForSprites = async (expectedIds: number[] = []) => {
        await embedded.waitForFunction((expected) => {
          const tracked =
            (window as Window & { __pokemonThumbnailImages?: HTMLImageElement[] })
              .__pokemonThumbnailImages ?? [];
          const sprites = tracked.filter((image) => image.src.includes('/sprites/pokemon/'));
          const loaded = (image: HTMLImageElement) => image.complete && image.naturalWidth > 0;
          const unavailable = sprites.filter((image) => image.complete && !image.naturalWidth);
          if (unavailable.length) {
            throw new Error(
              `Real Pokémon artwork failed to load: ${unavailable.map((image) => image.src).join(', ')}`,
            );
          }
          const loadedIds = new Set(
            sprites.filter(loaded).map((image) =>
              Number(image.src.match(/\/(\d+)\.(?:gif|png)(?:\?|$)/)?.[1]),
            ),
          );
          return (
            sprites.length > 0 &&
            sprites.every(loaded) &&
            expected.every((id) => loadedIds.has(id))
          );
        }, expectedIds, { timeout: 30_000, polling: 100 });
        await embedded.evaluate(async () => {
          const tracked =
            (window as Window & { __pokemonThumbnailImages?: HTMLImageElement[] })
              .__pokemonThumbnailImages ?? [];
          const visibleImages = [...document.images].filter((image) =>
            image.src.includes('/sprites/pokemon/') && image.getClientRects().length > 0,
          );
          await Promise.all(
            [...new Set([...tracked, ...visibleImages])]
              .filter((image) => image.src.includes('/sprites/pokemon/'))
              .map((image) => image.decode()),
          );
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
        });
      };

      // Restore underneath the real instructions modal: its onLoad pause sync
      // keeps the wave timer still until all placed/evolved sprites are ready.
      await embedded.locator('button[data-difficulty="medium"]').evaluate((button) =>
        (button as HTMLButtonElement).click(),
      );
      await embedded.locator('#continueButton').evaluate((button) =>
        (button as HTMLButtonElement).click(),
      );
      await embedded.locator('#startPanel').waitFor({ state: 'hidden' });
      await waitForSprites([25, 156, 2, 159, 700, 150, 149, 249, 493]);
      await page.getByRole('button', { name: /Got it.*Let.s Play/ }).click();
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      await tryClick(embedded, '#tutorialSkip');
      await embedded.waitForFunction(
        () => Number(document.getElementById('waveValue')?.textContent) >= 7,
        null,
        { timeout: 10_000 },
      );
      await page.waitForTimeout(5500);
      // Freeze the activity snapshot with the existing portal protocol while
      // any newly requested mixed-wave sprites finish decoding.
      await page.evaluate(() => {
        document.querySelector<HTMLIFrameElement>(
          'iframe[src*="/games/pokemon-tower-defense/index.html"]',
        )?.contentWindow?.postMessage(
          {
            source: 'pokemon-tower-defense-portal',
            type: 'instructions-state',
            open: true,
          },
          window.location.origin,
        );
      });
      await waitForSprites();
      if (runtimeErrors.length) throw new Error(runtimeErrors.join('\n'));
      await page.addStyleTag({ content: 'nextjs-portal { visibility: hidden !important; }' });
      // Include the tablet cockpit as well as the battlefield: the thumbnail
      // should show where children buy, place and upgrade without scrolling.
      await embedded.locator('.game-shell').screenshot({
        path: screenshotPath, type: 'png',
        style: 'nextjs-portal { visibility: hidden !important; }',
      });
      console.log(`Screenshot saved: ${screenshotPath}`);
      return;
    }

    await page.goto(`/en/games/${slug}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Standalone games can be embedded in a same-origin iframe. Interact with
    // their document directly so the thumbnail still captures the game canvas.
    const embeddedGame =
      slug === 'pokemon-tower-defense'
        ? page.frames().find((frame) =>
            frame.url().includes('/games/pokemon-tower-defense/index.html')
          )
        : undefined;
    const gamePage: Page | Frame = embeddedGame ?? page;

    // 1. Dismiss instruction modals (auto-shown on first load for some games)
    await tryClick(page, 'button:has-text("Got it")');
    await tryClick(page, 'button:has-text("Let\'s Play")');
    await page.waitForTimeout(300);

    // 2. Click difficulty (prefer Medium → Easy) to get past the menu screen
    const clickedDifficulty =
      (await tryClick(page, 'button:has-text("Medium")')) ||
      (await tryClick(page, 'button:has-text("🟡 Medium")')) ||
      (await tryClick(page, 'button:has-text("Easy")')) ||
      (await tryClick(page, 'button:has-text("🟢 Easy")'));

    if (clickedDifficulty) {
      // Wait for state transition to complete
      await page.waitForTimeout(1000);
    }

    // 3. Start gameplay
    //    - Canvas-click games: click the canvas to enter playing
    //    - Direct games: already in playing after difficulty click — just wait
    //    - Other games: try common button labels
    if (GAMES_CANVAS_CLICK_TO_START.has(slug)) {
      await clickCanvas(page);
      await page.waitForTimeout(2800);
    } else if (!GAMES_DIRECT_TO_PLAYING.has(slug)) {
      // Try common start-button labels (partial text match via :has-text)
      const started =
        (await tryClick(gamePage, '#startButton')) ||
        (await tryClick(gamePage, 'button:has-text("Play")')) ||
        (await tryClick(gamePage, 'button:has-text("Start")')) ||
        (await tryClick(gamePage, 'button:has-text("Click to Start")')) ||
        (await tryClick(gamePage, 'button:has-text("Tap to Start")'));
      if (started) {
        await page.waitForTimeout(2800);
      } else {
        await page.waitForTimeout(1200);
      }
    } else {
      // Direct-to-playing: just let it run
      await page.waitForTimeout(EXTRA_PLAY_WAIT[slug] ?? 2800);
    }

    // Apply extra wait for slow-rendering games
    if (EXTRA_PLAY_WAIT[slug] && !GAMES_DIRECT_TO_PLAYING.has(slug)) {
      await page.waitForTimeout(EXTRA_PLAY_WAIT[slug] - 2800);
    }

    // 4. Take the screenshot — prefer the canvas element for games that use one,
    //    so we get a clean crop of the actual game content.
    const canvas = gamePage.locator('canvas').first();
    const canvasVisible = await canvas.isVisible({ timeout: 500 }).catch(() => false);

    if (canvasVisible) {
      await canvas.screenshot({ path: screenshotPath, type: 'png' });
    } else {
      // DOM-based games (memory cards, chess, etc.) — full-page viewport
      await page.screenshot({ path: screenshotPath, type: 'png' });
    }

    console.log(`✅ Screenshot saved: ${screenshotPath}`);
  });
}
