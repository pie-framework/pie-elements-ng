import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: { customElement: true },
      emitCss: false,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/author/index.ts'),
      name: 'VideoStimulusAuthor',
      fileName: () => 'index.js',
      formats: ['es'],
    },
    outDir: 'dist/author',
    emptyOutDir: true,
    target: 'es2020',
    minify: false,
    sourcemap: true,
    rollupOptions: {
      output: { format: 'es', inlineDynamicImports: true },
    },
  },
});
