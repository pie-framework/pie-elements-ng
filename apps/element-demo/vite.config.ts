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

  resolve: {
    alias: {
      // Fix @pie-framework/math-validation resolution issue
      // The package has module: "src/index.ts" which doesn't exist in installed package
      // Force Vite to use the main field (lib/index.js) instead
      '@pie-framework/math-validation': '@pie-framework/math-validation/lib/index.js',
    },
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
    // Exclude workspace packages and @pie-framework packages to prevent dependency scanning errors
    // These are marked as external in the build config
    exclude: ['@pie-element/*', '@pie-lib/*', '@pie-framework/*'],
    // Tell esbuild not to scan controller dist files or other problematic paths
    esbuildOptions: {
      plugins: [
        {
          name: 'exclude-controller-dist',
          setup(build) {
            // Ignore controller dist files from dependency scanning
            build.onResolve({ filter: /.*\/dist\/controller\/.*/ }, () => ({
              path: 'ignored',
              external: true,
            }));
          },
        },
      ],
    },
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
