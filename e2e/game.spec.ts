import { expect, test } from '@playwright/test';

test('starts with Space without visible copy', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1, footer, .how-to')).toHaveCount(0);
  const canvas = page.getByTestId('game-canvas');
  await expect(canvas).toHaveAttribute('data-phase', 'idle');
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-phase', 'running');
  await expect(canvas).toHaveAttribute('data-player-state', 'jumping');
});

test('touch control starts and jumps', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop', 'Touch coverage runs on mobile projects');
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Jump' });
  await expect(button).toBeVisible();
  await button.tap();
  await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-jumps', '1');
});

test('game over and retry are available', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByTestId('game-canvas');
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-phase', 'gameover', { timeout: 8_000 });
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-phase', 'running');
});

test('completes deterministically through the guarded test hook', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { const hook = (window as Window & { __RAREBIT_TEST__?: { setDistance: (distance: number) => void; press: () => void } }).__RAREBIT_TEST__; hook?.setDistance(9900); hook?.press(); });
  await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-phase', 'complete');
  await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-phase', 'complete');
});

test('uses the official RareBit favicon and no legacy favicon reference', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/rarebit-icon.svg');
  await expect(page.locator('html')).not.toContainText('favicon.svg');
});

test('idle hold enables the deterministic reverse holo run', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const hook = (window as Window & {
      __RAREBIT_TEST__?: {
        press: () => void;
        release: () => void;
        snapshot: () => { reverseHolo: boolean };
      };
    }).__RAREBIT_TEST__;
    hook?.press();
  });
  await page.waitForTimeout(1600);
  const reverseHolo = await page.evaluate(() => Boolean((window as unknown as { __RAREBIT_TEST__?: { snapshot: () => { reverseHolo: boolean } } }).__RAREBIT_TEST__?.snapshot().reverseHolo));
  expect(reverseHolo).toBe(true);
  await page.evaluate(() => (window as Window & { __RAREBIT_TEST__?: { release: () => void } }).__RAREBIT_TEST__?.release());
});

test('reduced motion is reflected in the renderer snapshot', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const reducedMotion = await page.evaluate(() => Boolean((window as unknown as { __RAREBIT_TEST__?: { snapshot: () => { reducedMotion: boolean } } }).__RAREBIT_TEST__?.snapshot().reducedMotion));
  expect(reducedMotion).toBe(true);
});

test('fullscreen layout and camera metrics remain anchored', async ({ page }, testInfo) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(new Error(message.text())); });
  await page.goto('/');
  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
    const mute = document.querySelector<HTMLButtonElement>('#mute-button')!;
    const rect = canvas.getBoundingClientRect();
    const hook = (window as unknown as { __RAREBIT_TEST__?: { snapshot: () => any } }).__RAREBIT_TEST__!;
    const snapshot = hook.snapshot();
    return { body: document.body.innerText, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, viewport: { width: innerWidth, height: innerHeight }, scroll: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }, backing: { width: canvas.width, height: canvas.height }, dpr: Math.min(devicePixelRatio, 2), playerCss: Number(canvas.dataset.playerCssSize), mute: mute.getBoundingClientRect().width, camera: snapshot.camera, player: snapshot.player, world: snapshot.world };
  });
  expect(metrics.body).toBe('');
  expect(metrics.rect).toEqual({ x: 0, y: 0, width: metrics.viewport.width, height: metrics.viewport.height });
  expect(metrics.scroll).toEqual(metrics.viewport);
  expect(metrics.backing.width).toBe(Math.round(metrics.viewport.width * metrics.dpr));
  expect(metrics.playerCss).toBeGreaterThanOrEqual(testInfo.project.name === 'desktop' ? 55 : testInfo.project.name.includes('landscape') ? 44 : 38);
  expect(metrics.mute).toBeGreaterThanOrEqual(48);
  expect((metrics.camera.width - metrics.player.x - metrics.player.width) / metrics.world.speed).toBeGreaterThanOrEqual(1.05);
  const groundCss = metrics.viewport.height - (metrics.world.groundY + metrics.camera.yOffset) * metrics.camera.scale;
  expect(Math.abs(groundCss - 82 * metrics.camera.scale)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

for (const code of ['KeyW', 'Enter']) {
  test(`${code} starts the run`, async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press(code);
    await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-phase', 'running');
  });
}

test('audio is lazy and mute persists across reload', async ({ page }) => {
  await page.goto('/');
  const before = await page.evaluate(() => (window as unknown as { __RAREBIT_TEST__?: { snapshot: () => any } }).__RAREBIT_TEST__?.snapshot().audioInitialized);
  expect(before).toBe(false);
  await page.keyboard.press('Space');
  const after = await page.evaluate(() => (window as unknown as { __RAREBIT_TEST__?: { snapshot: () => any } }).__RAREBIT_TEST__?.snapshot().audioInitialized);
  expect(after).toBe(true);
  await page.getByRole('button', { name: 'Toggle sound' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Toggle sound' })).toHaveAttribute('aria-pressed', 'true');
});
