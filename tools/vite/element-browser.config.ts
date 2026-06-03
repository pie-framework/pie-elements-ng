import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const packageDir = process.cwd();
const configDir = dirname(fileURLToPath(import.meta.url));
const policyPath = resolve(configDir, 'browser-esm-policy.json');
const browserEsmPolicy = JSON.parse(readFileSync(policyPath, 'utf-8')) as {
  allowedBareImports: string[];
};
const allowedBareImports = new Set(browserEsmPolicy.allowedBareImports);

const entryIfExists = (key: string, relativePath: string): [string, string] | null => {
  const fullPath = resolve(packageDir, relativePath);
  return existsSync(fullPath) ? [key, fullPath] : null;
};

const entries = Object.fromEntries(
  [
    entryIfExists('delivery/index', 'src/delivery/index.ts'),
    entryIfExists('delivery/index', 'src/delivery/index.tsx'),
    entryIfExists('author/index', 'src/author/index.ts'),
    entryIfExists('author/index', 'src/author/index.tsx'),
    entryIfExists('print/index', 'src/print/index.ts'),
    entryIfExists('print/index', 'src/print/index.tsx'),
    entryIfExists('controller/index', 'src/controller/index.ts'),
    entryIfExists('controller/index', 'src/controller/index.tsx'),
  ].filter((entry): entry is [string, string] => entry !== null)
);

if (Object.keys(entries).length === 0) {
  throw new Error(`No browser ESM entry points found in ${packageDir}`);
}

export default defineConfig({
  root: packageDir,
  plugins: [
    {
      name: 'pie-browser-player-owned-registration',
      transform(code) {
        if (!code.includes('customElements.define(')) {
          return null;
        }
        return code.replaceAll('customElements.define(', 'void (');
      },
    },
    react(),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    emptyOutDir: false,
    outDir: resolve(packageDir, 'dist/browser'),
    sourcemap: true,
    lib: {
      entry: entries,
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => allowedBareImports.has(id),
    },
  },
});
