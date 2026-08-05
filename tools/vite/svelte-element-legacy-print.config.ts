import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const packageDir = process.cwd();

const resolvePrintEntry = (): string | null => {
  for (const candidate of ['src/print/index.ts', 'src/print/index.tsx']) {
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
// `vite build --config .../svelte-element-legacy-print.config.ts` invocation
// is safe to run unconditionally from every package's build script.
if (!printEntry) {
  console.log(`[svelte-element-legacy-print] no print entry in ${packageDir} — skipping`);
  process.exit(0);
}

export default defineConfig({
  root: packageDir,
  plugins: [
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
    outDir: resolve(packageDir, 'module'),
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: printEntry,
      fileName: () => 'print.js',
      formats: ['es'],
    },
    rollupOptions: {
      // Self-contained on purpose: the legacy @pie-framework/pie-print client
      // loads this file with a bare `import(url)` and injects no import map,
      // so nothing here can be an external bare specifier. See
      // docs/prds/legacy-print-compatibility/PRD.md.
      external: () => false,
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
