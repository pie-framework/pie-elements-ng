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
      external: (id) => {
        return (
          /^@pie-element\/shared-/.test(id) ||
          id === '@pie-element/shared-math-rendering-mathjax' ||
          /^@pie-lib\//.test(id) ||
          ['debug'].includes(id)
        );
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
