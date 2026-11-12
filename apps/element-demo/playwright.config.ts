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

// A WebKit project must not inherit this: it is the path of a Chromium binary.
const chromiumLaunch = (() => {
  const executablePath = resolveLocalChromium();
  return executablePath ? { launchOptions: { executablePath } } : {};
})();

// Cross-browser projects behind PIE_E2E_CROSS_BROWSER=1: the Chromium-family
// brand browsers installed on this machine via their Playwright channel, plus
// the managed Firefox and WebKit builds (the engines under Firefox and Safari;
// Playwright cannot drive the stock apps). They exist to catch browser-specific
// breakage - theme/CSS, packaging and engine differences - not to gate CI, so
// they run the same specs as the `chromium` project and leave the touch specs
// to the dedicated touch projects.
const crossBrowser = process.env.PIE_E2E_CROSS_BROWSER === '1';

// Playwright dropped the `opera` channel; Opera is a Chromium fork, so drive the
// installed app binary directly when it is present.
const operaExecutable = '/Applications/Opera.app/Contents/MacOS/Opera';
const hasOpera = existsSync(operaExecutable);

const crossBrowserSpecFilter = {
  // `*.touch.spec.ts` belongs to the touch projects; without touch emulation
  // those gestures are no-ops and the specs would fail here.
  testIgnore: ['**/*.touch.spec.ts'],
};

/**
 * A project that narrows the top-level `testIgnore` (as `chromium` does for the
 * touch specs) replaces it entirely, which would resurrect the IIFE usefulness
 * matrix - a 6-minute suite meant to run only through `RUN_IIFE_E2E=1`. Merge
 * the IIFE gate back in for such projects.
 */
function mergeIifeGate(testIgnore?: string[]): string[] | undefined {
  if (runIifeE2e) return testIgnore;
  return [...(testIgnore ?? []), '**/iife-usefulness.spec.ts'];
}

function crossBrowserProject(
  name: string,
  device: keyof typeof devices,
  launch: { channel?: string; executablePath?: string }
) {
  return {
    name,
    testIgnore: mergeIifeGate(crossBrowserSpecFilter.testIgnore),
    use: {
      ...devices[device],
      viewport: { width: 1920, height: 1080 },
      // Brand browsers must use the installed app itself; an explicit
      // executablePath (the headless shell) would override the channel.
      ...launch,
    },
  };
}

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
  },
  projects: [
    {
      name: 'chromium',
      // `*.touch.spec.ts` belongs to the touch project below; without touch
      // emulation those gestures are no-ops and the specs would fail here.
      // `testIgnore` here replaces the top-level one, so the IIFE gate is
      // merged back in (see mergeIifeGate).
      testIgnore: mergeIifeGate(['**/*.touch.spec.ts']),
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        ...chromiumLaunch,
      },
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
        ...chromiumLaunch,
      },
    },
    {
      // The same touch specs at a phone viewport, for layouts that reflow below
      // tablet width. `isMobile` is what makes the browser honour the viewport
      // meta tag and its double-tap-to-zoom, which the desktop `touch` project
      // does not have; the double-tap zoom spec runs only here.
      name: 'touch-phone',
      testMatch: ['**/*.touch.spec.ts'],
      // Its precondition, a page more than 1.5 viewports tall, does not hold at
      // this viewport, so it fails before any gesture is sent. Not yet adapted.
      testIgnore: ['**/page-gestures.touch.spec.ts'],
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        ...chromiumLaunch,
      },
    },
    {
      // The tap specs in WebKit, the engine under every browser on iOS. Taps
      // only: Playwright can send WebKit a tap (`page.touchscreen.tap`) but no
      // trusted touch-drag, long-press or double-tap, so the specs that need
      // those skip themselves here (see touch-helpers.ts). No `executablePath`:
      // WebKit comes from `playwright install webkit`.
      name: 'touch-webkit',
      testMatch: ['**/tap-elements.touch.spec.ts'],
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1180, height: 820 },
        hasTouch: true,
      },
    },
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
  webServer: useExternalServer
    ? undefined
    : {
        command: 'bun run dev',
        url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5222',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
