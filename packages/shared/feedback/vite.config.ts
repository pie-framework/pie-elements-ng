import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { thirdPartyLicenses } from '../../../tools/vite/third-party-licenses.ts';

export default defineConfig({
  plugins: [thirdPartyLicenses()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'PieElementSharedFeedback',
      fileName: 'index',
      formats: ['es'],
    },
    rolldownOptions: {
      external: [],
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
