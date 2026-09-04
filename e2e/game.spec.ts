import { expect, test } from '@playwright/test';

test('usa un solo Pokémon e parte con spazio', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pika Runner', exact: true })).toBeVisible();
  await expect(page.getByText(/Pikachu, una strada infinita/)).toBeVisible();
  await expect(page.getByText('Bulbasaur')).toHaveCount(0);
  await expect(page.getByText('Charmander')).toHaveCount(0);

  const canvas = page.getByTestId('game-canvas');
  await expect(canvas).toHaveAttribute('data-phase', 'idle');
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-phase', 'running');
  await expect(canvas).toHaveAttribute('data-player-state', 'jumping');
});

test('il controllo touch avvia e fa saltare', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Il pulsante è riservato al layout touch');
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Salta' });
  await expect(button).toBeVisible();
  await button.dispatchEvent('pointerdown');
  await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-player-state', 'jumping');
});

test('registra il game over e permette di riprovare', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByTestId('game-canvas');
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-phase', 'gameover', { timeout: 8_000 });
  await expect(page.getByText('Nessun record')).toHaveCount(0);
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-phase', 'running');
  await expect(canvas).toHaveAttribute('data-player-state', 'jumping');
});
