import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        customElement: true,
      },
      emitCss: false,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/print/index.ts'),
      name: 'SimpleClozePrint',
      fileName: () => 'index.js',
      formats: ['es'],
    },
    outDir: 'dist/print',
    emptyOutDir: true,
    target: 'es2020',
    minify: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        format: 'es',
        inlineDynamicImports: true,
      },
    },
  },
});
