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
          // mathjs is bundled into this package, not external. Shared, it breaks any bundle that
          // also holds one of the CommonJS builds of @pie-framework/math-validation published from the old
          // repo (1.4.3 and earlier): that loads mathjs's CommonJS build while this package loads its ES build, the bundle service
          // gives both one typed-function module, and each mathjs build creates its default
          // instance on typed-function's shared singleton, so the second build's parser throws
          // `There is already a conversion from "string" to "Node"` and the whole bundle fails
          // to load. A bundled copy brings its own typed-function. Do not add it back here, nor
          // decimal.js, which only mathjs imports and which this package does not declare.
          ['prop-types','debug','i18next','humps','react-jss','js-combinatorics','@mapbox/point-geometry','react-transition-group','nested-property','pluralize'].includes(id)
        );
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        // Bundled dependencies (mathjs and what it imports) would be emitted under
        // `dist/node_modules/...`, and npm leaves every nested `node_modules` directory out of
        // the published tarball: the imports would point at files that are not there.
        entryFileNames: (chunk) =>
          `${chunk.name.replace(/(^|\/)node_modules\//g, '$1vendor/').replace(/(^|\/)\.bun\//g, '$1')}.js`,
      },
    },
  },
  };
});
