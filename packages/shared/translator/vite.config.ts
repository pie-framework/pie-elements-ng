import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { thirdPartyLicenses } from '../../../tools/vite/third-party-licenses';

export default defineConfig({
  plugins: [thirdPartyLicenses()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => id === 'i18next' || id.startsWith('i18next/'),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
