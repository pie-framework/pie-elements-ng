import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [
    // Tailwind v4 optimization currently warns on daisyUI's standards-track `@property` rule.
    // Disable Tailwind's optimize pass (Vite will still minify CSS).
    tailwindcss({ optimize: false }),
    svelte({
      compilerOptions: {
        customElement: true,
      },
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'PieElementPlayer',
      fileName: 'pie-element-player',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        // Enable code splitting for lazy-loaded math renderers
        inlineDynamicImports: false,
        // Put dynamic imports in separate chunks
        manualChunks: (id) => {
          if (id.includes('math-rendering-katex')) {
            return 'math-katex';
          }
          if (id.includes('math-rendering-mathjax')) {
            return 'math-mathjax';
          }
          if (id.includes('node_modules/katex')) {
            return 'katex-lib';
          }
        },
      },
    },
  },
});
