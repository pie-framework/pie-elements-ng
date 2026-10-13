# Publishing and Dist-Tag Policy

This repository uses Changesets plus GitHub Actions for versioning and npm publishing.

The normative package contract is defined in
[`PIE_ELEMENT_CONTRACT.md`](PIE_ELEMENT_CONTRACT.md). This page describes release
process and the checks that enforce that contract.

## Dist-Tag Policy

`pie-elements-ng` follows the same channel intent as the legacy `pie-elements`:

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

## Release Flow

Version numbers and changelogs are written only on `master`. `develop` publishes snapshots and never commits a version, so merging `develop` into `master` brings code and changesets, and no prerelease versions.

```text
PR merged into develop ──► next snapshot published     (nothing committed but the PR's changeset)
                      └──► .changeset/pr-<n>.md committed to develop
develop merged into master ──► "Version Packages" PR
Version Packages PR merged ──► latest published ──► master -> develop back-merge PR
```

### `next` from `develop`

Each merge into `develop` publishes the packages it changed as `<version>-next.<datetime>` under the `next` dist-tag (`scripts/release-version-snapshot.mjs`):

1. **Select.** A package is selected when its shipping files changed after the commit its latest snapshot was built from, which npm records as `gitHead`. With no snapshot on npm, the package's last `version` bump in git is the baseline instead. A bump newer than the snapshot doesn't count as a release: a version edited by hand on `develop` would otherwise hide the package's unreleased code. After a stable release that means the released packages publish to `next` once more, which puts `next` back above `latest`.

   The snapshot is found through the `next` tag when the tag points at one of this repo's snapshots (`-next.<14-digit datetime>`). The legacy `pie-elements` and `pie-lib` pipelines publish the same names and can move that tag, so when it points elsewhere, the package's versions are searched for this repo's newest snapshot instead. Once the legacy repos no longer publish to `next`, that search can be removed and the tag trusted alone (`fetchPublishedGitHeads` in `scripts/release-synthesize-changesets.mjs`). Everything in a package except tests, specs, snapshots and Vitest or Playwright config counts as shipping, READMEs included. Private packages and packages in the Changesets `ignore` list are never selected.
2. **Version.** The pending changesets are moved aside, a changeset naming the selected packages is written, and `changeset version --snapshot next` runs. Each package takes the largest bump its pending changesets give it, otherwise `patch`, so `next` previews the next stable version: a pending `major` gives `14.0.0-next.<datetime>`. That applies to the dependents Changesets adds as well (read from `changeset status --output`), so multiple-choice previews `14.0.0-next.*` even when only a library it uses changed.
3. **Pin everything else.** Every package the snapshot doesn't version is set, in the runner only, to its own latest `next` release. The publish script turns `workspace:*` into the working-tree version, and `develop`'s committed versions no longer move, so without this a snapshot would depend on frozen versions (older library code) or on versions that were never published.
4. **Build, test, publish and discard.** Versioning comes before the build, because builds embed the manifest version (ebsr's and complex-rubric's private element tags). The publish script publishes exactly the versioned packages, by name. The tree is thrown away with the runner.

To put every package on `next` at once, for example to test the full set a stable release would put on `latest`, run the Release workflow manually on `develop` with `snapshot_all`:

```bash
gh workflow run release.yml --ref develop -f release_intent=publish -f snapshot_all=true
```

Because selection is measured from npm rather than from one push, a run that fails or is cancelled loses nothing: npm still points at the older commit, and the next run selects the same packages. Afterwards `scripts/release-report-dropped.mjs` fails an otherwise-green run that selected a package and did not publish it.

### Changelog entries

After each merge into `develop`, `scripts/release-record-pr-changeset.mjs` writes `.changeset/pr-<n>.md` and CI commits it to `develop`. It names the packages the PR changed, at `patch`, with the PR title as the summary and a `pr: <n>` line. `@changesets/changelog-github` turns that line into the PR link and author in the changelog.

A changeset the PR adds itself wins: its packages are left out of the recorded one, so its bump type and wording are kept. Write one when a change needs more than its PR title, or a `minor`/`major` bump. The back-merge PR records nothing.

The recorded changeset is written after the merge, not on the PR. A commit pushed to a PR branch with `GITHUB_TOKEN` does not trigger CI, so required checks would never report on it.

### `latest` from `master`

A `develop` -> `master` merge carries the accumulated changesets. `changesets/action` turns them into a "Version Packages" PR with the stable versions and changelogs; merging it publishes under `latest`. `bun run version` fails if a stable version is already on npm (`scripts/check-version-availability.mjs`), which matters here because the legacy `pie-elements` and `pie-lib` repositories published many of the same names.

After the publish, CI opens a `master` -> `develop` back-merge PR with the release commit: the bumped manifests, the changelogs, and the deletion of the consumed changesets. Merge it before the next `develop` -> `master` merge. Without it that merge conflicts on those files and brings the consumed changesets back.

`changeset version` needs a `GITHUB_TOKEN` for `@changesets/changelog-github`. To preview a release locally: `GITHUB_TOKEN=$(gh auth token) bun run version`, then discard the result.

### Leaving prerelease mode

Until PIE-1121, `develop` ran Changesets prerelease mode (`.changeset/pre.json`) and committed `-next.N` versions. That mode is gone. Its consumed changesets are still archived under `.changeset/pre/`, and Changesets counts them as pending again now that `pre.json` is gone, so the first stable release builds its changelogs from everything the prereleases shipped. Do not delete the archive before that release.

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
bun run version        # consumes changesets, bumps package.json + CHANGELOG.md, skips -next.N numbers npm holds
```

**Gotcha — pending changesets**: `develop` and `master` carry every changeset recorded since the last stable release (`.changeset/*.md`, plus the `.changeset/pre/` archive until the first stable release). Running `bun run version` will consume **every** pending changeset, bumping unrelated packages too. It also needs `GITHUB_TOKEN` for the changelog generator.

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

An element that declares `pie.browserEditorRuntime` also depends on `@pie-element/shared-editor-runtime` at the version it names, under the same rule.

This prevents publishing an element whose npm install later fails in the PIE builder because a workspace dependency was never published. If the preflight fails, add the missing package to `--packages` or publish that dependency first.

All publishable packages use a dist-only public API. Package `exports`, `main`, `module`, `types`, CDN fields, and packed source-bearing files must resolve to generated `dist` artifacts only. Raw source (`src`, root `.ts`/`.tsx`, `.svelte`, `.svelte.ts`, and `development` conditions that point at source) is not a supported package API.

Controller-bearing element packages must publish a root `controller.js` shim containing `export * from './dist/controller/index.js';`. The manifest must set `pie.controller` to `@pie-element/<name>/controller`, expose both `exports["./controller"]` and `exports["./controller.js"]` at `./dist/controller/index.js`, and include `controller.js` in `files`. Standard ESM consumers use the subpath export; the root shim is for legacy alias-based builders such as `pie-api-aws`.

Packages that export `./configure`, `./author` or `./print` publish the matching root shim (`configure.js`, `author.js`, `print.js`) on the same terms: it re-exports the subpath's `./dist/...` target and is listed in `files`. `print.js` also has an `exports["./print.js"]` entry matching `./print`. `check:publish-surface` enforces all four; see [`PIE_ELEMENT_CONTRACT.md`](PIE_ELEMENT_CONTRACT.md#controller-and-configure-packaging).

Browser ESM for players is a separate static-file surface. Packages that can produce browser ESM expose `exports["./browser/delivery"]`, `exports["./browser/author"]`, `exports["./browser/print"]`, and `exports["./browser/controller"]` at `./dist/browser/<view>/index.js`. These files use the hybrid policy in `tools/vite/browser-esm-policy.json`: React and React DOM are external shared imports pinned by `pie-players`, while UI/runtime leaf dependencies stay bundled. Element packages must not rely on jsDelivr `+esm` or other CDN package transforms for their own package entry points.

The same policy file drives the browser build and publish checks. `check:publish-surface` rejects unsupported bare imports, missing or drifted exact `pie.browserSharedDependencies`, packages whose `dist/browser/**/*.js` total exceeds the browser JS budget, stylesheets in `dist/browser` or `module/` that no reachable module loads (hosts load no element CSS; see [`PACKAGING_ARCHITECTURE.md`](PACKAGING_ARCHITECTURE.md#browser-esm-stylesheets)), and top-level await in the modules those directories ship. For an element that declares `pie.browserEditorRuntime` it applies the same rules to `dist/browser/editor-runtime`, where the specifiers of `@pie-element/shared-editor-runtime` are also allowed, and requires the declared runtime version to be exact and equal to the runtime's workspace version; see [`PIE_ELEMENT_CONTRACT.md`](PIE_ELEMENT_CONTRACT.md#shared-editor-runtime). Packages without browser ESM exports must publish `./runtime-support` metadata that marks ESM unsupported, so players and demos cannot silently request static browser ESM for packages that do not provide it. When adding a new shared external, update the policy and `pie-players` import-map generation together; otherwise new dependencies should remain bundled by default. `dependencies` and `peerDependencies` are install metadata only; they are not the browser runtime singleton contract.

Print-capable packages (those with `exports["./print"]`) also publish a root `module/print.js` and its sourcemap `module/print.js.map`, plus `module/assets/` when the stylesheets `module/print.js` installs reference fonts or images, all included in `files`. This is unrelated to `./browser/print` — it exists only so the legacy `@pie-framework/pie-print` client loader (bare `import()`, no import map) can load `pie-elements-ng` print bundles at the CDN path it already requests. See [`PIE_ELEMENT_CONTRACT.md`](PIE_ELEMENT_CONTRACT.md#legacy-compatible-print-packaging) and [`PRINT_SUPPORT.md`](PRINT_SUPPORT.md).

Debuggability comes from generated sourcemaps, not from importable source files. TypeScript builds must emit sourcemaps with inline source content, and package validation rejects `.js.map` files that require unpacked source files to be present in the npm tarball.

The shared publish command used by CI and local targeted publishes runs the aggregate contract gate:

- `bun run verify:element-contracts`

This runs publish-surface, controller, runtime-support export, and sourcemap checks. It rejects source-path exports, `src` in packed tarballs, raw Svelte/TypeScript package surfaces, missing browser ESM contract metadata, missing runtime-support metadata for non-browser-ESM packages, missing sourcemap source content, and stale generated maps.

Before publishing ESM-capable packages, also run the browser smoke matrix, `apps/element-demo/test/e2e/smoke-matrix.spec.ts`. It loads every registered element's deliver, author and print views and fails on critical console errors; `bun run test:iife:e2e` runs it against both the ESM and IIFE players. Preloaded loading is covered in `pie-players`.

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
