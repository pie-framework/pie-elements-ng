import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    minify: false,
    rollupOptions: {
      external: ['mathquill', 'mathquill/build/mathquill.js'], // Desmos fork is external dependency
      output: {
        assetFileNames: (assetInfo) => {
          // Rename CSS to mathquill.css
          if (assetInfo.name?.endsWith('.css')) return 'mathquill.css';
          return assetInfo.name || 'asset';
        },
      },
    },
    cssCodeSplit: false, // Bundle all CSS into one file
  },
  css: {
    preprocessorOptions: {
      less: {
        math: 'always', // Required for LESS math operations (matrix styles)
      },
    },
  },
});
