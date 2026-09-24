import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
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
