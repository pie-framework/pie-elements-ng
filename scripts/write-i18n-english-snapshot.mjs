#!/usr/bin/env bun
/**
 * Anchor a reviewed locale to the English it was reviewed against, so the catalog gate can list
 * exactly the keys whose English moved since. Run it when a locale becomes `reviewed` and after
 * re-translating the keys the gate listed.
 *
 * Usage: bun scripts/write-i18n-english-snapshot.mjs <package>/src/i18n <locale>
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { flatten, SOURCE_LOCALE } from './lib/i18n-catalog-shape.mjs';

const [dirArg, locale] = process.argv.slice(2);
if (!dirArg || !locale) {
  console.error('Usage: bun scripts/write-i18n-english-snapshot.mjs <package>/src/i18n <locale>');
  process.exit(1);
}
const dir = resolve(dirArg);
const manifestPath = join(dir, 'catalog-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entry = manifest.locales?.[locale];
if (entry?.status !== 'reviewed') {
  console.error(
    `${locale}: status is ${JSON.stringify(entry?.status)}. Only a reviewed locale carries a snapshot; a generated one regenerates whole.`
  );
  process.exit(1);
}

const english = flatten((await import(join(dir, `${SOURCE_LOCALE}.ts`))).default);
entry.english = Object.fromEntries([...english].map(([key, leaf]) => [key, leaf.value]));
entry.reviewedAt = new Date().toISOString().slice(0, 10);
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${locale}: anchored ${english.size} English keys in ${manifestPath}`);
