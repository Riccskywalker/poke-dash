import { expect, test } from '@playwright/test';

test('shows RareBit brand and starts with Space', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('RareBit Dash');
  await expect(page.getByText('RAREBIT ARCADE')).toBeVisible();
  await expect(page.locator('img[alt="RareBit"]')).toBeVisible();
  await expect(page.getByText(/Pokémon|Mew|Pikachu|Bulbasaur|Charmander/)).toHaveCount(0);
  const canvas = page.getByTestId('game-canvas');
  await expect(canvas).toHaveAttribute('data-phase', 'idle');
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-phase', 'running');
  await expect(canvas).toHaveAttribute('data-player-state', 'jumping');
});

test('touch control starts and jumps', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The button is only visible in the touch layout');
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Jump' });
  await expect(button).toBeVisible();
  await button.dispatchEvent('pointerdown');
  await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-jumps', '1');
});

test('game over and retry are available', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByTestId('game-canvas');
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-phase', 'gameover', { timeout: 8_000 });
  await expect(page.getByText('Crashed. Try the level again.')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-phase', 'running');
});

test('completes deterministically through the guarded test hook', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => (window as Window & { __RAREBIT_TEST_COMPLETE__?: () => void }).__RAREBIT_TEST_COMPLETE__?.());
  await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-phase', 'complete');
  await expect(page.getByText('Level complete. Excellent run.')).toBeVisible();
  await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-phase', 'complete');
});

test('uses the official RareBit favicon and no legacy favicon reference', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/rarebit-icon.svg');
  await expect(page.locator('html')).not.toContainText('favicon.svg');
});
