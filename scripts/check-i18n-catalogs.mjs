#!/usr/bin/env bun
/**
 * Gate for the co-located interface catalogs read by `@pie-element/shared-i18n`, ported from
 * pie-players' `pie-i18n-generated/scripts/check-catalogs.ts`.
 *
 * Every package that owns strings keeps them in `src/i18n/`: `en-US.ts` as the source, one
 * `<tag>.ts` per shipped locale, `index.ts` declaring the loaders, and `catalog-manifest.json`
 * recording each locale's status. Enforced for every locale:
 *
 * - the locale file, its loader in `index.ts` and its manifest entry exist together;
 * - key parity both ways, since a missing key falls back to English silently and an extra key is
 *   unreachable;
 * - leaf kind parity, `other` in every plural group, and placeholder parity per form;
 * - no i18next `{{name}}` slot, which the engine renders literally.
 *
 * Freshness depends on the manifest status. `generated` is machine output nobody reviewed: it
 * records the hash of the English it came from and fails on any English change, and regenerates
 * whole. `reviewed` carries human work that regeneration must not clobber: the manifest holds an
 * English snapshot per key, and only the keys whose English moved fail, to be re-translated
 * alone before `scripts/write-i18n-english-snapshot.mjs` moves the anchor.
 *
 * Runs under bun, which imports the TypeScript catalogs directly.
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  findCatalogDirectories,
  flatten,
  placeholders,
  SOURCE_LOCALE,
} from './lib/i18n-catalog-shape.mjs';

const root = process.cwd();
const STATUSES = new Set(['generated', 'reviewed']);
const LOADER = /['"]?([A-Za-z]{2,3}(?:-[A-Za-z0-9]{1,8})*)['"]?\s*:\s*\(\)\s*=>\s*import\(/g;
const I18NEXT_SLOT = /\{\{\s*[A-Za-z_][A-Za-z0-9_]*\s*\}\}/;

const errors = [];
const rows = [];

const listKeys = (keys) =>
  keys.length <= 10
    ? keys.join(', ')
    : `${keys.slice(0, 10).join(', ')} … and ${keys.length - 10} more`;

const texts = (leaf) => (leaf.kind === 'string' ? [['', leaf.value]] : Object.entries(leaf.value));

function checkLeafSyntax(label, locale, key, leaf) {
  if (leaf.kind === 'plural' && typeof leaf.value.other !== 'string') {
    errors.push(`${label} ${locale}: plural group ${key} has no 'other'`);
  }
  for (const [category, text] of texts(leaf)) {
    if (I18NEXT_SLOT.test(text)) {
      const at = category ? `${key}.${category}` : key;
      errors.push(`${label} ${locale}: ${at} uses an i18next {{slot}}; write {slot}`);
    }
  }
}

async function loadCatalog(path) {
  return (await import(path)).default;
}

for (const { path: dir, label } of findCatalogDirectories(root)) {
  let english;
  try {
    english = flatten(await loadCatalog(join(dir, `${SOURCE_LOCALE}.ts`)));
  } catch (error) {
    errors.push(`${label}: ${SOURCE_LOCALE}.ts failed to load: ${String(error)}`);
    continue;
  }
  for (const [key, leaf] of english) checkLeafSyntax(label, SOURCE_LOCALE, key, leaf);
  const sourceHash = createHash('sha256')
    .update(JSON.stringify(await loadCatalog(join(dir, `${SOURCE_LOCALE}.ts`))))
    .digest('hex');

  const files = new Set(
    readdirSync(dir)
      .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.d.ts'))
      .map((file) => file.slice(0, -3))
      .filter((tag) => tag !== SOURCE_LOCALE)
  );
  let loaders = new Set();
  try {
    const index = readFileSync(join(dir, 'index.ts'), 'utf8');
    loaders = new Set(Array.from(index.matchAll(LOADER), (match) => match[1]));
  } catch {
    errors.push(`${label}: no index.ts declaring the catalogs`);
  }
  let manifest = { locales: {} };
  try {
    manifest = JSON.parse(readFileSync(join(dir, 'catalog-manifest.json'), 'utf8'));
  } catch {
    if (files.size > 0) errors.push(`${label}: no readable catalog-manifest.json`);
  }
  const manifestLocales = new Set(Object.keys(manifest.locales ?? {}));

  for (const tag of new Set([...files, ...loaders, ...manifestLocales])) {
    const missingFrom = [
      !files.has(tag) && `${tag}.ts`,
      !loaders.has(tag) && 'the loaders in index.ts',
      !manifestLocales.has(tag) && 'catalog-manifest.json',
    ].filter(Boolean);
    if (missingFrom.length > 0) {
      errors.push(`${label} ${tag}: absent from ${missingFrom.join(' and ')}`);
    }
  }

  const summary = [];
  for (const locale of [...files].sort()) {
    const entry = manifest.locales?.[locale];
    if (!entry) continue;
    if (!STATUSES.has(entry.status)) {
      errors.push(
        `${label} ${locale}: unknown manifest status "${entry.status}" (generated | reviewed)`
      );
      continue;
    }

    let fresh = true;
    if (entry.status === 'generated') {
      if (entry.sourceHash !== sourceHash) {
        fresh = false;
        errors.push(
          `${label} ${locale}: generated from English ${entry.sourceHash ?? '(none recorded)'}, English is now ${sourceHash}; regenerate the whole catalog`
        );
      }
    } else {
      const snapshot = entry.english ?? {};
      const known = new Set(Object.keys(snapshot));
      const added = [...english.keys()].filter((key) => !known.has(key));
      const removed = [...known].filter((key) => !english.has(key));
      const changed = [...english.keys()].filter(
        (key) =>
          known.has(key) && JSON.stringify(snapshot[key]) !== JSON.stringify(english.get(key).value)
      );
      if (added.length > 0)
        errors.push(
          `${label} ${locale}: English added keys the snapshot lacks: ${listKeys(added)}`
        );
      if (removed.length > 0)
        errors.push(
          `${label} ${locale}: the snapshot holds keys English dropped: ${listKeys(removed)}`
        );
      if (changed.length > 0) {
        errors.push(
          `${label} ${locale}: English changed under reviewed translations: ${listKeys(changed)}; re-translate only these, then run scripts/write-i18n-english-snapshot.mjs`
        );
      }
      fresh = added.length + removed.length + changed.length === 0;
    }

    let localized;
    try {
      localized = flatten(await loadCatalog(join(dir, `${locale}.ts`)));
    } catch (error) {
      errors.push(`${label} ${locale}: catalog failed to load: ${String(error)}`);
      continue;
    }
    for (const key of english.keys()) {
      if (!localized.has(key))
        errors.push(`${label} ${locale}: missing ${key} (falls back to English silently)`);
    }
    for (const key of localized.keys()) {
      if (!english.has(key))
        errors.push(`${label} ${locale}: ${key} is not defined by ${SOURCE_LOCALE}`);
    }
    for (const [key, leaf] of localized) {
      checkLeafSyntax(label, locale, key, leaf);
      const source = english.get(key);
      if (!source) continue;
      if (source.kind !== leaf.kind) {
        errors.push(
          `${label} ${locale}: ${key} is a ${leaf.kind} where ${SOURCE_LOCALE} has a ${source.kind}`
        );
        continue;
      }
      // A locale may carry plural forms English lacks (Arabic `few`); each is held to `other`'s slots.
      for (const [category, text] of texts(leaf)) {
        const reference =
          source.kind === 'string' ? source.value : (source.value[category] ?? source.value.other);
        const expected = placeholders(reference);
        const found = placeholders(text);
        const at = category ? `${key}.${category}` : key;
        for (const slot of expected) {
          if (!found.has(slot)) errors.push(`${label} ${locale}: ${at} lost placeholder {${slot}}`);
        }
        for (const slot of found) {
          if (!expected.has(slot))
            errors.push(`${label} ${locale}: ${at} introduces unknown placeholder {${slot}}`);
        }
      }
    }
    summary.push(`${locale} ${entry.status}${fresh ? '' : ' stale'}`);
  }
  rows.push(`${label}: ${english.size} keys${summary.length ? `; ${summary.join(', ')}` : ''}`);
}

for (const row of rows) console.log(row);
if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL ${error}`);
  console.error(
    `\n${errors.length} i18n catalog error(s). packages/shared/i18n/README.md has the catalog lifecycle.`
  );
  process.exit(1);
}
