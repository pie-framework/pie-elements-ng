import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  // Styles ship inside the components: author elements bundle this package and load no CSS file.
  plugins: [svelte({ emitCss: false })],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => /^svelte/.test(id),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
  },
});
