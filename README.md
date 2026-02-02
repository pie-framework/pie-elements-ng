# PIE Elements NG

A modern, ESM-first implementation of the PIE (Platform Independent Elements) specification. This is a **new project** (not a refactor) that provides a clean foundation for future PIE development while maintaining backwards compatibility through the legacy pie-elements project.

## Why a New Project?

The PIE team's work on upstream library modernization (React 18, MUI 7, Tiptap editor) now enables full ESM adoption and modern tooling. This new project takes advantage of those improvements while keeping the legacy pie-elements available for existing consumers.

## Key Improvements Over Legacy pie-elements

1. **Framework-agnostic architecture** - Supports multiple frameworks (React, Svelte, future Vue/Angular) via web components, not just React
2. **ESM-first build system** - Browser-managed dependencies, better caching, smaller bundles (vs CommonJS + webpack IIFE bundles)
3. **Unified player** - Single player for all views (delivery, authoring, print), enabled by ESM on-demand loading
4. **Symmetric package organization** - Peer folders (delivery/author/controller/print) vs asymmetric legacy structure
5. **Modern standard tooling** - Vite + Bun + Turbo vs bespoke pie-cli + pie-shared-lib-builder
6. **Consolidated demo system** - Single unified SvelteKit app for all elements vs per-element tool-generated demos
7. **Integrated monorepo** - @pie-lib pulled in vs separate repository
8. **Workspace-wide versioning** - Synchronized releases across all packages vs independent per-package versions
9. **GitHub Actions CI/CD** - Modern GitHub-native workflows vs CircleCI

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed explanations of each difference.

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
