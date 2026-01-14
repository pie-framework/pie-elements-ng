import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolve @pie-lib imports to source instead of dist to avoid externals
      '@pie-lib/math-rendering': resolve(__dirname, '../../lib-react/math-rendering/src/index.ts'),
      '@pie-lib/render-ui': resolve(__dirname, '../../lib-react/render-ui/src/index.ts'),
      '@pie-lib/editable-html': resolve(__dirname, '../../lib-react/editable-html/src/index.ts'),
      '@pie-lib/config-ui': resolve(__dirname, '../../lib-react/config-ui/src/index.tsx'),
      '@pie-lib/correct-answer-toggle': resolve(
        __dirname,
        '../../lib-react/correct-answer-toggle/src/index.tsx'
      ),
      '@pie-lib/translator': resolve(__dirname, '../../lib-react/translator/src/index.ts'),
      // Resolve controller from upstream pie-elements
      '@pie-element/multiple-choice/controller/src':
        '/Users/eelco.hillenius/dev/prj/pie/pie-elements/packages/multiple-choice/controller/src',
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // Bundle everything for true framework independence
      external: [],
      output: {
        inlineDynamicImports: true,
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
