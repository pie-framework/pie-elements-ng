# Element JSON Schemas

Status: **Accepted** · Impl. path: Cross-cutting

## Context

Legacy `pie-elements` publishes a model schema and a configuration schema per element (`docs/pie-schema.json`, `docs/config-schema.json`), generated with typescript-json-schema from JSDoc'd interfaces in its private `@pie-element/pie-models` package. Hosts and content tooling read them to validate authored models and to document what an element accepts. ng ported the elements without that package: no ng element publishes a schema, and the React elements declare no model, configuration or session types, so most of their controller and authoring code runs under `@ts-nocheck`. Tracked as [PIE-1255](https://illuminate.atlassian.net/browse/PIE-1255).

## Goals

- Every element package publishes JSON Schemas for its model and session, and for its authoring configuration when it has an authoring surface.
- A schema is generated from the element's own TypeScript types, so it cannot describe a contract the element's code does not compile against.
- A model with a misspelled top-level key fails validation, as it does against the legacy schemas.
- Each published schema resolves at a stable, versioned URL.
- Every difference from the legacy contract is recorded per element.

## Non-goals

- **A schema library** (Zod, TypeBox, hand-written schemas). The TypeScript interfaces are the single source; a schema library would be a second one to keep in step.
- **Runtime validation in elements, players or `pie-api-aws`.** The schemas describe the contract; delivery does not validate against them. `pie-api-aws` stores models as given and validates only request envelopes. Content it serves predates the schemas and is not expected to validate: its Learnosity transform writes keys no ng schema declares, such as `weights` on multiple-choice, authored items carry other value shapes, and content on legacy element versions has no ng schema. A host validates where it accepts or stores content.
- **Committed schema copies.** A committed copy drifts from the build that published it; the npm package and its jsDelivr URL are the record.
- **Changing behaviour to match legacy.** Typing is annotation-only. A legacy difference or a bug found while typing is recorded, and fixing it is a separate change.
- **Matching legacy schemas key for key.** ng's types describe what ng reads and writes.

## Proposed surface

- **Contract types.** Each element's `src/types.ts` exports `<Name>Model`, `<Name>Session` and, when the package has `./author`, `<Name>Configuration`, where `<Name>` is the PascalCase package name. Shared building blocks live in `@pie-element/shared-types`: `PieModel` and the authoring types (`ConfigureProp`, `EditableHtmlPluginConfigure`, `ConfigureMathMLProp` and the rest). JSDoc carries descriptions, `@default`, `@minimum` and `@deprecated` into the schema. Element entries re-export the types (`export type * from './types.js'`).
- **Typed element code.** The controller, the authoring surface and the defaults files compile against those types. Defaults use `satisfies`, so a key the element writes and its type omits fails `tsc`.
- **Generation.** `tools/schemas/build.ts` runs ts-json-schema-generator over `src/types.ts` as the last step of the package build, writing `dist/schemas/<kind>.schema.json`. The package's `exports` entries `./schemas/<kind>.schema.json` decide which kinds it publishes.
- **Schema shape.** Draft-07, `$id` set to the file's versioned jsDelivr URL (`https://cdn.jsdelivr.net/npm/<name>@<version>/dist/schemas/<kind>.schema.json`). Model and configuration roots are closed (`additionalProperties: false`), as in legacy; nested objects and the session stay open, because players and controllers write extra state into the session. `@deprecated reason` becomes `deprecated: true` with the reason appended to the description.
- **Gates.** `tools/schemas/element-schemas.test.ts` generates every declared schema, compiles it under strict Ajv, and validates every value the element produces itself: controller defaults, `createDefaultModel()`, author defaults, demo models and sessions, and `createCorrectResponseSession()` on each demo model. Each declared kind must be exercised by at least one of those values. `scripts/check-publish-surface.mjs` requires the model and session exports on every element package, and the configuration export when `./author` exists.
- **Documentation.** The element-demo docs pages take their property rows from the schemas, generated in-process from `src/types.ts` by the module the package build uses (`tools/cli/src/lib/schemas`), so descriptions, enums, bounds and required keys come from the JSDoc. Defaults come from the defaults files `docs.contract.json` points at; the contract's unused `metadata` and `description` fields are removed. A named object type is documented once per section and linked from each property of that type: expanded inline, the shared rich-text toolbar types put 400 to 1,000 rows on a configuration page.
- **Migration.** One change per element batch, all under PIE-1255. venn-classification and multiple-choice are the reference shapes for Svelte and React. Legacy differences are recorded in [`notes/legacy-contract-changes.md`](./notes/legacy-contract-changes.md).

## Worked example

A host validates an authored multiple-choice model before saving it:

```js
import Ajv from 'ajv';
import schema from '@pie-element/multiple-choice/schemas/model.schema.json' with { type: 'json' };

const validate = new Ajv({ allowUnionTypes: true }).compile(schema);
validate({ id: '1', element: 'multiple-choice', choices: [], choicePrefx: 'letters' });
// false: `choicePrefx` is not a model property
```
