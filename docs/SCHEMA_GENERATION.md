# Framework-Agnostic PIE Docs Generation

This repository generates per-view HTML documentation artifacts for PIE elements from `docs.contract.json` descriptors.

## Goals

- Support both `packages/elements-react/*` and `packages/elements-svelte/*`.
- Keep output centralized under `apps/element-demo/static/element-docs/<element>/` during demo builds.
- Include default values in generated docs whenever defaults are known.
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

### Optional rich metadata (upstream-level richness)

Contracts can optionally include per-path metadata to enrich docs with descriptions, enums, required flags, and constraints.
This is optional for new components; if omitted, generation still works from inferred defaults.

Example:

```json
{
  "views": [
    {
      "view": "delivery",
      "pie": { "file": "src/controller/defaults.ts", "path": "model" },
      "config": { "file": "src/controller/defaults.ts", "path": "configuration" },
      "metadata": {
        "pie": {
          "model.choiceMode": {
            "description": "Selection mode used by delivery rendering.",
            "enum": ["radio", "checkbox"],
            "required": true
          }
        },
        "config": {
          "configuration.prompt.settings": {
            "description": "Show prompt settings in author panel."
          }
        }
      }
    }
  ]
}
```

## Commands

Generate docs manually:

```bash
bun run cli docs:generate
```

Generate with contract seeding (useful after sync):

```bash
bun run cli docs:generate --seed-contracts
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

## Upstream Sync Integration

`upstream:update` and `upstream:sync` run through the React sync strategy, which refreshes docs contracts for synced React elements. This keeps descriptors aligned with package/view changes during sync.

## Build Integration

The element-demo build runs docs generation before `vite build`. Publishing therefore ships docs
from the same generation step as local demo builds instead of relying on checked-in HTML.

Docs verification remains available as an explicit diagnostic command. It is not part of release
publishing because the generated HTML is no longer committed.

Docs generation fails when:

- a publish-targeted element has no valid `docs.contract.json`,
- a contract references missing source files.
