import { defineConfig } from 'vite';
import { thirdPartyLicenses } from '../../../tools/vite/third-party-licenses.ts';
import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  // Styles ship inside the components: author elements bundle this package and load no CSS file.
  plugins: [svelte({ emitCss: false }), thirdPartyLicenses()],
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
      },
      formats: ['es'],
    },
    rolldownOptions: {
      external: (id) => /^svelte/.test(id),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
  },
});
