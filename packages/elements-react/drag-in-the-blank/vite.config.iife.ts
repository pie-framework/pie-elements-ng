import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as {
  name?: string;
  version?: string;
};

const resolveWorkspaceEntry = (baseDir: string): string | null => {
  const candidates = ['index.ts', 'index.tsx', 'index.js', 'index.jsx'];
  for (const candidate of candidates) {
    const fullPath = resolve(baseDir, candidate);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
};

export default defineConfig({
  plugins: [
    {
      name: 'iife-workspace-and-shim-resolver',
      enforce: 'pre',
      resolveId(id) {
        const sharedMatch = id.match(/^@pie-element\/shared-(.+)$/);
        if (sharedMatch) {
          const entry = resolveWorkspaceEntry(resolve(__dirname, '../../shared', sharedMatch[1], 'src'));
          if (entry) {
            return entry;
          }
        }

        const pieLibMatch = id.match(/^@pie-lib\/([^/]+)$/);
        if (pieLibMatch) {
          const entry = resolveWorkspaceEntry(resolve(__dirname, '../../lib-react', pieLibMatch[1], 'src'));
          if (entry) {
            return entry;
          }
        }

        if (id === 'debug') {
          return '\0iife-debug-shim';
        }
        if (id === 'prop-types') {
          return '\0iife-prop-types-shim';
        }
      },
      load(id) {
        if (id === '\0iife-debug-shim') {
          return "const noop = () => {}; function debug() { const log = function () {}; log.enabled = false; log.log = noop; log.extend = () => log; log.destroy = noop; return log; } debug.log = noop; debug.enable = noop; debug.disable = () => ''; debug.enabled = () => false; export default debug;";
        }
        if (id === '\0iife-prop-types-shim') {
          return "const shim = function () { return null; }; shim.isRequired = shim; const getShim = () => shim; export const array = shim, bigint = shim, bool = shim, func = shim, number = shim, object = shim, string = shim, symbol = shim, any = shim, element = shim, elementType = shim, node = shim; export const arrayOf = getShim, instanceOf = getShim, objectOf = getShim, oneOf = getShim, oneOfType = getShim, shape = getShim, exact = getShim; export const checkPropTypes = () => {}; export const resetWarningCache = () => {}; const types = { array, bigint, bool, func, number, object, string, symbol, any, element, elementType, node, arrayOf, instanceOf, objectOf, oneOf, oneOfType, shape, exact, checkPropTypes, resetWarningCache }; types.PropTypes = types; export { types as PropTypes }; export default types;";
        }
      },
    },
    react(),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    __PIE_PACKAGE_NAME__: JSON.stringify(packageJson.name ?? ''),
    __PIE_PACKAGE_VERSION__: JSON.stringify(packageJson.version ?? 'local'),
  },
  build: {
    emptyOutDir: false, // Don't wipe existing ESM builds
    lib: {
      entry: resolve(__dirname, 'src/index.iife.ts'),
      name: 'DragInTheBlankElement',
      fileName: () => 'index.iife.js',
      formats: ['iife'] as const,
    },
    rollupOptions: {
      external: (id: string) => {
        // Bundle everything including React and math-rendering
        // This creates a fully self-contained IIFE bundle
        return false;
      },
      output: {
        // IIFE global name
        name: 'DragInTheBlankElement',
        extend: true,
      },
    },
  },
});
