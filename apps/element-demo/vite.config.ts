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
 * Uses Vite's native module resolution with export conditions:
 * - In development: resolves to src/ files via "development" condition for HMR
 * - In production: resolves to dist/ files via "import" condition
 *
 * Element packages must have proper "exports" fields with "development" conditions.
 *
 * Environment variables:
 * - VITE_ELEMENT_NAME: Name of element to load (e.g., "multiple-choice")
 */
export default defineConfig({
  plugins: [
    // Tailwind v4 optimizes CSS using @tailwindcss/node (LightningCSS). DaisyUI uses the
    // standards-track `@property` at-rule, which currently produces a noisy warning during
    // optimization. Disable Tailwind's optimization pass here; Vite will still minify CSS.
    tailwindcss({ optimize: false }),
    sveltekit(),
  ],

  resolve: {
    // Prefer development exports which point directly to src/ files
    conditions: ['development', 'import', 'default'],
  },

  server: {
    port: Number(process.env.PORT ?? 5222),
    fs: {
      allow: [workspaceRoot],
    },
  },

  optimizeDeps: {
    // Include React in pre-bundling to avoid issues
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    // Exclude workspace packages from pre-bundling to use source directly
    exclude: ['@pie-element/*', '@pie-lib/*'],
  },
});
