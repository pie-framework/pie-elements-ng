# @pie-elements-ng/cli

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

### Upstream Synchronization

#### `upstream:sync`
Synchronize code from upstream pie-elements repository.

```bash
# Dry run to preview changes
bun run cli upstream:sync --dry-run

# Sync specific element
bun run cli upstream:sync --element multiple-choice

# Sync React components
bun run cli upstream:sync --react

# Sync @pie-lib packages
bun run cli upstream:sync --pie-lib

# Sync all elements (ignore ESM filter)
bun run cli upstream:sync --all

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

### Verification

#### `verify:react-build`
Verify that all React elements build successfully.

```bash
bun run cli verify:react-build
```

## Development

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

| Old Script | New CLI Command |
|------------|----------------|
| `bun scripts/sync-upstream.ts` | `bun run cli upstream:sync` |
| `bun scripts/check-upstream.ts` | `bun run cli upstream:check` |
| `bun scripts/track-upstream.ts show` | `bun run cli upstream:track show` |
| `bun scripts/check-deps.ts` | `bun run cli upstream:deps` |
| `bun scripts/analyze-esm-compatibility.ts` | `bun run cli upstream:analyze-esm` |
| `bun scripts/enable-react-publishing.ts` | `bun run cli packages:enable-publishing` |
| `bun scripts/create-controller-packages.ts` | `bun run cli packages:create-controllers` |
| `bun scripts/create-lib-react-packages.ts` | `bun run cli packages:create-lib-react` |
| `bun scripts/create-react-packages.ts` | `bun run cli packages:create-react-elements` |
| `bun scripts/verify-react-build.ts` | `bun run cli verify:react-build` |

## License

Same as parent project.
