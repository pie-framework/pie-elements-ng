import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// The specs serve the built adapter and every MathJax file from local packages through
// page.route, so no server runs and nothing is fetched from the network.
//
// PIE_E2E_CROSS_BROWSER=1 adds the Chromium-family brand browsers installed on
// this machine (via their Playwright channel) and the managed Firefox and
// WebKit builds - the engines under Firefox and Safari. Math rendering, fonts
// and measurement are engine-sensitive, so the suite runs against them to
// catch engine-specific breakage; they are not a CI gate.
const crossBrowser = process.env.PIE_E2E_CROSS_BROWSER === '1';

// Playwright dropped the `opera` channel; Opera is a Chromium fork, so drive
// the installed app binary directly when it is present.
const operaExecutable = '/Applications/Opera.app/Contents/MacOS/Opera';
const hasOpera = existsSync(operaExecutable);

const crossBrowserProject = (
  name: string,
  device: keyof typeof devices,
  launch: { channel?: string; executablePath?: string }
) => ({
  name,
  use: {
    ...devices[device],
    // Brand browsers must use the installed app itself.
    ...launch,
  },
});

export default defineConfig({
  testDir: './tests/browser',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'line' : 'list',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(crossBrowser
      ? [
          crossBrowserProject('chrome', 'Desktop Chrome', { channel: 'chrome' }),
          crossBrowserProject('edge', 'Desktop Chrome', { channel: 'msedge' }),
          ...(hasOpera
            ? [
                crossBrowserProject('opera', 'Desktop Chrome', {
                  executablePath: operaExecutable,
                }),
              ]
            : []),
          crossBrowserProject('firefox', 'Desktop Firefox', {}),
          crossBrowserProject('webkit', 'Desktop Safari', {}),
        ]
      : []),
  ],
});
