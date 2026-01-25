import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'adapters/katex': resolve(__dirname, 'src/adapters/katex.ts'),
        'adapters/mathml': resolve(__dirname, 'src/adapters/mathml.ts'),
        'utils/index': resolve(__dirname, 'src/utils/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['katex', /^katex\//, '@pie-element/shared-mathml-to-latex', '@xmldom/xmldom'],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
