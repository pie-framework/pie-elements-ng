import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
          return 'export default function debug() { return () => {}; }';
        }
        if (id === '\0iife-prop-types-shim') {
          return "const fn = () => null; const types = new Proxy(fn, { get: () => fn }); export default types;";
        }
      },
    },
    react(),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    emptyOutDir: false, // Don't wipe existing ESM builds
    lib: {
      entry: resolve(__dirname, 'src/index.iife.ts'),
      name: 'ChartingElement',
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
        name: 'ChartingElement',
        extend: true,
      },
    },
  },
});
