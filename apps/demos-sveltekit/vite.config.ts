import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    // Critical for @pie-element/* module builds: they contain relative imports that expect to resolve
    // from the symlinked location under apps/demos-data/node_modules (not Bun's global store path).
    preserveSymlinks: true,
  },
  server: {
    fs: {
      // We import demo artifacts from a sibling directory (`apps/demos-data/**`).
      // Allow Vite to read outside the app root, but keep it scoped to the monorepo.
      allow: [
        resolve(__dirname, '..'),
        resolve(__dirname, '..', 'demos-data'),
        resolve(__dirname, '..', '..'),
      ],
    },
  },
});
