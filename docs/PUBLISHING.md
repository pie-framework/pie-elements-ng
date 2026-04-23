# Publishing and Dist-Tag Policy

This repository uses Changesets plus GitHub Actions for versioning and npm publishing.

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
