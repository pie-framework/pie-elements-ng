import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        customElement: true,
      },
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'PieElementPlayer',
      fileName: 'pie-element-player',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // Single file output
      },
    },
  },
});
