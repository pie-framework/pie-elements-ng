import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { englishOnlyCatalogs } from './iife-english-only-catalogs.ts';
import { iifeGlobalName } from './iife-global-name.ts';
import { IIFE_DEBUG_SHIM_SOURCE, IIFE_PROP_TYPES_SHIM_SOURCE } from './iife-shims.ts';
import { thirdPartyLicenses } from './third-party-licenses.ts';

// Per-element IIFE build for a React element, run from the element's package directory.
const packageDir = process.cwd();
const packagesDir = resolve(import.meta.dirname, '../../packages');
const entry = resolve(packageDir, 'src/index.iife.ts');

if (!existsSync(entry)) {
  throw new Error(`No IIFE entry point (src/index.iife.ts) found in ${packageDir}`);
}

const packageJson = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf-8')) as {
  name: string;
  version?: string;
};
const globalName = iifeGlobalName(packageJson.name);

const resolveWorkspaceEntry = (baseDir: string): string | null => {
  for (const candidate of ['index.ts', 'index.tsx', 'index.js', 'index.jsx']) {
    const fullPath = resolve(baseDir, candidate);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
};

export default defineConfig({
  root: packageDir,
  plugins: [
    thirdPartyLicenses(),
    {
      name: 'iife-workspace-and-shim-resolver',
      enforce: 'pre',
      resolveId(id) {
        const sharedMatch = id.match(/^@pie-element\/shared-(.+)$/);
        if (sharedMatch) {
          const sharedEntry = resolveWorkspaceEntry(
            resolve(packagesDir, 'shared', sharedMatch[1], 'src')
          );
          if (sharedEntry) {
            return sharedEntry;
          }
        }

        const pieLibMatch = id.match(/^@pie-lib\/([^/]+)$/);
        if (pieLibMatch) {
          const libEntry = resolveWorkspaceEntry(
            resolve(packagesDir, 'lib-react', pieLibMatch[1], 'src')
          );
          if (libEntry) {
            return libEntry;
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
          return IIFE_DEBUG_SHIM_SOURCE;
        }
        if (id === '\0iife-prop-types-shim') {
          return IIFE_PROP_TYPES_SHIM_SOURCE;
        }
      },
    },
    react(),
    englishOnlyCatalogs(),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    __PIE_PACKAGE_NAME__: JSON.stringify(packageJson.name),
    __PIE_PACKAGE_VERSION__: JSON.stringify(packageJson.version ?? 'local'),
  },
  build: {
    emptyOutDir: false, // the ESM builds share dist/
    lib: {
      entry,
      name: globalName,
      fileName: () => 'index.iife.js',
      formats: ['iife'],
    },
    rolldownOptions: {
      // IIFE output has no import.meta and Rolldown replaces it with {}. Its readers tolerate
      // that: the MathJax adapter falls back to the configured asset root.
      checks: { emptyImportMeta: false },
      // Self-contained: React, math rendering and every other dependency are bundled.
      external: () => false,
      output: {
        name: globalName,
        extend: true,
      },
    },
  },
});
