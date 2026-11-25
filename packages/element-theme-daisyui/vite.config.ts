import path from 'node:path';
import { defineConfig } from 'vite';
import { thirdPartyLicenses } from '../../tools/vite/third-party-licenses.ts';

export default defineConfig({
  plugins: [thirdPartyLicenses()],
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/index.ts'),
      name: 'PieElementThemeDaisyUi',
      fileName: 'pie-element-theme-daisyui',
      formats: ['es'],
    },
    rolldownOptions: {
      external: [
        '@pie-element/element-theme',
        '@pie-element/shared-theming',
        '@pie-element/shared-types',
      ],
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
  },
});
