import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createGenerator } from 'ts-json-schema-generator';

/**
 * JSON Schema generation for an element's contract types.
 *
 * An element declares its contract in `src/types.ts` as `<Name>Model`, `<Name>Configuration` and
 * `<Name>Session`, where `<Name>` is the PascalCase package name. Which schemas it publishes is set
 * by its `exports`: each `./schemas/<kind>.schema.json` entry is generated from the matching type.
 */

export const SCHEMA_KINDS = ['model', 'configuration', 'session'] as const;

export type SchemaKind = (typeof SCHEMA_KINDS)[number];

type JsonSchema = Record<string, unknown>;

type ElementManifest = {
  name: string;
  version: string;
  exports?: Record<string, unknown>;
};

const TYPE_SUFFIX: Record<SchemaKind, string> = {
  model: 'Model',
  configuration: 'Configuration',
  session: 'Session',
};

// The authored model and configuration are closed at the root, as in the legacy schemas, so a
// misspelled top-level key fails validation. Nested objects and the session, which players and
// controllers write extra state into, stay open.
const CLOSED_ROOT: Record<SchemaKind, boolean> = {
  model: true,
  configuration: true,
  session: false,
};

export const schemaExportKey = (kind: SchemaKind) => `./schemas/${kind}.schema.json`;

export const readElementManifest = (packageDir: string): ElementManifest =>
  JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf-8')) as ElementManifest;

/** The schema kinds a package publishes, in `SCHEMA_KINDS` order. */
export const declaredSchemaKinds = (manifest: ElementManifest): SchemaKind[] =>
  SCHEMA_KINDS.filter((kind) => manifest.exports?.[schemaExportKey(kind)] !== undefined);

/** `@pie-element/multiple-choice` → `MultipleChoice`. */
export const typeNamePrefix = (packageName: string) =>
  (packageName.split('/').pop() ?? packageName)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

export const schemaTypeName = (packageName: string, kind: SchemaKind) =>
  `${typeNamePrefix(packageName)}${TYPE_SUFFIX[kind]}`;

/** Where the published schema resolves: the versioned file on jsDelivr. */
export const schemaId = (manifest: ElementManifest, kind: SchemaKind) =>
  `https://cdn.jsdelivr.net/npm/${manifest.name}@${manifest.version}/dist/schemas/${kind}.schema.json`;

// `@deprecated reason` arrives as a string; JSON Schema's `deprecated` is a boolean, so the reason
// moves into the description.
const normalizeDeprecated = (node: unknown): void => {
  if (Array.isArray(node)) {
    for (const item of node) normalizeDeprecated(item);
    return;
  }
  if (!node || typeof node !== 'object') return;
  const schema = node as JsonSchema;
  if (typeof schema.deprecated === 'string') {
    const reason = schema.deprecated.trim();
    schema.description = [schema.description, reason && `Deprecated: ${reason}`]
      .filter(Boolean)
      .join('\n\n');
    schema.deprecated = true;
  }
  for (const value of Object.values(schema)) normalizeDeprecated(value);
};

// TypeScript reads `@scope/name` in a JSDoc comment as a tag and drops the description from there
// on, so a package name in a comment sits in backticks.
const assertNoBarePackageNames = (typesPath: string): void => {
  for (const [comment] of readFileSync(typesPath, 'utf-8').matchAll(/\/\*\*[\s\S]*?\*\//g)) {
    const bare = comment.replace(/`[^`]*`/g, '').match(/(?:^|\s)(@[\w-]+\/[\w-]+)/);
    if (bare) {
      throw new Error(`${typesPath}: wrap ${bare[1]} in backticks; JSDoc reads it as a tag`);
    }
  }
};

/** Generates every schema the package at `packageDir` declares, keyed by kind. */
export const generateElementSchemas = (
  packageDir: string
): Partial<Record<SchemaKind, JsonSchema>> => {
  const manifest = readElementManifest(packageDir);
  const kinds = declaredSchemaKinds(manifest);
  if (kinds.length === 0) return {};

  const typesPath = join(packageDir, 'src/types.ts');
  if (!existsSync(typesPath)) {
    throw new Error(`${manifest.name} declares schema exports but has no src/types.ts`);
  }
  assertNoBarePackageNames(typesPath);

  const generator = createGenerator({
    path: typesPath,
    tsconfig: join(packageDir, 'tsconfig.json'),
    expose: 'export',
    topRef: false,
    jsDoc: 'extended',
    skipTypeCheck: true,
    additionalProperties: true,
  });

  const schemas: Partial<Record<SchemaKind, JsonSchema>> = {};
  for (const kind of kinds) {
    const { $schema, ...body } = generator.createSchema(
      schemaTypeName(manifest.name, kind)
    ) as JsonSchema;
    normalizeDeprecated(body);
    schemas[kind] = {
      $schema,
      $id: schemaId(manifest, kind),
      ...body,
      ...(CLOSED_ROOT[kind] ? { additionalProperties: false } : {}),
    };
  }
  return schemas;
};
