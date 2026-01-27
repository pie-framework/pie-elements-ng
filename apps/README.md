# PIE Elements NG - Applications

This directory contains user-facing applications for demonstrating PIE assessment elements.

## Directory Structure

```
apps/
├── demo-index/         # Per-package demo index (port 5181)
└── examples-react/     # React elements showcase (port 5174)
```

## Quick Start

### Single Element Demo (Recommended)

Run a specific React element's demo from the project root:

```bash
# From repository root
bun react-demo --element categorize
bun react-demo --element multiple-choice
bun react-demo --element hotspot
```

Visit <http://localhost:5174>

**Note**:

- This currently works for **React elements only** (`packages/elements-react/`)
- The element **and all its dependencies** must be built first. Run:

```bash
# Build element with all dependencies (recommended)
bun run build --filter=@pie-element/<element-name>...

# Or build everything
bun run build
```

### Demo Index (all demos)

View all available demos in one app:

```bash
# From repository root
bun run demos
```

Visit <http://localhost:5181>

### React Examples

```bash
# From repository root
bun run react-examples

# Or directly
cd apps/examples-react
bun install
bun run dev
```

Visit http://localhost:5174

**Features:**
- Clean React + Vite setup
- React Router navigation
- Tailwind CSS styling
- Direct component imports (no framework mixing)

**Available elements:**
- Hotspot - Interactive image hotspot selection
- Number Line - Points, lines, and rays

### Per-package Demos

Each element package contains its own demo under `packages/elements-react/<element>/docs/demo`.

## Architecture Decision

We maintain separate example apps for each framework to:

1. **Avoid cross-framework complexity** - No hacky workarounds needed
2. **Use proper tooling** - Each app uses its native dev tools
3. **Better performance** - No mixed runtime overhead
4. **Clearer boundaries** - Easy to understand and maintain
5. **Independent deployment** - Deploy to different URLs if needed

## Running Both Apps

```bash
# Run both concurrently with Turbo
bun run examples
```

## Building

```bash
# Build React examples
cd apps/examples-react && bun run build
```

## Testing

### React Examples
Currently no tests (TBD)

### Per-package Demos

Each element package has a `demo` script that uses Vite's dev server:

```bash
cd packages/elements-react/multiple-choice
bun run build  # Build the package first
bun run demo   # Start demo server
```

Then open <http://localhost:5174>

This is equivalent to running `bun react-demo --element multiple-choice` from the project root.
