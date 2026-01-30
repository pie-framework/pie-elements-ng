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

  build: {
    rollupOptions: {
      external: (id) => {
        // Mark common dependencies that React elements mark as external
        // These match the external configuration in element vite configs
        // to prevent "failed to resolve import" errors during build
        return (
          /^react($|\/)/.test(id) ||
          /^react-dom($|\/)/.test(id) ||
          /^@pie-lib\//.test(id) ||
          /^@pie-element\//.test(id) ||
          /^@pie-framework\//.test(id) ||
          /^@mui\//.test(id) ||
          /^@emotion\//.test(id) ||
          /^d3-/.test(id) ||
          /^@testing-library\//.test(id) ||
          id === 'lodash' ||
          /^lodash\//.test(id) ||
          /^styled-components/.test(id) ||
          id === 'konva' ||
          /^konva\//.test(id) ||
          id === 'react-konva' ||
          /^react-konva\//.test(id) ||
          /^@dnd-kit\//.test(id) ||
          id === '@mdi/react' ||
          /^@mdi\/react\//.test(id) ||
          id === '@mdi/js' ||
          /^@mdi\/js\//.test(id) ||
          [
            'prop-types',
            'classnames',
            'debug',
            'i18next',
            'humps',
            'mathjs',
            'react-jss',
            'js-combinatorics',
            '@mapbox/point-geometry',
            'react-transition-group',
            'nested-property',
            'pluralize',
            'decimal.js',
          ].includes(id)
        );
      },
    },
  },
});
