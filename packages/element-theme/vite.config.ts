import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'PieElementTheme',
      fileName: 'pie-element-theme',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@pie-element/shared-theming'],
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
  },
});
