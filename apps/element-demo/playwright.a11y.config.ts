import { defineConfig, devices } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

function resolveLocalBrowsersDir(): string | undefined {
  const systemCache = join(homedir(), 'Library', 'Caches', 'ms-playwright');
  if (existsSync(systemCache)) {
    return systemCache;
  }

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

function resolveLocalChromium(): string | undefined {
  const localBrowsersDir = resolveLocalBrowsersDir();
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
const useExternalServer = process.env.PIE_A11Y_EXTERNAL_SERVER === '1';
const suiteName = process.env.A11Y_SUITE === 'inventory' ? 'inventory' : 'scenarios';
const htmlReportDir =
  process.env.A11Y_PLAYWRIGHT_REPORT_DIR || `playwright-a11y-report/${suiteName}`;

export default defineConfig({
  testDir: './test/a11y',
  testMatch: ['**/*.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html', { outputFolder: htmlReportDir }], ['list']],
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://localhost:5222',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
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
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
