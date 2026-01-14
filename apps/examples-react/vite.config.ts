import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Use source files instead of built dist in dev mode for React elements
      '@pie-element/hotspot/src': path.resolve(
        __dirname,
        '../../packages/elements-react/hotspot/src'
      ),
      '@pie-element/hotspot': path.resolve(
        __dirname,
        '../../packages/elements-react/hotspot/src/index.ts'
      ),
      '@pie-element/number-line/src': path.resolve(
        __dirname,
        '../../packages/elements-react/number-line/src'
      ),
      '@pie-element/number-line': path.resolve(
        __dirname,
        '../../packages/elements-react/number-line/src/index.ts'
      ),
      // Use source files for @pie-lib packages
      '@pie-lib/correct-answer-toggle': path.resolve(
        __dirname,
        '../../packages/lib-react/correct-answer-toggle/src/index.tsx'
      ),
      '@pie-lib/config-ui': path.resolve(
        __dirname,
        '../../packages/lib-react/config-ui/src/index.ts'
      ),
      '@pie-lib/editable-html': path.resolve(
        __dirname,
        '../../packages/lib-react/editable-html/src/index.tsx'
      ),
      '@pie-lib/render-ui': path.resolve(
        __dirname,
        '../../packages/lib-react/render-ui/src/index.ts'
      ),
      '@pie-lib/math-rendering': path.resolve(
        __dirname,
        '../../packages/lib-react/math-rendering/src/index.ts'
      ),
      '@pie-lib/icons': path.resolve(__dirname, '../../packages/lib-react/icons/src/index.ts'),
    },
    conditions: ['source', 'import', 'module', 'browser', 'default'],
  },
  optimizeDeps: {
    exclude: ['@pie-element/hotspot', '@pie-element/number-line', '@pie-lib/*'],
  },
});
