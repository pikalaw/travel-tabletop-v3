import { defineConfig, devices } from '@playwright/test';

// Browser scenarios. They build the app and run against `vite preview`, served under the same
// /travel-tabletop-v3/ path as GitHub Pages. Set E2E_BASE_URL to aim them at another server.
const port = Number(process.env.E2E_PORT || 8769);
const external = process.env.E2E_BASE_URL;
const baseURL = external || `http://localhost:${port}/travel-tabletop-v3/`;
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 };

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL, ...phone, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], ...phone } }],
  ...(external ? {} : {
    webServer: {
      command: `npx vite build && npx vite preview --port ${port} --strictPort`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  }),
});
