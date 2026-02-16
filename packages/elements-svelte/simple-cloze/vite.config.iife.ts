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
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.iife.ts'),
      name: 'SimpleClozeElement',
      fileName: () => 'index.iife.js',
      formats: ['iife'],
    },
    rollupOptions: {
      external: () => false,
      output: {
        name: 'SimpleClozeElement',
        extend: true,
      },
    },
  },
});
