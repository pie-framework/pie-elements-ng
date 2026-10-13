import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { noCdnHosts } from './vite.no-cdn';

export default defineConfig({
  plugins: [noCdnHosts()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@pie-element/shared-math-rendering-core'],
    },
  },
});
