import type { Plugin } from 'vite';
import type { LocalEsmCdnConfig } from '../core/config.js';
import { createLocalEsmCdn } from '../embedded.js';

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
  };
}
