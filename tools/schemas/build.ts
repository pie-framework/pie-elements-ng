/**
 * Writes the package's JSON Schemas to `dist/schemas/<kind>.schema.json`.
 *
 * Runs as the last step of an element's `build` script, from the package directory:
 * `bun ../../../tools/schemas/build.ts`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateElementSchemas, readElementManifest } from './generate.ts';

const packageDir = process.cwd();
const schemas = Object.entries(generateElementSchemas(packageDir));

if (schemas.length === 0) {
  throw new Error(
    `${readElementManifest(packageDir).name} declares no ./schemas/*.schema.json exports`
  );
}

const outDir = join(packageDir, 'dist/schemas');
mkdirSync(outDir, { recursive: true });
for (const [kind, schema] of schemas) {
  writeFileSync(join(outDir, `${kind}.schema.json`), `${JSON.stringify(schema, null, 2)}\n`);
}
