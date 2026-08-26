import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

function resolveBunPackageEntry(packageName: string, entryFile: string): string | undefined {
  const storeDirectory = resolve(__dirname, '../../../node_modules/.bun');
  const prefix = `${packageName}@`;
  let entries: string[];
  try {
    entries = readdirSync(storeDirectory)
      .filter((entry) => entry.startsWith(prefix))
      .sort()
      .reverse();
  } catch {
    return undefined;
  }

  for (const entry of entries) {
    const candidate = resolve(storeDirectory, entry, 'node_modules', packageName, entryFile);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

const domPurifyEntry = resolveBunPackageEntry('dompurify', 'dist/purify.es.mjs');
const aliases: Record<string, string> = {
  '@pie-lib/media-svelte': resolve(
    __dirname,
    '../../../packages/lib-svelte/media-svelte/src/index.ts'
  ),
};
if (domPurifyEntry) aliases.dompurify = domPurifyEntry;

export default defineConfig({
  plugins: [svelte({ compilerOptions: { customElement: true } })],
  resolve: {
    conditions: ['browser'],
    alias: aliases,
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [resolve(__dirname, '../../../vitest.setup.ts')],
    include: ['tests/**/*.test.ts'],
  },
});
