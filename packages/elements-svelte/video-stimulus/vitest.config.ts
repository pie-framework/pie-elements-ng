import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { customElement: true } })],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [resolve(__dirname, '../../../vitest.setup.ts')],
    include: ['tests/**/*.test.ts'],
  },
});
