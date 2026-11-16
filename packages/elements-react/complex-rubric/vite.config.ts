import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { thirdPartyLicenses } from '../../../tools/vite/third-party-licenses.ts';

const packageJson = JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf-8')) as {
  name?: string;
  version?: string;
};

export default defineConfig(({ mode, command }) => {
  // Demo mode: serve the docs/demo directory
  if (mode === 'demo' && command === 'serve') {
    return {
      plugins: [react()],
      root: resolve(import.meta.dirname, 'docs/demo'),
    };
  }

  // Build mode: build the library
  return {
  plugins: [react(), thirdPartyLicenses()],
  define: {
    __PIE_PACKAGE_NAME__: JSON.stringify(packageJson.name ?? ''),
    __PIE_PACKAGE_VERSION__: JSON.stringify(packageJson.version ?? 'local'),
  },
  build: {
    lib: {
      entry: {
        'index': resolve(import.meta.dirname, 'src/index.ts'),
        'controller/index': resolve(import.meta.dirname, 'src/controller/index.ts'),
        'delivery/index': resolve(import.meta.dirname, 'src/delivery/index.ts'),
        'author/index': resolve(import.meta.dirname, 'src/author/index.ts'),
        'print/index': resolve(import.meta.dirname, 'src/print/index.ts'),
        'runtime-support': resolve(import.meta.dirname, 'src/runtime-support.ts'),
      },
      formats: ['es'],
    },
    rolldownOptions: {
      external: (id) => {
        return (
          /^react($|\/)/.test(id) ||
          /^react-dom($|\/)/.test(id) ||
          /^@pie-lib\//.test(id) ||
          /^@pie-element\//.test(id) ||
          /^@pie-framework\//.test(id) ||
          /^@mui\//.test(id) ||
          /^@emotion\//.test(id) ||
          /^d3-/.test(id) ||
          /^@testing-library\//.test(id) ||
          /^styled-components/.test(id) ||
          id === 'konva' || /^konva\//.test(id) ||
          id === 'react-konva' || /^react-konva\//.test(id) ||
          /^@dnd-kit\//.test(id) ||
          id === '@mdi/react' || /^@mdi\/react\//.test(id) ||
          id === '@mdi/js' || /^@mdi\/js\//.test(id) ||
          id === 'recharts' || /^recharts\//.test(id) ||
          /^@hello-pangea\//.test(id) ||
          /^react-redux($|\/)/.test(id) ||
          /^use-sync-external-store($|\/)/.test(id) ||
          ['prop-types','debug','i18next','humps','mathjs','react-jss','js-combinatorics','@mapbox/point-geometry','react-transition-group','nested-property','pluralize','decimal.js'].includes(id)
        );
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
  };
});
