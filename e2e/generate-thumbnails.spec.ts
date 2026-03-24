import { test } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Import game slugs at test time by reading the registry source
// We avoid importing TS directly — instead, read all slug dirs from the filesystem
const GAMES_DIR = path.join(__dirname, '..', 'src', 'features', 'games');
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'public', 'images', 'games', 'screenshots');

function getGameSlugs(): string[] {
  const targetSlug = process.env.GAME_SLUG;
  if (targetSlug) return [targetSlug];

  // Read slug directories that contain a game component (have a .tsx file with "Game" in the name)
  const dirs = fs.readdirSync(GAMES_DIR, { withFileTypes: true });
  return dirs
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => {
      // Skip shared/registry/common directories
      if (['shared', 'registry', 'common'].includes(name)) return false;
      const dirPath = path.join(GAMES_DIR, name);
      const files = fs.readdirSync(dirPath);
      return files.some((f) => f.endsWith('Game.tsx') || f === 'game.config.ts');
    });
}

// Ensure screenshots directory exists
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const slugs = getGameSlugs();

for (const slug of slugs) {
  test(`generate thumbnail for ${slug}`, async ({ page }) => {
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${slug}.png`);

    // Navigate to the game page (English locale)
    await page.goto(`/en/games/${slug}`, { waitUntil: 'networkidle' });

    // Wait for the main game area to be visible
    await page.waitForTimeout(2000);

    // Try to click a start/play button if the game shows an idle overlay
    const startButton = page.locator('button:has-text("Start"), button:has-text("Click to Start"), button:has-text("Play"), button:has-text("Tap to Start")').first();
    if (await startButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(1500);
    }

    // Take the screenshot
    await page.screenshot({
      path: screenshotPath,
      type: 'png',
    });

    console.log(`Screenshot saved: ${screenshotPath}`);
  });
}
