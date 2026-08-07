import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const packageDir = process.cwd();

const resolvePrintEntry = (): string | null => {
  for (const candidate of ['src/print/index.tsx', 'src/print/index.ts']) {
    const fullPath = resolve(packageDir, candidate);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
};

const printEntry = resolvePrintEntry();

// Most packages have no print component. This build lane exists only to
// produce a legacy-compatible print artifact (see docs/PRINT_SUPPORT.md),
// so packages without one are a no-op rather than an error — the same
// `vite build --config .../element-legacy-print.config.ts` invocation is
// safe to run unconditionally from every package's build script.
if (!printEntry) {
  console.log(`[element-legacy-print] no print entry in ${packageDir} — skipping`);
  process.exit(0);
}

const packageJson = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf-8')) as {
  name?: string;
  version?: string;
};

export default defineConfig({
  root: packageDir,
  plugins: [react()],
  define: {
    __PIE_PACKAGE_NAME__: JSON.stringify(packageJson.name ?? ''),
    __PIE_PACKAGE_VERSION__: JSON.stringify(packageJson.version ?? 'local'),
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: resolve(packageDir, 'module'),
    emptyOutDir: true,
    sourcemap: true,
    commonjsOptions: {
      strictRequires: false,
      transformMixedEsModules: true,
    },
    lib: {
      entry: printEntry,
      fileName: () => 'print.js',
      formats: ['es'],
    },
    rollupOptions: {
      // Self-contained on purpose: the legacy @pie-framework/pie-print client
      // loads this file with a bare `import(url)` and injects no import map
      // (not even for React), so nothing here can be an external bare
      // specifier. See docs/prds/legacy-print-compatibility/PRD.md.
      external: () => false,
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
