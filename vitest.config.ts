import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
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
