# PIE Elements NG

A modern, ESM-first implementation of the PIE (Platform Independent Elements) specification. This is a **new project** (not a refactor) that provides a clean foundation for future PIE development while maintaining backwards compatibility through the legacy pie-elements project.

**Current Status**: Early development (v0.1.0) - 28 React-based elements synced from upstream, core infrastructure in place.

## Why a New Project?

The PIE team's work on upstream library modernization (React 18, MUI 7, Tiptap editor) now enables full ESM adoption and modern tooling. This new project takes advantage of those improvements while keeping the legacy pie-elements available for existing consumers.

## Key Improvements Over Legacy pie-elements

1. **Framework-agnostic architecture** - Architecture designed to support multiple frameworks (React, Svelte, future Vue/Angular) via web components. Currently: React implementations synced from upstream.
2. **ESM-first build system** - Browser-managed dependencies, better caching, smaller bundles (vs CommonJS + webpack IIFE bundles)
3. **Unified player approach** - Element-level players for development (interactive + print), item-level players in pie-players for production
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

### Initial Setup (First Time)

**Note:** `packages/elements-react` and `packages/lib-react` are synced from the upstream `pie-elements` repository and **committed to git**. You don't need to check out the upstream repositories unless you're a maintainer syncing new changes.

```bash
# 1. Clone the repository
git clone <repo-url>
cd pie-elements-ng

# 2. Install dependencies
bun install

# Hooks are installed automatically via postinstall.
# If needed, you can reinstall them manually:
bun run hooks:install

# 3. Build all packages
bun run build
```

That's it! All packages are already in the repository, so you can get started immediately.

### Syncing from Upstream (Maintainers Only)

**Note:** Only maintainers need to sync from upstream. Regular developers can just `git pull` to get updated packages.

If you're a maintainer and need to sync changes from the upstream `pie-elements` repository:

```bash
# 1. Clone upstream repositories as siblings (one-time setup)
cd ..
git clone https://github.com/PieLabs/pie-elements.git
git clone https://github.com/PieLabs/pie-lib.git
cd pie-elements-ng

# 2. Pull latest upstream changes
cd ../pie-elements && git pull && cd -
cd ../pie-lib && git pull && cd -

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

`bun run build` - Build all packages in the monorepo

`bun run dev` - Start the demo application in development mode

`bun run test` - Run all tests

`bun run typecheck` - TypeScript type checking across all packages

### Release Labels

Use release labels to tag a coordinated release wave across packages while keeping package versions independent.

`bun run release:label` - Create an annotated tag (default: `pie-elements-ng-YYYY.MM.DD`)

`bun run release:label -- --label elements-ng-2026.02` - Create a custom release tag name

`bun run release:label:push` - Create and push the release tag to origin

### Manual Publish Recovery (GitHub Actions)

If a publish fails after the version PR was already merged, rerun the Release workflow manually:

1. Actions → **Release** → **Run workflow**
2. Branch: `master`
3. `release_intent`: `publish`
4. `force_publish`: `true`

This is intended for recovery/rerun scenarios only.

### Maintainer Commands

`bun cli upstream:sync` - (Maintainers only) Syncs packages from the upstream pie-elements project. Requires pie-elements and pie-lib checked out as sibling directories. Analyzes the current state of those projects and copies over what is ready for ESM packaging, including rewrites and restructuring to fit the new project layout.

## Print Support

PIE elements include print views for generating paper-based assessments and answer keys. Two complementary players serve different use cases:

### Element-Level Print Player (This Project)
For development and testing of individual elements:
```html
<pie-esm-print-player element-name="multiple-choice" role="student" model={...} />
```
- **Package:** `@pie-element/element-player`
- **Use for:** Element development, testing, documentation
- **Location:** `packages/element-player/src/players/EsmPrintPlayer.svelte`

### Item-Level Print Player (pie-players)
For production rendering of complete assessment items:
```html
<pie-print config={{ item: {...}, options: { role: 'student' } }}></pie-print>
```
- **Package:** `@pie-player/print` (in pie-players repository)
- **Use for:** Production apps, multi-element items, markup-driven rendering
- **Location:** `../pie-players/packages/print-player`

See [docs/PRINT_SUPPORT.md](docs/PRINT_SUPPORT.md) for complete documentation.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Detailed architecture and design decisions
- [Print Support](docs/PRINT_SUPPORT.md) - Print architecture and usage
- [Upstream Sync Guide](docs/migration/UPSTREAM_SYNC_GUIDE.md) - Syncing from pie-elements
