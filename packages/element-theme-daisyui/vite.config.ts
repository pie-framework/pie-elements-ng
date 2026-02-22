import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'PieElementThemeDaisyUi',
      fileName: 'pie-element-theme-daisyui',
      formats: ['es'],
    },
    rollupOptions: {
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
