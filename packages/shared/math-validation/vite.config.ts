import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { thirdPartyLicenses } from '../../../tools/vite/third-party-licenses';

export default defineConfig({
  plugins: [thirdPartyLicenses()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: (id) => id === 'debug' || id === 'mathjs' || id.startsWith('mathjs/'),
    },
  },
  test: {
    globals: true,
  },
});
