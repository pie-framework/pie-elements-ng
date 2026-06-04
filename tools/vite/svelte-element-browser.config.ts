import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, esmExternalRequirePlugin } from 'vite';

const packageDir = process.cwd();
const configDir = dirname(fileURLToPath(import.meta.url));
const policyPath = resolve(configDir, 'browser-esm-policy.json');
const browserEsmPolicy = JSON.parse(readFileSync(policyPath, 'utf-8')) as {
  allowedBareImports: string[];
};
const allowedBareImportSpecifiers = browserEsmPolicy.allowedBareImports;
const allowedBareImports = new Set(allowedBareImportSpecifiers);

const entryIfExists = (key: string, relativePath: string): [string, string] | null => {
  const fullPath = resolve(packageDir, relativePath);
  return existsSync(fullPath) ? [key, fullPath] : null;
};

const entries = Object.fromEntries(
  [
    entryIfExists('delivery/index', 'src/delivery/index.ts'),
    entryIfExists('author/index', 'src/author/index.ts'),
    entryIfExists('print/index', 'src/print/index.ts'),
    entryIfExists('controller/index', 'src/controller/index.ts'),
  ].filter((entry): entry is [string, string] => entry !== null)
);

if (Object.keys(entries).length === 0) {
  throw new Error(`No Svelte browser ESM entry points found in ${packageDir}`);
}

export default defineConfig({
  root: packageDir,
  plugins: [
    esmExternalRequirePlugin({
      external: allowedBareImportSpecifiers,
    }),
    {
      name: 'pie-svelte-browser-player-owned-registration',
      transform(code) {
        if (!code.includes('customElements.define(')) {
          return null;
        }
        return code.replaceAll('customElements.define(', 'void (');
      },
    },
    svelte({
      compilerOptions: {
        customElement: true,
      },
      emitCss: false,
    }),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    emptyOutDir: false,
    outDir: resolve(packageDir, 'dist/browser'),
    sourcemap: true,
    commonjsOptions: {
      esmExternals: allowedBareImportSpecifiers,
      strictRequires: false,
      transformMixedEsModules: true,
    },
    lib: {
      entry: entries,
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => allowedBareImports.has(id),
    },
  },
});
