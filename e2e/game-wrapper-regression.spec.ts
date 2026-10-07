import { test, expect } from '@playwright/test';

test('existing canvas games retain their default theme, help and sound preference', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('legacy-sound-seeded')) return;
    sessionStorage.setItem('legacy-sound-seeded', 'true');
    localStorage.setItem('mini-games-sound-muted', 'true');
  });
  await page.goto('/en/games/snake');
  const help = page.getByRole('button', { name: 'Instructions', exact: true });
  await expect(help).toBeVisible();
  const color = await page.locator('header').evaluate(element => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Missing color-normalization canvas');
    context.fillStyle = getComputedStyle(element).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
  });
  for (const [index, channel] of [247, 148, 29].entries()) expect(Math.abs(color[index] - channel)).toBeLessThanOrEqual(1);
  await help.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'How to Play', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(help).toBeFocused();
  await page.getByRole('button', { name: 'Sound Off', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sound On', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('mini-games-sound-muted'))).toBe('false');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sound On', exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
});

test('existing board games keep their initial help, focus handling and board', async ({ page }) => {
  await page.goto('/en/games/checkers');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('[aria-label="Checkers board"]')).toBeVisible();
  await page.getByRole('button', { name: 'Instructions', exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Controls', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
