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
 * import { createVitePlugin } from '@pie-apps/local-esm-cdn/adapters/vite';
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
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Only handle PIE package requests
        if (!req.url?.startsWith('/@pie-')) {
          return next();
        }

        try {
          // Convert Node.js request to Web Request
          const protocol = req.socket.encrypted ? 'https' : 'http';
          const host = req.headers.host || 'localhost';
          const url = `${protocol}://${host}${req.url}`;

          const request = new Request(url, {
            method: req.method,
            headers: req.headers as HeadersInit,
          });

          // Get response from CDN
          const response = await cdn.handler(request);

          // Convert Web Response to Node.js response
          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });

          const text = await response.text();
          res.end(text);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[vite-plugin-local-esm-cdn] Error:', error);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      });
    },
  };
}
