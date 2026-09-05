import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'pixel-portrait', use: { ...devices['Pixel 7'] } },
    { name: 'pixel-landscape', use: { ...devices['Pixel 7'], viewport: { width: 915, height: 412 } } },
    { name: 'iphone-portrait', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'iphone-landscape', use: { ...devices['iPhone 13'], browserName: 'chromium', viewport: { width: 844, height: 390 } } },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
