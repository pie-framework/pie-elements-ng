import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [svelte({ emitCss: false })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EditableHtmlTiptapSvelte',
      fileName: () => 'index.js',
      formats: ['es'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    minify: false,
    sourcemap: true,
    rollupOptions: {
      external: (id) => {
        return /^svelte($|\/)/.test(id) || /^@tiptap\//.test(id);
      },
      output: {
        format: 'es',
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
