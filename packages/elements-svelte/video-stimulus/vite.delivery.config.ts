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
    lib: {
      entry: resolve(__dirname, 'src/delivery/index.ts'),
      name: 'VideoStimulusDelivery',
      fileName: () => 'index.js',
      formats: ['es'],
    },
    outDir: 'dist/delivery',
    emptyOutDir: true,
    target: 'es2020',
    minify: false,
    sourcemap: true,
    rollupOptions: {
      output: { format: 'es', inlineDynamicImports: true },
    },
  },
});
