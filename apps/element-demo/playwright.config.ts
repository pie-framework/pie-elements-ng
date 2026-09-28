import { defineConfig, devices } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

function resolveLocalBrowsersDir(): string | undefined {
  // First try system cache (macOS)
  const systemCache = join(homedir(), 'Library', 'Caches', 'ms-playwright');
  if (existsSync(systemCache)) {
    return systemCache;
  }

  // Fallback to bun modules
  const bunModulesDir = join(process.cwd(), 'node_modules', '.bun');
  if (!existsSync(bunModulesDir)) {
    return undefined;
  }

  const entries = readdirSync(bunModulesDir).filter((entry) =>
    entry.startsWith('playwright-core@')
  );

  for (const entry of entries) {
    const candidate = join(
      bunModulesDir,
      entry,
      'node_modules',
      'playwright-core',
      '.local-browsers'
    );
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

const localBrowsersDir = resolveLocalBrowsersDir();
const runIifeE2e = process.env.RUN_IIFE_E2E === '1';
const useExternalServer = process.env.PIE_IIFE_EXTERNAL_SERVER === '1';

function resolveLocalChromium(): string | undefined {
  if (!localBrowsersDir || !existsSync(localBrowsersDir)) {
    return undefined;
  }

  const entries = readdirSync(localBrowsersDir).filter((entry) =>
    entry.startsWith('chromium_headless_shell-')
  );

  for (const entry of entries) {
    const arm64Path = join(
      localBrowsersDir,
      entry,
      'chrome-headless-shell-mac-arm64',
      'chrome-headless-shell'
    );
    if (existsSync(arm64Path)) {
      return arm64Path;
    }

    const x64Path = join(
      localBrowsersDir,
      entry,
      'chrome-headless-shell-mac-x64',
      'chrome-headless-shell'
    );
    if (existsSync(x64Path)) {
      return x64Path;
    }
  }

  return undefined;
}

const localChromium = resolveLocalChromium();

export default defineConfig({
  testDir: './test/e2e',
  testMatch: ['**/*.spec.ts'],
  testIgnore: runIifeE2e ? [] : ['**/iife-usefulness.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run serially for state management tests
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5222',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    ...(localChromium ? { launchOptions: { executablePath: localChromium } } : {}),
  },
  projects: [
    {
      name: 'chromium',
      // `*.touch.spec.ts` belongs to the touch project below; without touch
      // emulation those gestures are no-ops and the specs would fail here.
      testIgnore: ['**/*.touch.spec.ts'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
    {
      // Touch-device coverage. The rest of the suite drives every draggable
      // element with `page.mouse`, which never reaches the separate listeners
      // drag libraries register for touch - the blind spot that let charting
      // ship unusable on iPads (PIE-1074).
      //
      // Chromium with touch emulation, not WebKit: Playwright has no trusted
      // touch-drag for WebKit, so drags there would need synthetic in-page
      // events that bypass `touch-action` and miss the dnd-kit class of bug.
      // The trade-off is that this project covers "does a finger drive this
      // element at all", not iOS Safari rendering or native gesture quirks -
      // those still need a real device.
      name: 'touch',
      testMatch: ['**/*.touch.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        // iPad Air landscape, in CSS pixels.
        viewport: { width: 1180, height: 820 },
        hasTouch: true,
      },
    },
  ],
  webServer: useExternalServer
    ? undefined
    : {
        command: 'bun run dev',
        url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5222',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
