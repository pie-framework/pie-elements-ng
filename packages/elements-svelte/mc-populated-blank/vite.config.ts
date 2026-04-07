import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

export default defineConfig(() => {
  // Build delivery element with Svelte bundled, controller separately
  return {
    plugins: [
      svelte({
        compilerOptions: {
          customElement: true,
        },
        emitCss: false,
      }),
    ],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'McPopulatedBlank',
        fileName: () => 'index.js',
        formats: ['es'],
      },
      outDir: 'dist',
      emptyOutDir: true,
      target: 'es2020',
      minify: false,
      sourcemap: true,
      rollupOptions: {
        output: {
          format: 'es',
          inlineDynamicImports: true,
        },
      },
    },
  };
});
