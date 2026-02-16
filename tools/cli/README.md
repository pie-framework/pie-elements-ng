# @pie-element/cli

CLI tools for managing PIE Elements NG - synchronization, package generation, and verification.

## Installation

From the root of the monorepo:

```bash
bun install
cd tools/cli
bun run build
```

## Usage

From the root of the monorepo:

```bash
# Show help
bun run cli --help

# Show command help
bun run cli upstream:sync --help
```

## Commands

### Development

#### `dev:demo`

Start a demo server for an element using `apps/element-demo`.

```bash
# Start demo for an element
bun run cli dev:demo hotspot

# Custom port, skip builds, and don't auto-open browser
bun run cli dev:demo multiple-choice --port 5180 --skip-build --no-open
```

### Upstream Synchronization

#### `upstream:sync`

Synchronize code from upstream pie-elements repository.

```bash
# Dry run to preview changes
bun run cli upstream:sync --dry-run

# Sync specific element
bun run cli upstream:sync --element multiple-choice

# Sync all compatible elements (controllers + React UI + demos)
bun run cli upstream:sync

# Verbose output
bun run cli upstream:sync --verbose
```

#### `upstream:check`

Check for changes in upstream repositories.

```bash
# Check all elements
bun run cli upstream:check

# Check specific element
bun run cli upstream:check --element multiple-choice

# Verbose output
bun run cli upstream:check --verbose
```

#### `upstream:track`

Track upstream repository changes.

```bash
# Show new commits since last check
bun run cli upstream:track show

# Record current upstream state
bun run cli upstream:track record

# Compare with specific commit
bun run cli upstream:track compare <commit-sha>
```

#### `upstream:deps`

Compare dependencies with upstream repositories.

```bash
bun run cli upstream:deps
```

#### `upstream:analyze-esm`

Analyze ESM compatibility of elements and packages.

```bash
# Analyze and generate report
bun run cli upstream:analyze-esm

# Verbose output
bun run cli upstream:analyze-esm --verbose

# Custom output path
bun run cli upstream:analyze-esm --output ./my-report.json
```

#### `upstream:update`

Recommended wrapper that runs analyze + sync.

```bash
bun run cli upstream:update
```

#### `upstream:sync-mathquill`

Sync the MathQuill fork used by the project.

```bash
bun run cli upstream:sync-mathquill
```

### Package Management

#### `packages:enable-publishing`

Enable React package publishing (remove private flags).

```bash
# Dry run
bun run cli packages:enable-publishing --dry-run

# Enable publishing
bun run cli packages:enable-publishing
```

#### `packages:create-controllers`

Generate package.json files for controller packages.

```bash
bun run cli packages:create-controllers
```

#### `packages:create-lib-react`

Generate configuration files for @pie-lib React packages.

```bash
# Dry run
bun run cli packages:create-lib-react --dry-run

# Generate files
bun run cli packages:create-lib-react
```

#### `packages:create-react-elements`

Generate configuration files for React element packages.

```bash
bun run cli packages:create-react-elements
```

#### `packages:init-synced-elements`

Initialize package scaffolding for synced elements.

```bash
bun run cli packages:init-synced-elements
```

### Verification

#### `verify:controllers`

Verify controller package exports before publishing.

```bash
bun run cli verify:controllers
```

#### `verify:react-build`

Verify that all React elements build successfully.

```bash
bun run cli verify:react-build
```

## CLI Development

```bash
# Build the CLI
bun run build

# Run in development mode (with source maps)
bun run dev upstream:sync --help

# Lint
bun run lint
```

## Architecture

The CLI is built with [oclif](https://oclif.io/), following the same architecture as the pie-qti CLI.

- **Commands**: Located in `src/commands/` organized by topic
- **Utilities**: Shared utilities in `src/utils/`
- **Topics**: Commands are grouped into topics (upstream, packages, verify)

## Migration from Scripts

This CLI replaces the scripts in `./scripts` directory:

| Old Script                                  | New CLI Command                              |
| ------------------------------------------- | -------------------------------------------- |
| `bun scripts/sync-upstream.ts`              | `bun run cli upstream:sync`                  |
| `bun scripts/check-upstream.ts`             | `bun run cli upstream:check`                 |
| `bun scripts/track-upstream.ts show`        | `bun run cli upstream:track show`            |
| `bun scripts/check-deps.ts`                 | `bun run cli upstream:deps`                  |
| `bun scripts/analyze-esm-compatibility.ts`  | `bun run cli upstream:analyze-esm`           |
| `bun scripts/enable-react-publishing.ts`    | `bun run cli packages:enable-publishing`     |
| `bun scripts/create-controller-packages.ts` | `bun run cli packages:create-controllers`    |
| `bun scripts/create-lib-react-packages.ts`  | `bun run cli packages:create-lib-react`      |
| `bun scripts/create-react-packages.ts`      | `bun run cli packages:create-react-elements` |
| `bun scripts/verify-react-build.ts`         | `bun run cli verify:react-build`             |

## License

Same as parent project.
