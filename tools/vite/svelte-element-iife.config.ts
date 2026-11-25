import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { englishOnlyCatalogs } from './iife-english-only-catalogs.ts';
import { iifeGlobalName } from './iife-global-name.ts';
import { thirdPartyLicenses } from './third-party-licenses.ts';

const packageDir = process.cwd();
const entry = resolve(packageDir, 'src/index.iife.ts');

if (!existsSync(entry)) {
  throw new Error(`No IIFE entry point (src/index.iife.ts) found in ${packageDir}`);
}

const { name: packageName } = JSON.parse(
  readFileSync(resolve(packageDir, 'package.json'), 'utf-8')
) as { name: string };

const globalName = iifeGlobalName(packageName);

export default defineConfig({
  root: packageDir,
  plugins: [
    thirdPartyLicenses(),
    svelte({
      compilerOptions: {
        customElement: true,
      },
      emitCss: false,
    }),
    englishOnlyCatalogs(),
  ],
  build: {
    emptyOutDir: false,
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
      external: () => false,
      output: {
        extend: true,
      },
    },
  },
});
