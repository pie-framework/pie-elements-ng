import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: {
        element: resolve(__dirname, 'src/element/index.ts'),
        controller: resolve(__dirname, 'src/controller/index.ts'),
        author: resolve(__dirname, 'src/author/MultipleChoiceAuthor.svelte'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      // Bundle everything except Svelte runtime
      external: [/^svelte($|\/)/],
    },
  },
});
