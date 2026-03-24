import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.tsx'),
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
          /^@pie-element\//.test(id) ||
          /^@pie-framework\//.test(id) ||
          /^@mui\//.test(id) ||
          /^@emotion\//.test(id) ||
          /^d3-/.test(id) ||
          /^@testing-library\//.test(id) ||
          id === 'lodash-es' ||
          /^lodash-es\//.test(id) ||
          /^styled-components/.test(id) ||
          id === 'konva' || /^konva\//.test(id) ||
          id === 'react-konva' || /^react-konva\//.test(id) ||
          /^@dnd-kit\//.test(id) ||
          id === '@mdi/react' || /^@mdi\/react\//.test(id) ||
          id === '@mdi/js' || /^@mdi\/js\//.test(id) ||
          id === 'recharts' || /^recharts\//.test(id) ||
          ['prop-types', 'classnames', 'debug', 'i18next', 'humps', 'mathjs', 'react-jss', 'js-combinatorics', '@mapbox/point-geometry', 'react-transition-group', 'nested-property', 'pluralize', 'decimal.js'].includes(id)
        );
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
