import { defineConfig, devices } from '@playwright/test';
const suite = process.argv.includes('accessibility.spec.ts') ? 'a11y' : 'journeys';
export default defineConfig({
  testDir: './tests',
  timeout: 40000,
  expect: { timeout: 7000 },
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 3,
  reporter: [['list'], ['json', { outputFile: `.quality/${suite}.json` }], ['html', { outputFolder: `.quality/${suite}-report`, open: 'never' }]],
  outputDir: '.quality/test-results',
  use: { baseURL: 'http://127.0.0.1:4321', viewport: { width: 390, height: 900 }, trace: 'retain-on-failure', screenshot: 'only-on-failure', serviceWorkers: 'block' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 900 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 390, height: 900 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 390, height: 900 } } },
  ],
  webServer: { command: 'node scripts/serve.mjs', url: 'http://127.0.0.1:4321', reuseExistingServer: false, timeout: 15000 },
});
