import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { findWorkspaceRoot, workspaceResolver } from './src/vite-plugin-workspace-resolver';
import { createReadStream, existsSync, readdirSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';

const workspaceRoot = findWorkspaceRoot(process.cwd());
const bundlerInstanceDir =
  process.env.DEMO_BUNDLER_INSTANCE_DIR || join(process.cwd(), '.cache', 'demo-bundler');
const bundlerOutputDir = join(bundlerInstanceDir, 'bundles');

/**
 * Pin a package to a single physical directory by scanning Bun's content
 * store (`node_modules/.bun/<pkg>@<version>/node_modules/<pkg>`).
 *
 * Why this is needed:
 *   Bun's nested layout installs multiple copies of some prosemirror plugins
 *   (e.g. prosemirror-gapcursor 1.4.0 AND 1.4.1, pulled in by different tiptap
 *   versions) and does NOT hoist them to the root `node_modules`. So plain
 *   Node resolution from the workspace root fails, and `resolve.dedupe` cannot
 *   collapse them because they live in unrelated subtrees. The dep optimizer
 *   then inlines two different gapcursor copies into separate optimized
 *   chunks; both run `Selection.jsonID('gapcursor', GapCursor)` against the
 *   shared `prosemirror-state` Selection class, throwing "Duplicate use of
 *   selection JSON ID gapcursor". That crash breaks the ESM author/configure
 *   view of every tiptap-based element.
 *
 *   Aliasing each bare specifier to ONE absolute directory makes the optimizer
 *   treat every reference as the same module, so it executes once. We pick the
 *   highest installed version. Returns undefined (alias skipped) if nothing is
 *   found, so config evaluation never crashes.
 */
function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

const bunStoreDir = join(workspaceRoot, 'node_modules', '.bun');
function resolveSingletonDir(pkg: string): string | undefined {
  let storeEntries: string[];
  try {
    storeEntries = readdirSync(bunStoreDir);
  } catch {
    return undefined;
  }
  // Store entries look like "prosemirror-gapcursor@1.4.1". Match exactly this
  // package name (not e.g. "prosemirror-gapcursor-x@...") by requiring "@<digit>".
  const prefix = `${pkg}@`;
  const versions = storeEntries
    .filter((e) => e.startsWith(prefix) && /\d/.test(e.charAt(prefix.length)))
    .map((e) => ({ entry: e, version: e.slice(prefix.length) }))
    .sort((x, y) => compareSemver(y.version, x.version));

  for (const { entry } of versions) {
    const dir = join(bunStoreDir, entry, 'node_modules', pkg);
    if (existsSync(join(dir, 'package.json'))) return dir;
  }
  return undefined;
}

const proseMirrorSingletonAliases = Object.fromEntries(
  // Packages that register a global identity (selection JSON ID, plugin key
  // class, etc.) and therefore MUST be a single instance across the bundle.
  [
    'prosemirror-state',
    'prosemirror-gapcursor',
    'prosemirror-view',
    'prosemirror-transform',
    'prosemirror-model',
    'prosemirror-keymap',
    'prosemirror-commands',
    'prosemirror-history',
    'prosemirror-inputrules',
    'prosemirror-schema-list',
  ]
    .map((pkg) => [pkg, resolveSingletonDir(pkg)] as const)
    .filter(([, dir]) => dir !== undefined) as [string, string][]
);

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
    // NOTE: The React Refresh preamble is injected directly in `src/app.html`,
    // not by a Vite plugin. SvelteKit serves its own HTML and skips Vite's
    // `transformIndexHtml` pipeline, so plugin-based injection never fires.
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
      // See proseMirrorSingletonAliases comment above. Aliasing each pkg's
      // bare specifier to its single resolved directory forces every chunk
      // (including dep-optimizer pre-bundles) to share one physical copy.
      ...proseMirrorSingletonAliases,
    },
    // Keep a single ProseMirror instance across workspace packages.
    // Without this, mixed tiptap/prosemirror imports can register duplicate
    // selection IDs (e.g. gapcursor) and crash module evaluation.
    //
    // `react-transition-group` is deduped because likert pins ^2.3.1 (a
    // stale, unused dep) while every other element/lib uses v4's named
    // exports. Bun's nested layout otherwise lets Vite's dep optimizer
    // pick the v2 CJS index, which only re-exports `default`, breaking
    // `import { CSSTransition } from 'react-transition-group'` at runtime
    // (the symptom is the ESM view of every React element failing to load).
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
      'react-transition-group',
    ],
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
    // Exclude workspace packages and @pie-framework packages to prevent dependency scanning errors.
    exclude: ['@pie-element/*', '@pie-lib/*', '@pie-framework/*'],
    // Vite 8 uses Rolldown for dep optimization.
    // Keep controller dist files external to avoid optimizer scan issues.
    rolldownOptions: {
      external: [/\/dist\/controller\//],
    },
  },

  ssr: {
    external: ['@pie-element/element-bundler', 'lightningcss'],
  },

  build: {
    rollupOptions: {
      external: (id) =>
        id === 'lightningcss/package.json' ||
        id === 'canvas' ||
        id === '@pie-element/element-bundler' ||
        id.startsWith('@pie-element/element-bundler/') ||
        id.includes('/packages/shared/bundler-shared/'),
    },
  },
});
