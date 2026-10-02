import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

const workspaceRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
    alias: {
      '@workspace': workspaceRoot,
    },
    conditions: process.env.VITEST ? ['browser'] : [],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.svelte-kit/**',
      '**/.bun-tests/**',
      // Agent worktrees are full checkouts; the root-anchored excludes below miss their copies.
      '.claude/**',
      '**/e2e/**', // Exclude E2E tests (use Playwright for those)
      '**/tests/e2e/**', // Exclude E2E tests in tests directory
      '**/*.spec.ts', // Exclude Playwright spec files
      // React component tests under `src` need each package's own vite config
      // and run through `turbo run test`. A package's `tests/` directory does
      // not: it exercises the published delivery element against the DOM, and
      // it runs here so CI and pre-push see it. Excluding the whole tree meant
      // the element teardown tests never ran anywhere.
      'packages/elements-react/**/src/**',
      'packages/lib-react/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '.svelte-kit/',
        '**/*.config.{js,ts}',
        '**/*.spec.{js,ts}',
        '**/*.test.{js,ts}',
      ],
    },
  },
});
