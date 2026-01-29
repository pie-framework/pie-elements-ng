import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
// Import plugin directly from source (no build needed)
import { findWorkspaceRoot, workspaceResolver } from './src/vite-plugin-workspace-resolver';

const workspaceRoot = findWorkspaceRoot(process.cwd());

/**
 * Generic Vite config for shared element demo app.
 *
 * Dynamically adds aliases for the element being loaded based on environment variables.
 * This allows proper resolution of element imports and their dependencies.
 *
 * Element info passed via environment variables:
 * - VITE_ELEMENT_NAME (e.g., "multiple-choice")
 * - VITE_ELEMENT_PATH (e.g., "packages/elements-react/multiple-choice")
 * - VITE_ELEMENT_TYPE (e.g., "react" or "svelte")
 */
export default defineConfig({
  plugins: [
    // Resolve workspace:* dependencies to source files
    workspaceResolver({
      resolveSources: true,
      debug: false, // Set to true to debug resolution
    }),
    tailwindcss(),
    sveltekit(),
  ],

  server: {
    port: Number(process.env.PORT ?? 5222),
    fs: {
      allow: [workspaceRoot],
    },
  },

  optimizeDeps: {
    // Include React in pre-bundling to avoid issues
    include: ['react', 'react-dom', 'react/jsx-runtime'],
  },
});
