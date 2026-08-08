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

## npm Authentication and Trusted Publishers

Migrating this repository to npm trusted publishing (OIDC) is tracked in PIE-834 and is
deliberately incomplete. The blocker is package-name ownership, not workflow configuration.

npm permits exactly **one** trusted publisher per package. This repository publishes `-next.N`
prereleases of the same `@pie-element/*` and `@pie-lib/*` names that the still-active
`pie-framework/pie-elements` and `pie-framework/pie-lib` repositories release as stable, and
those repositories already hold the record for most of them. Measured on 2026-08-01: of 68
publishable packages, 45 were last published via OIDC by a legacy repository, leaving roughly
23 names free for this repository to claim.

npm resolves a single auth mode for a publish run as a whole, so OIDC is not a per-package
choice. That is why `release.yml` resolves `auto` to **token, or failure — never OIDC**: an
OIDC run would let Changesets bump and commit versions and then fail every legacy-owned publish
with `ENEEDAUTH`, leaving versions in git that were never released. The full rationale is in
the workflow's "Resolve npm publish auth mode" step.

So the `NPM_TOKEN` secret must not be deleted: if it ever goes missing, an automated publish
run fails at that step by design, with remediation instructions. Opting into OIDC is a
deliberate manual dispatch with `publish_auth=oidc`, and only once every package it would
publish is confirmed:

```bash
bun run trusted-publishers -- --verify
```

`--verify` classifies each package as configured, wrong target (a record bound to another
repository, which matters because it occupies the one available slot), or not configured. It
parses npm's JSON rather than trusting the exit status, which is essential here: `npm trust
list` exits 0 and prints an empty list for a package with no record at all.

Ownership can also be audited with no 2FA round trip, because a published version records the
publisher that produced it:

```bash
curl -s https://registry.npmjs.org/@pie-lib%2Frender-ui | jq '.versions["6.1.3"]._npmUser'
# trustedPublisher.oidcConfigId present => published via OIDC by whichever repo holds the record
# absent                                => published with a token
```

## Manual Publish Runbook (Step-by-Step)

Full checklist for cutting a one-off manual release of a single package, from a clean local branch.

### 0. One-time environment setup

- Install `dotenvx` (e.g. `npm install -g @dotenvx/dotenvx`).
- Create a `.env` file at the repo root containing `NPM_TOKEN=<npm token with publish access to @pie-element>`. Never commit `.env`.
- **Gotcha**: `dotenvx` does not override a variable that is already exported in your shell. If your shell profile (`~/.zshrc`, `~/.bash_profile`, etc.) already exports a stale `NPM_TOKEN`, the publish script will silently use that instead of `.env` and fail with `401 Unauthorized`. If you hit that, run `unset NPM_TOKEN` in the current shell before retrying.

### 1. Confirm clean state

```bash
git status
git pull origin <branch>
```

### 2. Bump the version

Normal case — no pre-release mode, no unrelated pending changesets:

```bash
bun run changeset      # select the package(s), bump type, write a summary
bun run version        # = `changeset version`; consumes changesets, bumps package.json + CHANGELOG.md
```

**Gotcha — pre-release mode / stray changesets**: check `.changeset/pre.json`. If it exists (mode `"pre"`), the branch is currently cutting `next` prereleases — this is normally the case on `develop`. Also check `.changeset/*.md` for changesets targeting packages you don't intend to touch. Running `bun run version` in this state will:

- suffix your version with the active prerelease tag (e.g. `0.2.13-next.4`) instead of a clean stable bump, and
- consume **every** pending changeset, bumping unrelated packages too.

To cut a clean, isolated release for just your target package in that situation, bypass the changeset version step entirely:

- Hand-edit the target package's `package.json` — bump `"version"` directly (default to a `patch` bump unless told otherwise).
- Add a matching entry at the top of that package's `CHANGELOG.md`, following the existing format (`## <version>` / `### Patch Changes` / bullet).

### 3. Build and verify

```bash
bun install                        # fixes stale/incomplete node_modules — see gotcha below
bun run build
bun run verify:element-contracts   # aggregate gate: publish-surface, controller, runtime-support, sourcemap checks
```

This mirrors what `bun run release:publish` runs before publishing (`bun run build && bun run verify:element-contracts`).

**Gotcha**: the `lefthook` pre-commit hook runs `bun run verify:dependency-integrity --fail-on-hoist`. If your local `node_modules` is stale, this can fail with a long list of "Broken imports" across unrelated packages (missing `lodash-es`, `classnames`, etc.) even though nothing is actually wrong in the code. Run `bun install` first — it re-hoists the missing deps and the check passes clean.

### 4. Commit the version bump

```bash
git add <path/to/package.json> <path/to/CHANGELOG.md>
git commit -m "chore(release): <package-name>@<version>"
```

The pre-commit hook re-runs the dependency-integrity check; it must pass.

### 5. Publish

Use the approved manual publish script — never raw `npm publish`:

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

### 6. Verify the publish

```bash
npm view @pie-element/extended-text-entry version
npm view @pie-element/extended-text-entry dist-tags --json
```

### 7. Push

```bash
git push origin <branch>
```

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

Print-capable packages (those with `exports["./print"]`) have a second compatibility exception alongside `controller.js`: a root `module/print.js` (plus `module/print.js.map`), included in `files`. This is unrelated to `./browser/print` — it exists only so the legacy `@pie-framework/pie-print` client loader (bare `import()`, no import map) can load `pie-elements-ng` print bundles at the CDN path it already requests. See [`PIE_ELEMENT_CONTRACT.md`](PIE_ELEMENT_CONTRACT.md#legacy-compatible-print-packaging) and [`PRINT_SUPPORT.md`](PRINT_SUPPORT.md).

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
