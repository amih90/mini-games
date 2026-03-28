import { test, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

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

async function tryClick(page: Page, selector: string, timeout = 800): Promise<boolean> {
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

    await page.goto(`/en/games/${slug}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

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
        (await tryClick(page, 'button:has-text("Play")')) ||
        (await tryClick(page, 'button:has-text("Start")')) ||
        (await tryClick(page, 'button:has-text("Click to Start")')) ||
        (await tryClick(page, 'button:has-text("Tap to Start")'));
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
    const canvas = page.locator('canvas').first();
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
