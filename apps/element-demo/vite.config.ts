import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { findWorkspaceRoot, workspaceResolver } from './src/vite-plugin-workspace-resolver';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';

const workspaceRoot = findWorkspaceRoot(process.cwd());
const bundlerInstanceDir =
  process.env.DEMO_BUNDLER_INSTANCE_DIR || join(process.cwd(), '.cache', 'demo-bundler');
const bundlerOutputDir = join(bundlerInstanceDir, 'bundles');

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
    // Add custom plugin BEFORE sveltekit to intercept and disable Svelte processing for pre-compiled files
    {
      name: 'skip-compiled-svelte-elements',
      enforce: 'pre',
      async transform(code, id) {
        // If this is a pre-compiled Svelte file from element packages, return it as-is
        if (
          id.includes('/dist/') &&
          (id.includes('/elements-svelte/') || id.includes('/lib-svelte/'))
        ) {
          // Return the code without transformation to bypass Svelte plugin
          return {
            code,
            map: null,
          };
        }
      },
    },
    // Transform React TSX/JSX from workspace element packages (SvelteKit does not enable this by default).
    react({
      include: [
        /\/elements-react\/.*\.(jsx|tsx)(?:\?.*)?$/,
        /\/lib-react\/.*\.(jsx|tsx)(?:\?.*)?$/,
      ],
    }),
    {
      name: 'serve-demo-iife-bundles',
      apply: 'serve',
      configureServer(server) {
        if (!bundlerOutputDir) {
          return;
        }

        server.middlewares.use(async (req, res, next) => {
          const requestUrl = req.url ? req.url.split('?')[0] : '';
          if (!requestUrl.startsWith('/bundles/')) {
            next();
            return;
          }

          if (!existsSync(bundlerOutputDir)) {
            next();
            return;
          }

          const relativePath = requestUrl.replace('/bundles/', '');
          const targetPath = join(bundlerOutputDir, relativePath);
          const normalizedRoot = `${bundlerOutputDir}/`;
          if (!targetPath.startsWith(normalizedRoot)) {
            res.statusCode = 400;
            res.end('Invalid bundle path');
            return;
          }

          try {
            const fileStat = await stat(targetPath);
            if (!fileStat.isFile()) {
              next();
              return;
            }
          } catch {
            next();
            return;
          }

          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          createReadStream(targetPath).pipe(res);
        });
      },
    },
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
      allow: [workspaceRoot, bundlerInstanceDir].filter(Boolean),
    },
  },

  optimizeDeps: {
    // Include React in pre-bundling to avoid issues.
    // Do not list d3-shape here: it is not a direct dependency of this app and Vite cannot resolve it
    // until a charting import pulls it in (via @pie-lib/charting / recharts).
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    // Exclude workspace packages and @pie-framework packages to prevent dependency scanning errors
    // These are marked as external in the build config
    exclude: ['@pie-element/*', '@pie-lib/*', '@pie-framework/*'],
    // Vite 8 uses Rolldown for dep optimization.
    // Keep controller dist files external to avoid optimizer scan issues.
    rolldownOptions: {
      external: [/\/dist\/controller\//],
    },
  },

  build: {
    rollupOptions: {
      external: (id) => {
        // Mark common dependencies that React and Svelte elements mark as external
        // These match the external configuration in element vite configs
        // to prevent "failed to resolve import" errors during build
        return (
          /^react($|\/)/.test(id) ||
          /^react-dom($|\/)/.test(id) ||
          /^svelte($|\/)/.test(id) ||
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
          id === 'recharts' ||
          /^recharts\//.test(id) ||
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
