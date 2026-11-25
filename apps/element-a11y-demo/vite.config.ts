import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { findWorkspaceRoot, workspaceResolver } from '../../tools/vite/workspace-resolver.ts';

const workspaceRoot = findWorkspaceRoot(process.cwd());

/**
 * Vite config for element demo app.
 *
 * The workspace resolver points @pie-element/* and @pie-lib/* imports at package source.
 */
export default defineConfig({
  plugins: [
    workspaceResolver(),
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
    // SvelteKit serves its own HTML and never runs transformIndexHtml, so the plugin's preamble
    // hooks are dropped: src/app.html injects the React Refresh preamble.
    ...react({
      include: [
        /\/elements-react\/.*\.(jsx|tsx)(?:\?.*)?$/,
        /\/lib-react\/.*\.(jsx|tsx)(?:\?.*)?$/,
      ],
    }).map(({ transformIndexHtml: _preamble, ...plugin }) => plugin),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter({
        fallback: 'index.html',
        strict: false,
      }),
      // Do not process pre-compiled element packages
      exclude: [
        /\/dist\//, // Don't process anything in dist directories
      ],
      dynamicCompileOptions: ({ filename, compileOptions }) => {
        // Workspace element entry components are authored as custom elements.
        // When element-demo resolves package "development" exports to source,
        // force CE compilation for those files only.
        if (
          /\/packages\/elements-svelte\/[^/]+\/src\/(delivery|author|print)\/.*\.svelte$/.test(
            filename
          )
        ) {
          return { ...compileOptions, customElement: true };
        }
        return compileOptions;
      },
    }),
  ],

  // Do not add resolve.conditions: ['development']: it caused infinite HMR loops, even with
  // watch.ignored. workspaceResolver points workspace packages at their source instead.

  resolve: {
    // Keep a single ProseMirror instance across workspace packages.
    // Without this, mixed tiptap/prosemirror imports can register duplicate
    // selection IDs (e.g. gapcursor) and crash module evaluation.
    dedupe: [
      '@tiptap/pm',
      'prosemirror-state',
      'prosemirror-model',
      'prosemirror-view',
      'prosemirror-transform',
      'prosemirror-history',
      'prosemirror-commands',
      'prosemirror-keymap',
      'prosemirror-inputrules',
      'prosemirror-gapcursor',
      'prosemirror-schema-list',
    ],
  },

  server: {
    port: Number(process.env.PORT ?? 5223),
    fs: {
      allow: [workspaceRoot],
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
    rolldownOptions: {
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
