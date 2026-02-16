import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Don't compile Svelte - ship as source .svelte files
// Let consuming apps compile them with their own Svelte setup
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => {
        // Externalize Svelte files and dependencies
        return /^svelte/.test(id) || /\.svelte$/.test(id) || /^@pie-element\//.test(id);
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
