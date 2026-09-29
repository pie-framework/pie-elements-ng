import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // Consumers resolve the event classes from their own dependency, so one
      // class serves the element, this bridge and the player.
      external: (id) => /^@pie-element\//.test(id),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
