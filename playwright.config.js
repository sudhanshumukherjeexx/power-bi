/* Browser tests (tests/e2e): critical journeys, accessibility (axe-core) and responsive layout, run against the
   generated site/ served the way GitHub Pages serves it. Chromium in CI; locally you can use an installed browser
   with PW_CHANNEL=msedge or PW_CHANNEL=chrome.  Run: npm run test:e2e */
'use strict';
const { defineConfig, devices } = require('@playwright/test');
const PORT = 4173;
const channel = process.env.PW_CHANNEL;

module.exports = defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.js',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]] : 'list',
  outputDir: 'test-results',
  use: {
    baseURL: `http://localhost:${PORT}/power-bi/`,
    serviceWorkers: 'block',            /* tests see the current build, never a cached one */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], ...(channel ? { channel } : {}) } }],
  webServer: { command: `node tools/serve.js ${PORT}`, url: `http://localhost:${PORT}/power-bi/`, reuseExistingServer: !process.env.CI, timeout: 20_000 }
});
