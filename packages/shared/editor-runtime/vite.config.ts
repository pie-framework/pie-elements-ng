import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// One entry per module in pie.browserModules, each built from the package itself, so every
// view exports exactly what its specifier does. Modules shared between specifiers
// (@tiptap/pm/state and prosemirror-state, or StarterKit's extensions) land in common chunks
// and load once per page.
const { pie } = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as {
  pie: { browserModules: Record<string, string> };
};

const input = Object.fromEntries(
  Object.entries(pie.browserModules).map(([specifier, view]) => [`${view}/index`, specifier])
);

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    emptyOutDir: true,
    outDir: resolve(__dirname, 'dist/browser'),
    sourcemap: true,
    // Library mode resolves lib.entry as file paths under the package root, so the specifiers
    // go in as rollupOptions.input, which library mode takes as given and resolves like imports.
    lib: {
      entry: input,
      formats: ['es'],
    },
    rollupOptions: {
      input,
      // Every module is bundled: the runtime imports nothing bare, React included.
      external: () => false,
    },
  },
});
