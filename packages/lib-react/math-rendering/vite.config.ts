import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { thirdPartyLicenses } from '../../../tools/vite/third-party-licenses.ts';

export default defineConfig({
  plugins: [thirdPartyLicenses()],
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
      },
      formats: ['es'],
    },
    rolldownOptions: {
      external: (id) => {
        return (
          /^@pie-element\/shared-/.test(id) ||
          id === '@pie-element/shared-math-rendering-mathjax' ||
          /^@pie-lib\//.test(id) ||
          ['debug'].includes(id)
        );
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
