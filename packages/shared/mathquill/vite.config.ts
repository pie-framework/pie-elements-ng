import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    minify: false, // Don't minify - the bundle contains pre-concatenated code
    rollupOptions: {
      external: ['jquery'], // Don't bundle jQuery
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
        math: 'always', // Required for LESS math operations
      },
    },
  },
  plugins: [
    // Copy font files to dist
    viteStaticCopy({
      targets: [
        {
          src: 'src/fonts/*',
          dest: 'fonts',
        },
      ],
    }),
  ],
});
