import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const packageDir = process.cwd();
const entry = resolve(packageDir, 'src/index.iife.ts');

if (!existsSync(entry)) {
  throw new Error(`No IIFE entry point (src/index.iife.ts) found in ${packageDir}`);
}

const { name: packageName } = JSON.parse(
  readFileSync(resolve(packageDir, 'package.json'), 'utf-8')
) as { name: string };

// @pie-element/mc-populated-blank -> McPopulatedBlankElement
const globalName = `${packageName
  .replace(/^@[^/]+\//, '')
  .split(/[^a-zA-Z0-9]+/)
  .filter(Boolean)
  .map((segment) => segment[0].toUpperCase() + segment.slice(1))
  .join('')}Element`;

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
  build: {
    emptyOutDir: false,
    lib: {
      entry,
      name: globalName,
      fileName: () => 'index.iife.js',
      formats: ['iife'],
    },
    rolldownOptions: {
      external: () => false,
      output: {
        extend: true,
      },
    },
  },
});
