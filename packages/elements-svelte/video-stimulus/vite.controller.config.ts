import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/controller/index.ts'),
      name: 'VideoStimulusController',
      fileName: () => 'controller/index.js',
      formats: ['es'],
    },
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2020',
    minify: false,
    sourcemap: true,
    rollupOptions: {
      output: { format: 'es' },
    },
  },
});
