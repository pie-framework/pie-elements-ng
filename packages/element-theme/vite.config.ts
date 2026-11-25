import path from 'node:path';
import { defineConfig } from 'vite';
import { thirdPartyLicenses } from '../../tools/vite/third-party-licenses.ts';

export default defineConfig({
  plugins: [thirdPartyLicenses()],
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/index.ts'),
      name: 'PieElementTheme',
      fileName: 'pie-element-theme',
      formats: ['es'],
    },
    rolldownOptions: {
      external: ['@pie-element/shared-theming'],
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
  },
});
