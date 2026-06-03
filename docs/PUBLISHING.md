# Publishing and Dist-Tag Policy

This repository uses Changesets plus GitHub Actions for versioning and npm publishing.

The normative package contract is defined in
[`PIE_ELEMENT_CONTRACT.md`](PIE_ELEMENT_CONTRACT.md). This page describes release
process and the checks that enforce that contract.

## Dist-Tag Policy (Upstream-Aligned)

`pie-elements-ng` follows the same channel intent as upstream `pie-elements`:

- `master` publishes stable releases to npm `latest`
- `develop` publishes prerelease versions to npm `next`
- beta releases publish to npm `beta` when explicitly requested

Tag assignment is explicit at publish time (`npm publish --tag ...`) and validated against version format:

- stable version (`x.y.z`) -> `latest`
- prerelease `*-next.*` -> `next`
- prerelease `*-beta.*` -> `beta`

## CI/CD Branch Routing

Release workflow: `.github/workflows/release.yml`

- Push to `master` -> release channel resolves to `stable` -> publish tag `latest`
- Push to `develop` -> release channel resolves to `next` -> publish tag `next`
- Manual dispatch can choose a `release_channel`, but branch-policy checks still apply:
  - `master` must publish on `stable`
  - `develop` must publish on `next`

If branch and channel do not match, the workflow fails before publishing.

## Manual Targeted Publish

Use the approved manual publish script:

```bash
sh scripts/publish-with-env-token.sh --packages @pie-element/extended-text-entry
```

Optional channel override:

```bash
sh scripts/publish-with-env-token.sh --packages @pie-element/extended-text-entry --channel next
```

Supported channel values:

- `auto` (default)
- `stable`
- `next`
- `beta`

## Runtime Dependency Preflight

The shared publish command used by CI and local targeted publishes checks the runtime workspace dependency closure before it runs `npm publish`.

For each selected package, any local workspace dependency from `dependencies` or `optionalDependencies` must either:

- be included in the same selected publish set, or
- already exist on npm at the exact local version that will replace the `workspace:*` range.

This prevents publishing an element whose npm install later fails in the PIE builder because a workspace dependency was never published. If the preflight fails, add the missing package to `--packages` or publish that dependency first.

All publishable packages use a dist-only public API. Package `exports`, `main`, `module`, `types`, CDN fields, and packed source-bearing files must resolve to generated `dist` artifacts only. Raw source (`src`, root `.ts`/`.tsx`, `.svelte`, `.svelte.ts`, and `development` conditions that point at source) is not a supported package API.

Controller-bearing element packages have one compatibility exception: they must publish a root `controller.js` shim containing `export * from './dist/controller/index.js';`. The manifest must set `pie.controller` to `@pie-element/<name>/controller`, expose both `exports["./controller"]` and `exports["./controller.js"]` at `./dist/controller/index.js`, and include `controller.js` in `files`. Standard ESM consumers use the subpath export; the root shim is for legacy alias-based builders such as `pie-api-aws`.

Browser ESM for players is a separate static-file surface. Packages that can produce browser ESM expose `exports["./browser/delivery"]`, `exports["./browser/author"]`, `exports["./browser/print"]`, and `exports["./browser/controller"]` at `./dist/browser/<view>/index.js`. These files use the hybrid policy in `tools/vite/browser-esm-policy.json`: React and React DOM are external shared imports pinned by `pie-players`, while UI/runtime leaf dependencies stay bundled. Element packages must not rely on jsDelivr `+esm` or other CDN package transforms for their own package entry points.

The same policy file drives the browser build and publish checks. `check:publish-surface` rejects unsupported bare imports, missing or drifted exact `pie.browserSharedDependencies`, and packages whose `dist/browser/**/*.js` total exceeds the browser JS budget. Packages without browser ESM exports must publish `./runtime-support` metadata that marks ESM unsupported, so players and demos cannot silently request static browser ESM for packages that do not provide it. When adding a new shared external, update the policy and `pie-players` import-map generation together; otherwise new dependencies should remain bundled by default. `dependencies` and `peerDependencies` are install metadata only; they are not the browser runtime singleton contract.

Debuggability comes from generated sourcemaps, not from importable source files. TypeScript builds must emit sourcemaps with inline source content, and package validation rejects `.js.map` files that require unpacked source files to be present in the npm tarball.

The shared publish command used by CI and local targeted publishes runs the aggregate contract gate:

- `bun run verify:element-contracts`

This runs publish-surface, controller, runtime-support export, and sourcemap checks. It rejects source-path exports, `src` in packed tarballs, raw Svelte/TypeScript package surfaces, missing browser ESM contract metadata, missing runtime-support metadata for non-browser-ESM packages, missing sourcemap source content, and stale generated maps.

Before publishing ESM-capable packages, also run the browser smoke matrix from `.compatibility/report.json`: ESM, IIFE, and preloaded loading for representative packages, including `multiple-choice`, an authoring view, a print/fallback path, a passage plus interaction item, and one intentionally non-ESM-ready package.

## Dist-Tag Backfill Runbook

Use the backfill script to detect and repair stale `latest` tags across `@pie-element/*`.

Dry-run (recommended first):

```bash
bun run release:dist-tags:audit
```

Dry-run for selected packages:

```bash
bun run release:dist-tags:audit -- --packages @pie-element/extended-text-entry,@pie-element/multiple-choice
```

Apply updates:

```bash
bun run release:dist-tags:apply
```

Apply updates for selected packages:

```bash
bun run release:dist-tags:apply -- --packages @pie-element/extended-text-entry
```

The script computes the intended `latest` as the highest stable semver (`x.y.z`) available on npm, then runs:

```bash
npm dist-tag add <package>@<highest-stable> latest
```

## Verification Commands

After any publish or backfill, verify tags and versions:

```bash
npm view @pie-element/extended-text-entry dist-tags --json
npm view @pie-element/extended-text-entry versions --json
```

For all package tags:

```bash
npm dist-tag ls @pie-element/extended-text-entry
```

Verify what default install resolves:

```bash
npm view @pie-element/extended-text-entry version
```
