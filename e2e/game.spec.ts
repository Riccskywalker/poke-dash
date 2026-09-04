import { expect, test } from '@playwright/test';

test('uses one Pokémon and starts with space', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Mew Runner', exact: true })).toBeVisible();
  await expect(page.getByText(/Mew, one endless road/)).toBeVisible();
  await expect(page.getByText('Pikachu')).toHaveCount(0);
  await expect(page.getByText('Bulbasaur')).toHaveCount(0);
  await expect(page.getByText('Charmander')).toHaveCount(0);

  const canvas = page.getByTestId('game-canvas');
  await expect(canvas).toHaveAttribute('data-phase', 'idle');
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-phase', 'running');
  await expect(canvas).toHaveAttribute('data-player-state', 'jumping');
});

test('touch control starts the game and jumps', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The button is only visible in the touch layout');
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Jump' });
  await expect(button).toBeVisible();
  await button.dispatchEvent('pointerdown');
  await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-jumps', '1');
});

test('records game over and allows retrying', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByTestId('game-canvas');
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-phase', 'gameover', { timeout: 8_000 });
  await expect(page.getByText('No runs yet')).toHaveCount(0);
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-phase', 'running');
  await expect(canvas).toHaveAttribute('data-player-state', 'jumping');
});
