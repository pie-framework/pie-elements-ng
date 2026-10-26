# Framework-Agnostic PIE Docs Generation

This repository generates per-view HTML documentation for PIE elements. Property rows come from the element's [JSON Schemas](ELEMENT_SCHEMAS.md) and default values from the defaults files its `docs.contract.json` points at.

## Goals

- Support both `packages/elements-react/*` and `packages/elements-svelte/*`.
- Keep output centralized under `apps/element-demo/static/element-docs/<element>/` during demo builds.
- Document every property the element's schemas declare, with the default its defaults supply.
- Generate deployable docs as part of the element demo build.

## Contract File

Each element package must provide a `docs.contract.json` file at package root.

Minimal shape:

```json
{
  "elementName": "simple-cloze",
  "packageName": "@pie-element/simple-cloze",
  "framework": "svelte",
  "views": [
    {
      "view": "delivery",
      "pie": { "file": "src/controller/defaults.ts", "path": "model" },
      "config": { "file": "src/controller/defaults.ts", "path": "configuration" }
    }
  ]
}
```

`file` is relative to the element package root. `path` is an optional dot-path inside the exported object.

`pie` points at the model defaults and `config` at the configuration defaults. Seeding infers both: the author defaults' `model` and `configuration` when the package has them, otherwise the controller defaults, which export either `{ model, configuration }` or the model itself.

## Property Rows

Each view page has a Model, a Configuration and a Session section, one per schema the package publishes. Generation builds the schemas in-process from `src/types.ts` with the same generator the package build runs, so docs need no element build first.
- A row carries the property's path, type, whether it is required, and the schema's `description`, `enum`, numeric and length bounds, and `pattern`. Those come from the JSDoc in `src/types.ts`.
- An inline object type flattens into dot paths, `limits.width`; the properties of inline array items into `rows[].label`.
- A named object type, such as `Choice` or `EditableHtmlPluginConfigure`, is documented once per section under its name, and each property of that type links to it.
- A row's default is the value the defaults hold at its path, falling back to the schema's `default`.

## Commands

Generate docs manually:

```bash
bun run cli docs:generate
```

Create missing contract descriptors with `--seed-contracts`. `--refresh-contracts` rewrites existing descriptors' `views` from the inferred pointers after a package or view changes:

```bash
bun run cli docs:generate --seed-contracts
bun run cli docs:generate --refresh-contracts
```

Verify contracts and docs drift:

```bash
bun run cli docs:verify
```

## Generated files

Each generated element folder contains:
- `manifest.json` (machine-readable payload for the demo route)
- `index.html` (overview + metadata + links)
- `delivery.html` (delivery view docs)
- `author.html` (author view docs)
- `print.html` (only when print is meaningfully different)

Generated HTML is a build artifact. It is written into `apps/element-demo/static/element-docs/`
by the element-demo `prebuild`/`predev` scripts so SvelteKit can serve it from
`/element-docs/<element>/`, but the generated directory is not committed.

## Build Integration

The element-demo build runs docs generation before `vite build`. Publishing therefore ships docs
from the same generation step as local demo builds instead of relying on checked-in HTML.

Docs verification remains available as an explicit diagnostic command. It is not part of release
publishing because the generated HTML is no longer committed.

Docs generation fails when:
- a publish-targeted element has no valid `docs.contract.json`,
- a contract references missing source files,
- an element publishes no model or session schema.
