import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const packagesRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../packages');

const CATALOG_INDEX = /\/(?:src|dist)\/i18n\/index\.(?:ts|js)$/;

/**
 * Ships an IIFE bundle in English: drops every locale loader from the workspace catalog modules
 * it inlines. A single file has no base URL for a chunk, so a shipped locale would cost every
 * English page its bytes; a host serves any other locale through `registerMessages`.
 */
export function englishOnlyCatalogs(): Plugin {
  return {
    name: 'iife-english-only-catalogs',
    enforce: 'pre',
    transform(code, rawId) {
      const id = rawId.split('?')[0];
      if (
        !id.startsWith(packagesRoot) ||
        id.includes('/node_modules/') ||
        !CATALOG_INDEX.test(id)
      ) {
        return null;
      }
      const stripped = code.replace(/loaders:\s*\{[^{}]*\}/, 'loaders: {}');
      if (/\bimport\(/.test(stripped)) {
        throw new Error(`${id}: a locale loader the English-only IIFE build cannot strip`);
      }
      return { code: stripped, map: null };
    },
  };
}
