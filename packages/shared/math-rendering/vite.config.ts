import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['katex', /^katex\//, '@pie-elements-ng/shared-mathml-to-latex', '@xmldom/xmldom'],
    },
  },
});
