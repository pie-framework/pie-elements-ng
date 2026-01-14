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
    setupFiles: ['../../vitest.setup.ts'], // Use root setup file
    exclude: ['**/node_modules/**', '**/dist/**', '**/.svelte-kit/**', '**/e2e/**'],
  },
});
