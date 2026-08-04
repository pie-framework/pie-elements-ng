import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/runtime-support.ts'),
      fileName: () => 'runtime-support.js',
      formats: ['es'],
    },
    outDir: 'dist',
    sourcemap: true,
  },
});
