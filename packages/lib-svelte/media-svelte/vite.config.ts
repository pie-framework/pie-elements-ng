import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { thirdPartyLicenses } from '../../../tools/vite/third-party-licenses';

export default defineConfig({
  plugins: [svelte({ emitCss: false }), thirdPartyLicenses()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
    },
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      external: (id) => /^svelte($|\/)/.test(id) || /^@pie-element\//.test(id),
      // One module per source file: the catalogs land at dist/i18n/index.js, the path the IIFE's
      // English-only plugin strips the locale loaders from when an element bundles this package.
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
