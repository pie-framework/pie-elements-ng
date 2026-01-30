# PIE Elements NG

This project is meant to eventually replace the current pie-elements project with the following improvements:

- Current libraries (work underway in pie-elements to upgrade React, MUI, migrate to Tiptap, etc)
- PIE full on board with ESM
- Vite builds, improved tools (like CLI support, demos, etc)
- Better testing support

It includes scripting to help pie-elements migrate to this project.

## Getting started

### Prerequisites

- Bun >= 1.3.7
- Node.js >= 20.0.0
- The `pie-elements` repository checked out as a sibling directory (for upstream sync)

### Initial Setup (First Time)

**Note:** `packages/elements-react` and `packages/lib-react` are synced from the upstream `pie-elements` repository using the CLI tool. These packages **are now committed to git** to simplify the bootstrap process.

```bash
# 1. Clone the repository
git clone <repo-url>
cd pie-elements-ng

# 2. Install dependencies
bun install

# 3. Build all packages
bun run build
```

That's it! The synced packages are already in the repository, so you can get started immediately.

### Syncing from Upstream (Maintainers Only)

**Note:** Only maintainers need to sync from upstream. Regular developers can just `git pull` to get updated packages.

When you need to sync changes from the upstream `pie-elements` repository:

```bash
# 1. Ensure pie-elements is checked out as a sibling directory
ls ../pie-elements/package.json || echo "Need to clone pie-elements!"

# 2. Pull latest upstream changes
cd ../pie-elements && git pull && cd -

# 3. Sync packages (dry run first to see changes)
bun cli upstream:sync --dry-run --verbose

# 4. Sync for real
bun cli upstream:sync

# 5. Review changes, test, and commit
git diff
bun test
git add packages/elements-react packages/lib-react
git commit -m "sync: update from upstream"
git push
```

**Important:** See [UPSTREAM_SYNC_COMMIT_GUIDE.md](UPSTREAM_SYNC_COMMIT_GUIDE.md) for details on what gets committed vs gitignored.

### Development Commands

`bun cli upstream:sync` - Syncs packages from the upstream pie-elements project. Analyzes the current state of that project and copies over what is ready for ESM packaging, including rewrites and restructuring to fit the new project layout.

`bun cli dev:demo multiple-choice` - Test one of the migrated PIE elements in this project. Besides starting a simple demo server, it also starts what is basically an ESM proxy so that references to @pie-element and @pie-lib load from the local system and all other dependencies go to esm.sh.

TODO [fill in more documentation when this comes closer to switching to]
