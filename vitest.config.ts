import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

const workspaceRoot = dirname(fileURLToPath(import.meta.url));
const mediaSvelteSource = fileURLToPath(
  new URL('./packages/lib-svelte/media-svelte/src/index.ts', import.meta.url)
);

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
    alias: {
      '@workspace': workspaceRoot,
      '@pie-lib/media-svelte': mediaSvelteSource,
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
      '**/e2e/**', // Exclude E2E tests (use Playwright for those)
      '**/tests/e2e/**', // Exclude E2E tests in tests directory
      '**/*.spec.ts', // Exclude Playwright spec files
      'packages/elements-react/**',
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
