import type { Plugin, ViteDevServer } from 'vite';
import type { LocalEsmCdnConfig } from '../core/config.js';
import { createLocalEsmCdn } from '../embedded.js';
import path from 'node:path';

/**
 * Create a Vite plugin that serves local PIE packages as ESM modules
 *
 * @param config - Configuration for the local ESM CDN
 * @returns A Vite plugin
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import { createVitePlugin } from '@pie-elements-ng/local-esm-cdn/adapters/vite';
 * import path from 'path';
 *
 * export default defineConfig({
 *   plugins: [
 *     createVitePlugin({
 *       repoRoot: path.resolve(__dirname, '../..'),
 *       esmShBaseUrl: 'https://esm.sh',
 *     })
 *   ],
 * });
 * ```
 */
export function createVitePlugin(config: Partial<LocalEsmCdnConfig>): Plugin {
  const cdn = createLocalEsmCdn(config);
  let server: ViteDevServer | undefined;

  return {
    name: 'vite-plugin-local-esm-cdn',
    enforce: 'pre', // Run before other plugins

    resolveId(id) {
      // Mark PIE packages for handling (with or without leading slash)
      if (id.startsWith('@pie-') || id.startsWith('/@pie-')) {
        // Normalize to always have the leading slash
        const normalizedId = id.startsWith('/@') ? id : `/${id}`;
        console.log(`[vite-plugin-local-esm-cdn] resolveId: ${id} -> ${normalizedId}`);
        return { id: normalizedId, external: false };
      }
      return null;
    },

    async load(id) {
      // Only handle PIE package requests
      if (!id.startsWith('/@pie-')) {
        return null;
      }

      try {
        console.log(`[vite-plugin-local-esm-cdn] Loading: ${id}`);

        // Convert to Web Request
        const url = `http://localhost${id}`;
        const request = new Request(url, {
          method: 'GET',
        });

        // Get response from CDN
        const response = await cdn.handler(request);
        console.log(
          `[vite-plugin-local-esm-cdn] Response: ${response.status} ${response.statusText}`
        );

        if (!response.ok) {
          throw new Error(`Failed to load ${id}: ${response.status} ${response.statusText}`);
        }

        const code = await response.text();
        return { code, map: null };
      } catch (error) {
        console.error('[vite-plugin-local-esm-cdn] Error:', error);
        throw error;
      }
    },

    configureServer(serverInstance) {
      server = serverInstance;

      // Only set up file watching in dev mode
      if (!config.repoRoot) {
        console.warn('[vite-plugin-local-esm-cdn] No repoRoot configured, skipping file watching');
        return;
      }

      // Watch dist directories for changes using Vite's built-in watcher
      const watchPaths = [
        path.join(config.repoRoot, 'packages/elements-react/*/dist/**'),
        path.join(config.repoRoot, 'packages/elements-svelte/*/dist/**'),
        path.join(config.repoRoot, 'packages/lib-react/*/dist/**'),
        path.join(config.repoRoot, 'packages/shared/*/dist/**'),
      ];

      console.log('[vite-plugin-local-esm-cdn] Setting up file watchers for:', watchPaths);

      // Add paths to Vite's watcher
      watchPaths.forEach((pattern) => {
        if (server) {
          server.watcher.add(pattern);
        }
      });

      // Listen for file changes
      server.watcher.on('change', (filePath: string) => {
        // Only process dist files
        if (filePath.includes('/dist/')) {
          console.log(`[vite-plugin-local-esm-cdn] File changed: ${filePath}`);
          invalidateModulesForDistFile(filePath);
        }
      });

      server.watcher.on('add', (filePath: string) => {
        if (filePath.includes('/dist/')) {
          console.log(`[vite-plugin-local-esm-cdn] File added: ${filePath}`);
          invalidateModulesForDistFile(filePath);
        }
      });

      server.watcher.on('unlink', (filePath: string) => {
        if (filePath.includes('/dist/')) {
          console.log(`[vite-plugin-local-esm-cdn] File deleted: ${filePath}`);
          invalidateModulesForDistFile(filePath);
        }
      });
    },
  };

  /**
   * Invalidate Vite modules when a dist file changes
   */
  function invalidateModulesForDistFile(filePath: string) {
    if (!server) return;

    // Extract package name from dist path
    // e.g., .../packages/elements-react/multiple-choice/dist/index.js
    //    -> @pie-element/multiple-choice
    const packageName = getPackageNameFromDistPath(filePath);
    if (!packageName) {
      console.warn(`[vite-plugin-local-esm-cdn] Could not determine package name for: ${filePath}`);
      return;
    }

    console.log(`[vite-plugin-local-esm-cdn] Invalidating modules for package: ${packageName}`);

    // Find all modules that match this package
    const moduleId = `/${packageName}`;
    const modules = server.moduleGraph.getModulesByFile(moduleId);

    if (modules && modules.size > 0) {
      modules.forEach((mod) => {
        console.log(`[vite-plugin-local-esm-cdn] Invalidating module: ${mod.id || mod.url}`);
        if (server) {
          server.moduleGraph.invalidateModule(mod);
        }
      });

      // Trigger HMR update
      if (server) {
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
      }
    } else {
      // Try to find by URL pattern
      const urlPattern = `/@pie-${packageName.split('/')[1]}`;
      const allModules = Array.from(server.moduleGraph.urlToModuleMap.keys());
      const matchingModules = allModules.filter((url) => url.startsWith(urlPattern));

      if (matchingModules.length > 0) {
        console.log(`[vite-plugin-local-esm-cdn] Found ${matchingModules.length} modules to invalidate`);
        matchingModules.forEach((url) => {
          if (server) {
            const mod = server.moduleGraph.urlToModuleMap.get(url);
            if (mod) {
              console.log(`[vite-plugin-local-esm-cdn] Invalidating module: ${url}`);
              server.moduleGraph.invalidateModule(mod);
            }
          }
        });

        // Trigger HMR update
        if (server) {
          server.ws.send({
            type: 'full-reload',
            path: '*',
          });
        }
      }
    }
  }

  /**
   * Extract package name from dist file path
   * e.g., .../packages/elements-react/multiple-choice/dist/index.js
   *    -> @pie-element/multiple-choice
   */
  function getPackageNameFromDistPath(filePath: string): string | null {
    const normalized = path.normalize(filePath);

    // Match patterns for different package types
    const patterns = [
      { regex: /packages\/elements-react\/([^/]+)\/dist/, scope: '@pie-element' },
      { regex: /packages\/elements-svelte\/([^/]+)\/dist/, scope: '@pie-element' },
      { regex: /packages\/lib-react\/([^/]+)\/dist/, scope: '@pie-lib' },
      { regex: /packages\/shared\/([^/]+)\/dist/, scope: '@pie-elements-ng' },
    ];

    for (const { regex, scope } of patterns) {
      const match = normalized.match(regex);
      if (match) {
        return `${scope}/${match[1]}`;
      }
    }

    return null;
  }
}
