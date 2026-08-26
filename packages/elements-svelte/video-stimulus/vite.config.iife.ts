import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: { customElement: true },
      emitCss: false,
    }),
  ],
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.iife.ts'),
      name: 'VideoStimulusElement',
      fileName: () => 'index.iife.js',
      formats: ['iife'],
    },
    rollupOptions: {
      external: () => false,
      output: { name: 'VideoStimulusElement', extend: true },
    },
  },
});
