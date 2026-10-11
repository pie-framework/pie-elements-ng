import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv, { type ValidateFunction } from 'ajv';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';
import {
  declaredSchemaKinds,
  generateElementSchemas,
  readElementManifest,
  type SchemaKind,
} from './generate.ts';

/**
 * Every element that publishes schemas is checked against the values it produces itself: the
 * controller's defaults, `createDefaultModel()`, the author's default model and configuration,
 * `createCorrectResponseSession()`, and the demo models and sessions. A key the element writes but
 * its type does not declare fails here, as does a type that drifts from what the element emits.
 */

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

const elementDirs = globSync('packages/elements-{react,svelte}/*/package.json', {
  cwd: workspaceRoot,
})
  .map((manifest) => join(workspaceRoot, dirname(manifest)))
  .filter((dir) => declaredSchemaKinds(readElementManifest(dir)).length > 0)
  .sort();

type Instance = { label: string; kind: SchemaKind; value: unknown };

type Module = Record<string, unknown>;

const importIfPresent = async (path: string): Promise<Module | undefined> =>
  existsSync(path) ? ((await import(pathToFileURL(path).href)) as Module) : undefined;

/** Imports the first of `paths` that exists: defaults files are `.ts` or, in some authors, `.tsx`. */
const importFirstPresent = async (dir: string, paths: string[]): Promise<Module | undefined> => {
  const path = paths.map((candidate) => join(dir, candidate)).find(existsSync);
  return path ? importIfPresent(path) : undefined;
};

// select-text's author keeps its defaults in `defaultConfiguration.ts`.
const defaultsPaths = (view: 'controller' | 'author') => [
  `src/${view}/defaults.ts`,
  `src/${view}/defaults.tsx`,
  ...(view === 'author' ? ['src/author/defaultConfiguration.ts'] : []),
];

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value ? [value] : [];

type DefaultsModule = { model?: object; configuration?: object };

// Defaults files export either the model's defaults or `{ model, configuration }`.
const splitDefaults = (value: unknown): DefaultsModule => {
  if (!value || typeof value !== 'object') return {};
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => key === 'model' || key === 'configuration')
    ? (value as DefaultsModule)
    : { model: value };
};

const instructorGather = { mode: 'gather', role: 'instructor' };

// Generation builds a TypeScript program per element: a second or two each, more on a loaded runner.
const GENERATION_TIMEOUT = 60_000;

/** The models and sessions the element produces from its own code and demos. */
const collectInstances = async (dir: string, elementName: string): Promise<Instance[]> => {
  const identity = { id: 'schema-check', element: elementName };
  const instances: Instance[] = [];

  const controllerDefaults = splitDefaults(
    (await importFirstPresent(dir, defaultsPaths('controller')))?.default
  );
  if (controllerDefaults.model) {
    instances.push({
      label: 'controller defaults',
      kind: 'model',
      value: { ...controllerDefaults.model, ...identity },
    });
  }
  if (controllerDefaults.configuration) {
    instances.push({
      label: 'controller default configuration',
      kind: 'configuration',
      value: controllerDefaults.configuration,
    });
  }

  const controller = await importIfPresent(join(dir, 'src/controller/index.ts'));
  if (typeof controller?.createDefaultModel === 'function') {
    instances.push({
      label: 'controller createDefaultModel()',
      kind: 'model',
      value: { ...(await controller.createDefaultModel({})), ...identity },
    });
  }

  const authorDefaults = splitDefaults(
    (await importFirstPresent(dir, defaultsPaths('author')))?.default
  );
  if (authorDefaults.model) {
    instances.push({
      label: 'author default model',
      kind: 'model',
      value: { ...authorDefaults.model, ...identity },
    });
  }
  if (authorDefaults.configuration) {
    instances.push({
      label: 'author default configuration',
      kind: 'configuration',
      value: authorDefaults.configuration,
    });
  }

  const demoConfig = (await importIfPresent(join(dir, 'docs/demo/config.mjs')))?.default as
    | { demos?: { id: string; model?: object; session?: unknown }[] }
    | undefined;
  for (const demo of demoConfig?.demos ?? []) {
    if (demo.model) {
      instances.push({ label: `demo "${demo.id}" model`, kind: 'model', value: demo.model });
      if (typeof controller?.createCorrectResponseSession === 'function') {
        const session = await controller.createCorrectResponseSession(demo.model, instructorGather);
        if (session) {
          instances.push({
            label: `demo "${demo.id}" correct response session`,
            kind: 'session',
            value: session,
          });
        }
      }
    }
    for (const session of asArray(demo.session)) {
      instances.push({ label: `demo "${demo.id}" session`, kind: 'session', value: session });
    }
  }

  const demoSessions = (await importIfPresent(join(dir, 'docs/demo/session.mjs')))?.default;
  for (const [index, session] of asArray(demoSessions).entries()) {
    instances.push({ label: `demo session.mjs[${index}]`, kind: 'session', value: session });
  }

  return instances;
};

const formatErrors = (validate: ValidateFunction) =>
  (validate.errors ?? [])
    .map(
      ({ instancePath, message, params }) =>
        `${instancePath || '/'} ${message} ${JSON.stringify(params)}`
    )
    .join('; ');

describe.each(elementDirs.map((dir) => [readElementManifest(dir).name, dir]))(
  '%s schemas',
  (name, dir) => {
    const ajv = new Ajv({ strict: true, allErrors: true, allowUnionTypes: true });
    let validators: Partial<Record<SchemaKind, ValidateFunction>> | undefined;
    const compileSchemas = () => {
      validators ??= Object.fromEntries(
        Object.entries(generateElementSchemas(dir)).map(([kind, schema]) => [
          kind,
          ajv.compile(schema),
        ])
      );
      return validators;
    };

    it(
      'generate and compile under strict Ajv',
      () => {
        expect(Object.keys(compileSchemas())).toEqual(
          declaredSchemaKinds(readElementManifest(dir))
        );
      },
      GENERATION_TIMEOUT
    );

    let instances: Promise<Instance[]> | undefined;
    const elementInstances = () => {
      instances ??= collectInstances(dir, name.split('/').pop() ?? name);
      return instances;
    };

    it(
      'accept the values the element produces',
      async () => {
        const validatorsByKind = compileSchemas();
        const failures = (await elementInstances()).flatMap(({ label, kind, value }) => {
          const validate = validatorsByKind[kind];
          return !validate || validate(value) ? [] : [`${label}: ${formatErrors(validate)}`];
        });
        expect(failures).toEqual([]);
      },
      GENERATION_TIMEOUT
    );

    it('are each exercised by a value the element produces', async () => {
      const produced = new Set((await elementInstances()).map(({ kind }) => kind));
      const unexercised = declaredSchemaKinds(readElementManifest(dir)).filter(
        (kind) => !produced.has(kind)
      );
      expect(unexercised).toEqual([]);
    });
  }
);
