---
name: upstream-sync-guide
description: Guides an upstream sync operation — pulling updated elements or lib packages from ../pie-elements or ../pie-lib into this repo. Use when running or debugging upstream:update, upstream:sync, or upstream:check CLI commands.
allowed-tools: Read, Glob, Grep, Bash
---

# Upstream Sync Guide

Guides sync operations that pull updated packages from `../pie-elements` or `../pie-lib` into this repo.

## When to Use

- Syncing one or more elements from `../pie-elements` into `packages/elements-react/`.
- Syncing lib packages from `../pie-lib` into `packages/lib-react/`.
- Debugging a transform failure during `upstream:update` or `upstream:sync`.
- Verifying a completed sync didn't introduce type errors or test regressions.

## Pre-Conditions

`../pie-elements` and `../pie-lib` must be checked out as sibling directories relative to this repo. Verify before attempting any sync:

```bash
ls ../pie-elements
ls ../pie-lib
```

If either directory is missing, stop and tell the user. Do not attempt to sync from a path that doesn't exist, and do not clone repositories autonomously — the user must check them out.

## Edit Policy for Synced Packages

**Never directly edit files under `packages/elements-react/*` or `packages/lib-react/*`.**

These directories are owned by the sync process. Any manual edit will be overwritten the next time `upstream:update` runs and will silently diverge from upstream.

The correct workflow for a bug found in a synced package:
1. Fix it in the upstream repo (`../pie-elements` or `../pie-lib`).
2. Run `upstream:sync` to pull the fix into this repo.
3. Commit both the upstream change and the sync result.

Exception: a maintainer-approved emergency local patch when the upstream fix is not yet available. Always confirm with the user before making a local edit to a synced file, and mark the edit with a `// TEMP: upstream fix pending` comment so it is easy to revert.

## Key CLI Commands

All commands run from the repo root. The CLI source lives at `tools/cli/src/commands/upstream/`.

```bash
# Full sync — all elements and lib packages from both upstreams
bun run upstream:update

# Single element sync
bun run upstream:sync -- --element <element-name>

# Diff upstream vs. local without applying changes
bun run upstream:check
```

`upstream:update` is equivalent to running `upstream:sync` for every element and lib package in sequence. Use `upstream:sync -- --element <name>` when you need to isolate a single element's sync for review or debugging.

## Version Preservation Rule

`upstream:update` must copy the upstream `package.json` version into `packages/elements-react/<name>/package.json` and `packages/lib-react/<name>/package.json` verbatim. Do **not** reset to `0.0.1` or `0.1.0`.

If after a sync the version has been reset, the transform pipeline has a bug in `sync-package.ts` (or equivalent). Investigate there rather than manually editing `package.json` versions, which will be overwritten on the next sync.

## What Sync Transforms Do

The sync pipeline lives at `tools/cli/src/lib/upstream/`. Each transform handles one concern:

| Transform | What it does |
|---|---|
| `sync-imports` | Rewrites import paths from upstream conventions to this repo's package names. |
| `sync-package-manager` | Rewrites `scripts` and `engines` fields for Bun / this repo's tooling. |
| `sync-externals` | Adjusts the `externals` list in Vite configs to match this repo's peer dependency set. |
| `sync-vite-config` | Adapts build configuration (entry points, output format, etc.) to this repo's Vite conventions. |

When a transform fails on a new upstream pattern (e.g. a new import style or a new config field), the error will indicate which transform threw. Read the transform source to understand what pattern it expects and update the transform to handle the new case.

## Post-Sync Quality Gates

After any sync, run in order:

```bash
bun run typecheck                        # Full repo TypeScript check
bun run lint                             # Biome — no regressions
bun test --filter <synced-package-name>  # Tests for the synced package only
```

Also verify no local edits crept into the synced directories:

```bash
git diff packages/elements-react
git diff packages/lib-react
```

Any unexpected diff here means either a transform is writing extra content or a prior local patch was not reverted. Investigate before committing.

## Common Failure Modes

**Transform fails on a new upstream pattern**

Symptom: `upstream:sync` throws during the transform phase, often with "unexpected token" or "pattern not matched".

Fix: open the relevant transform file in `tools/cli/src/lib/upstream/` (usually `sync-imports.ts` or `sync-vite-config.ts`), identify the new pattern upstream is using, and add a handler. Re-run `upstream:sync -- --element <name>` to test the fix before running the full `upstream:update`.

**Type errors after sync**

Symptom: `bun run typecheck` fails on a type imported from a `@pie-lib/*` package.

Cause: the synced element depends on a `@pie-lib` type that was added upstream but has not been synced yet.

Fix: sync the lib package first (`bun run upstream:sync -- --lib <lib-name>`), then re-run typecheck.

**Test failures after sync**

Symptom: `bun test --filter <package>` fails on tests that previously passed.

Likely causes:
- Upstream element relies on a peer dependency version not present in this repo. Check `peerDependencies` in the synced `package.json` against this repo's workspace root `package.json`.
- Transform introduced a subtle import rewrite error. Compare the failing import path against the upstream source.

In both cases, fix the underlying cause rather than suppressing the test.
