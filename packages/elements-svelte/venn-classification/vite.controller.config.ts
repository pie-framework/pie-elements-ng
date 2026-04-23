import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/controller/index.ts'),
      name: 'VennClassificationController',
      fileName: () => 'controller/index.js',
      formats: ['es'],
    },
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2020',
    minify: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        format: 'es',
      },
    },
  },
});
