import { defineConfig } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function resolveLocalBrowsersDir(): string | undefined {
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
  testDir: __dirname,
  testMatch: ['**/*.spec.ts'],
  timeout: 20_000,
  globalTimeout: 2 * 60_000,
  retries: 0,
  workers: 4,
  expect: {
    timeout: 7_500,
  },
  use: {
    headless: true,
    actionTimeout: 7_500,
    navigationTimeout: 12_000,
    ...(localChromium ? { launchOptions: { executablePath: localChromium } } : {}),
  },
});
