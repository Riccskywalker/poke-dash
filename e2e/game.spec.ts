import { expect, test } from '@playwright/test';

test('avvia una corsa, salta e mette in pausa', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Scegli il tuo compagno/i })).toBeVisible();
  await page.getByRole('button', { name: /Pikachu/i }).click();
  await page.getByRole('button', { name: /Inizia la corsa/i }).click();

  const canvas = page.getByTestId('game-canvas');
  await expect(canvas).toBeVisible();
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-player-state', 'jumping');
  await page.keyboard.press('p');
  await expect(page.getByRole('heading', { name: 'Gioco in pausa', exact: true })).toBeVisible();
});

test('i controlli touch sono accessibili su mobile', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Salta' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abbassati' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mossa speciale' })).toBeVisible();
});
