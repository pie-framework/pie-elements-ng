/**
 * Catalog-shape rules shared by the i18n catalog gate and the English-snapshot writer, ported
 * from pie-players' `pie-i18n-generated/scripts/lib/catalog-shape.ts` so both repositories agree
 * on what a key is.
 *
 * A plural group is one leaf, as `NestedKeys` and `plural()` in `@pie-element/shared-i18n` treat
 * it, recognized by every one of its keys being a CLDR plural category.
 */

import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const PLURAL_CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

export const PLACEHOLDER = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

/** The English catalog a package's `src/i18n` directory is anchored to. */
export const SOURCE_LOCALE = 'en-US';

export function isPluralGroup(node) {
  if (typeof node !== 'object' || node === null || Array.isArray(node)) return false;
  const keys = Object.keys(node);
  return keys.length > 0 && keys.every((key) => PLURAL_CATEGORIES.has(key));
}

/** Flatten a catalog to dot-path leaves: `{ kind: 'string' | 'plural', value }`. */
export function flatten(node, prefix = '', out = new Map()) {
  if (isPluralGroup(node)) {
    out.set(prefix, { kind: 'plural', value: node });
    return out;
  }
  if (typeof node === 'string') {
    out.set(prefix, { kind: 'string', value: node });
    return out;
  }
  if (typeof node !== 'object' || node === null) {
    throw new Error(`Unexpected leaf at ${prefix || '(root)'}`);
  }
  for (const [key, value] of Object.entries(node)) {
    flatten(value, prefix ? `${prefix}.${key}` : key, out);
  }
  return out;
}

export function placeholders(text) {
  return new Set(Array.from(text.matchAll(PLACEHOLDER), (match) => match[1]));
}

/** Every `src/i18n` directory under `packages/` that carries an `en-US.ts` catalog. */
export function findCatalogDirectories(root) {
  const found = [];
  const walk = (dir, depth) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue;
      const path = join(dir, entry);
      if (!statSync(path).isDirectory()) continue;
      if (entry === 'i18n' && dir.endsWith('/src')) {
        try {
          if (statSync(join(path, `${SOURCE_LOCALE}.ts`)).isFile()) found.push(path);
        } catch {
          // An `i18n` directory without an English catalog is not a catalog directory.
        }
        continue;
      }
      if (depth < 4) walk(path, depth + 1);
    }
  };
  walk(join(root, 'packages'), 0);
  return found.sort().map((path) => ({ path, label: relative(root, path) }));
}
