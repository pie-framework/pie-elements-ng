import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { findWorkspaceRoot, workspaceResolver } from './src/vite-plugin-workspace-resolver';

const workspaceRoot = findWorkspaceRoot(process.cwd());

/**
 * Vite config for element demo app.
 *
 * Uses workspace resolver to handle @pie-element/* and @pie-lib/* imports.
 * Set resolveSources: true to use source files (enables HMR but may cause loops).
 * Set resolveSources: false to use dist files (prevents loops but no HMR for workspace packages).
 */
export default defineConfig({
  plugins: [
    workspaceResolver({
      resolveSources: true, // Use source files for proper resolution
      debug: false,
    }),
    tailwindcss({ optimize: false }),
    sveltekit(),
  ],

  // IMPORTANT: DO NOT add resolve.conditions with 'development'
  // Even with watch.ignored, it still causes infinite HMR loops
  // The loops happen because:
  // 1. Vite resolves to source files in workspace packages
  // 2. Changes in demo app trigger HMR
  // 3. HMR reads workspace source files
  // 4. This triggers file system events that cascade
  // 5. Loop continues indefinitely
  //
  // Solution: Use built dist files (default condition) and ensure
  // all dependencies are properly bundled or available

  server: {
    port: Number(process.env.PORT ?? 5222),
    fs: {
      allow: [workspaceRoot],
    },
  },

  optimizeDeps: {
    // Include React in pre-bundling to avoid issues
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    // Note: Not excluding workspace packages to prevent issues
    // exclude: ['@pie-element/*', '@pie-lib/*'],
  },
});
