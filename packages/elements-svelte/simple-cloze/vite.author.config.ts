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
      entry: resolve(__dirname, 'src/author/index.ts'),
      name: 'SimpleClozeAuthor',
      fileName: () => 'index.js',
      formats: ['es'],
    },
    outDir: 'dist/author',
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
