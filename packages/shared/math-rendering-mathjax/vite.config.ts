import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { noCdnHosts } from './vite.no-cdn.ts';
import { thirdPartyLicenses } from '../../../tools/vite/third-party-licenses.ts';

export default defineConfig({
  plugins: [noCdnHosts(), thirdPartyLicenses()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rolldownOptions: {
      external: ['@pie-element/shared-math-rendering-core'],
    },
  },
});
