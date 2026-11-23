import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { thirdPartyLicenses } from '../../../tools/vite/third-party-licenses.ts';

export default defineConfig({
  plugins: [thirdPartyLicenses()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rolldownOptions: {
      external: ['@pie-element/shared-types', 'dompurify'],
    },
  },
  test: {
    globals: true,
  },
});
