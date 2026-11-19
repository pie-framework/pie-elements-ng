import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { thirdPartyLicenses } from '../../../tools/vite/third-party-licenses';

export default defineConfig({
  plugins: [
    thirdPartyLicenses({
      // The LaTeX parser is derived from math-expressions (see LICENSE). Its notice goes into this
      // build's notices file, and from there into the notices of every bundle that includes it.
      copied: [
        {
          sources: resolve(__dirname, 'src/conversion'),
          name: 'math-expressions',
          version: '2.0.0-alpha26',
          license: 'Apache-2.0',
          licenseFile: resolve(__dirname, 'licenses/math-expressions.txt'),
        },
      ],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: (id) => id === 'debug' || id === 'mathjs' || id.startsWith('mathjs/'),
    },
  },
  test: {
    globals: true,
  },
});
