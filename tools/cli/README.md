# @pie-element/cli

CLI tools for managing PIE Elements NG - demos, package management, docs generation, and verification.

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
bun run cli dev:demo --help
```

## Commands

### Development

#### `dev:demo`

Start `apps/element-demo`, which serves every element; the URL picks the element (`/<element>/deliver`).

```bash
# Start the demo on port 5222
bun run cli dev:demo

# Custom port, build all elements first, and don't auto-open browser
bun run cli dev:demo --port 5180 --build --no-open
```

### Package Management

#### `packages:enable-publishing`

Enable publishing for all `@pie-element/*` and `@pie-lib/*` packages (remove private flags and clear matching Changesets ignore entries).

```bash
# Dry run
bun run cli packages:enable-publishing --dry-run

# Enable publishing
bun run cli packages:enable-publishing
```

### Documentation

#### `docs:generate`

Generate framework-agnostic HTML docs artifacts for elements from per-element `docs.contract.json` descriptors.
The element demo runs this during `prebuild`/`predev`; the generated `static/element-docs`
directory is a local build artifact and is not committed.

```bash
# Generate docs for all elements
bun run cli docs:generate

# Generate for one framework/element
bun run cli docs:generate --framework svelte --element simple-cloze

# Seed missing contracts before generation
bun run cli docs:generate --seed-contracts
```

### Verification

#### `docs:verify`

Verify that all targeted elements have valid `docs.contract.json` descriptors and that local generated docs match the current generator output.

```bash
# Verify all frameworks
bun run cli docs:verify

# Verify one framework/element
bun run cli docs:verify --framework svelte --element simple-cloze
```

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

#### `verify:dependency-integrity`

Inspect package imports and classify dependency usage as direct, transitive, hoist-reliant, or broken.

```bash
# Scan all element/lib-react packages
bun run cli verify:dependency-integrity

# Scan one package
bun run cli verify:dependency-integrity --package @pie-element/ebsr

# Fail on hoist-reliant imports too (not only broken)
bun run cli verify:dependency-integrity --fail-on-hoist
```

## CLI Development

```bash
# Build the CLI
bun run build

# Run in development mode (with source maps)
bun run dev dev:demo --help

# Lint
bun run lint
```

## Architecture

The CLI is built with [oclif](https://oclif.io/), following the same architecture as the pie-qti CLI.

- **Commands**: Located in `src/commands/` organized by topic
- **Utilities**: Shared utilities in `src/utils/`
- **Topics**: Commands are grouped into topics (dev, packages, docs, verify)

## License

Same as parent project.
