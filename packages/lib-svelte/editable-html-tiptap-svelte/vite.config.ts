import { defineConfig } from 'vite';
import { thirdPartyLicenses } from '../../../tools/vite/third-party-licenses.ts';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [svelte({ emitCss: false }), thirdPartyLicenses()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'EditableHtmlTiptapSvelte',
      fileName: () => 'index.js',
      formats: ['es'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    minify: false,
    sourcemap: true,
    rolldownOptions: {
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
