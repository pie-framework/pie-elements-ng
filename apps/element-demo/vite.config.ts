import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(__dirname, '../..');

/**
 * Simplified Vite config for element demo app.
 *
 * Temporarily simplified to debug looping issue.
 */
export default defineConfig({
  plugins: [
    tailwindcss({ optimize: false }),
    sveltekit(),
  ],

  // Removed resolve.conditions with 'development' - it was causing infinite loops
  // by making Vite watch source files in workspace packages
  // resolve: {
  //   conditions: ['development', 'import', 'default'],
  // },

  server: {
    port: Number(process.env.PORT ?? 5222),
    fs: {
      allow: [workspaceRoot],
    },
  },

  optimizeDeps: {
    // Include React in pre-bundling to avoid issues
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    // Note: Not excluding workspace packages to prevent infinite HMR loops
    // exclude: ['@pie-element/*', '@pie-lib/*'],
  },
});
