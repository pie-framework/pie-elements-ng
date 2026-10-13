import { defineConfig, devices } from '@playwright/test';

// The specs serve the built adapter and every MathJax file from local packages through
// page.route, so no server runs and nothing is fetched from the network.
export default defineConfig({
  testDir: './tests/browser',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'line' : 'list',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
