import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // ESM-first resolution. A dependency with no exports map (@visx/* v3,
  // @hello-pangea/dnd) otherwise falls back to its CommonJS main entry, and
  // bundling CommonJS while React is external makes rolldown emit a
  // require("react") shim that throws in the browser. Preferring the module
  // field resolves those dependencies to their ESM build instead.
  resolve: { mainFields: ['module', 'browser', 'main'] },
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
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
});
