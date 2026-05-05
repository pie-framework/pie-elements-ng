import { defineConfig, devices } from '@playwright/test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

// Load .env so that LEARNOSITY_* vars are visible to the Playwright test process
// (SvelteKit/Vite loads .env for the app server, but not for the test runner).
const envPath = join(import.meta.dirname, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) process.env[match[1]] ??= match[2].trim();
  }
}

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
    baseURL: 'http://localhost:5222',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    ...(localChromium ? { launchOptions: { executablePath: localChromium } } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: useExternalServer
    ? undefined
    : {
        command: 'bun run dev',
        url: 'http://localhost:5222',
        reuseExistingServer: true, // Use existing dev server
        timeout: 120_000,
      },
});
