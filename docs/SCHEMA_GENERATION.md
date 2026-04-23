# Framework-Agnostic PIE Docs Generation

This repository generates per-view HTML documentation artifacts for PIE elements from `docs.contract.json` descriptors.

## Goals

- Support both `packages/elements-react/*` and `packages/elements-svelte/*`.
- Keep output centralized under `apps/element-demo/static/element-docs/<element>/`.
- Include default values in generated docs whenever defaults are known.
- Enforce descriptor + docs drift checks before publish.

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

Generate docs:

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

## Upstream Sync Integration

`upstream:update` and `upstream:sync` run through the React sync strategy, which refreshes docs contracts for synced React elements. This keeps descriptors aligned with package/view changes during sync.

## Publish Enforcement

Release publishing runs docs verification via the root `release:publish` script. Publishing fails when:

- a publish-targeted element has no valid `docs.contract.json`,
- a contract references missing source files,
- generated docs are out of date.
