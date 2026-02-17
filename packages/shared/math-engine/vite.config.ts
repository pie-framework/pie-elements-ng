import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@pie-element/shared-math-rendering-mathjax', 'svelte'],
    },
  },
  test: {
    globals: true,
    include: ['test/**/*.test.ts'],
  },
});
