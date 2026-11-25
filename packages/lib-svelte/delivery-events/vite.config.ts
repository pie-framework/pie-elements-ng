import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { thirdPartyLicenses } from '../../../tools/vite/third-party-licenses.ts';

export default defineConfig({
  plugins: [thirdPartyLicenses()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rolldownOptions: {
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
