import type { PieDocsDefinition, PieDocsProperty, PieDocsSchemaDocs } from './types.js';

type JsonSchema = Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

// Generated schemas reference only their own `definitions`, as `#/definitions/<encoded name>`.
const definitionName = (ref: string): string =>
  decodeURIComponent(ref.replace('#/definitions/', ''));

const valueAt = (value: unknown, path: string[]): unknown => {
  let current = value;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
};

const byPath = (a: { path: string }, b: { path: string }) => a.path.localeCompare(b.path);

const NUMERIC_KEYWORDS = ['minimum', 'maximum', 'minLength', 'maxLength'] as const;

/**
 * Documentation rows for one schema. A named object type is documented once, under
 * `definitions`, and a property of that type names it; nested inline objects flatten to dot paths
 * and the properties of inline array items to `<key>[].<property>`. A property's default is the
 * value `defaults` holds at its path, falling back to the schema's `default`.
 */
export const schemaDocs = (
  schema: JsonSchema | undefined,
  defaults?: unknown
): PieDocsSchemaDocs => {
  if (!schema) return { properties: [], definitions: [] };

  const definitions = (schema.definitions ?? {}) as Record<string, JsonSchema>;
  const isNamedObject = (name: string) => isRecord(definitions[name]?.properties);
  const referenced = new Set<string>();

  // Follows `$ref`s through aliases, enums and unions; stops at a named object type.
  const target = (node: JsonSchema, seen: Set<string>): JsonSchema => {
    let current = node;
    while (typeof current.$ref === 'string') {
      const name = definitionName(current.$ref);
      if (!definitions[name] || isNamedObject(name) || seen.has(name)) break;
      seen.add(name);
      const { $ref: _ref, ...siblings } = current;
      // The property's own JSDoc sits beside the `$ref` and wins over the definition's.
      current = { ...definitions[name], ...siblings };
    }
    return current;
  };

  const typeLabel = (node: JsonSchema, seen = new Set<string>()): string => {
    const local = new Set(seen);
    const resolved = target(node, local);
    if (typeof resolved.$ref === 'string') {
      const name = definitionName(resolved.$ref);
      if (!isNamedObject(name)) return 'any';
      referenced.add(name);
      return name;
    }
    if (typeof resolved.type === 'string') return resolved.type;
    if (Array.isArray(resolved.type)) return resolved.type.join(' | ');
    const members = (resolved.anyOf ?? resolved.oneOf) as JsonSchema[] | undefined;
    if (members) {
      return [...new Set(members.map((member) => typeLabel(member, local)))].join(' | ');
    }
    const values = resolved.enum ?? ('const' in resolved ? [resolved.const] : undefined);
    if (Array.isArray(values)) {
      return [...new Set(values.map((value) => (value === null ? 'null' : typeof value)))].join(
        ' | '
      );
    }
    return 'any';
  };

  const rows = (object: JsonSchema, path: string[], values: unknown): PieDocsProperty[] => {
    const properties = object.properties as Record<string, JsonSchema> | undefined;
    if (!properties) return [];
    const required = new Set((object.required as string[] | undefined) ?? []);

    return Object.entries(properties).flatMap(([key, property]) => {
      const propertyPath = [...path, key];
      const resolved = target(property, new Set());
      const items = isRecord(resolved.items) ? target(resolved.items, new Set()) : undefined;
      const inline = isRecord(resolved.properties);
      const defaultValue = valueAt(values, propertyPath) ?? resolved.default;

      const row: PieDocsProperty = {
        path: propertyPath.join('.'),
        type: typeLabel(property),
        required: required.has(key),
      };
      if (isRecord(resolved.items)) row.itemType = typeLabel(resolved.items);
      if (typeof resolved.description === 'string') row.description = resolved.description;
      if (Array.isArray(resolved.enum)) row.enum = resolved.enum as PieDocsProperty['enum'];
      for (const keyword of NUMERIC_KEYWORDS) {
        if (typeof resolved[keyword] === 'number') row[keyword] = resolved[keyword] as number;
      }
      if (typeof resolved.pattern === 'string') row.pattern = resolved.pattern;
      // An inline object carries no default of its own; its properties do.
      if (defaultValue !== undefined && !inline) row.defaultValue = defaultValue;

      return [
        row,
        ...(inline ? rows(resolved, propertyPath, values) : []),
        ...(items ? rows(items, [...path, `${key}[]`], undefined) : []),
      ];
    });
  };

  const properties = rows(schema, [], defaults).sort(byPath);

  // Documenting a type can name further types, so this runs until no new name appears.
  const documented: PieDocsDefinition[] = [];
  const done = new Set<string>();
  for (let pending = [...referenced]; pending.length > 0; ) {
    for (const name of pending) {
      done.add(name);
      const definition = definitions[name];
      documented.push({
        name,
        ...(typeof definition.description === 'string'
          ? { description: definition.description }
          : {}),
        properties: rows(definition, [], undefined).sort(byPath),
      });
    }
    pending = [...referenced].filter((name) => !done.has(name));
  }

  return { properties, definitions: documented.sort((a, b) => a.name.localeCompare(b.name)) };
};
