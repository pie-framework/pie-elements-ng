# PIE Elements NG - Applications

This directory contains user-facing applications for demonstrating PIE assessment elements.

## Directory Structure

```text
apps/
├── element-demo/       # Shared single-element demo app (port 5222)
└── esm-player-test/    # ESM player test application
```

## Quick Start

### Single Element Demo (Recommended)

Run any element's demo using the shared demo app:

```bash
# From repository root
bun run dev:demo multiple-choice
bun run dev:demo categorize
bun run dev:demo hotspot
```

Visit <http://localhost:5222>

**Features:**

- Single shared demo app (NOT copied per-element)
- Looks and behaves exactly like per-element demos
- Works with ANY element in the workspace
- Dynamic element loading via environment variables
- HMR (Hot Module Reload) for instant updates
- DaisyUI theming with light/dark mode toggle
- Delivery, Author, and Print tabs (when available)

**Note:**

- Currently works for **React elements** (`packages/elements-react/`)
- The element **and all its dependencies** must be built first:

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

## Element Demo Architecture

### How It Works

The `apps/element-demo` app is a SvelteKit application that dynamically loads any PIE element at runtime:

1. **CLI Command**: `bun run dev:demo <element-name>`
2. **Environment Variables**: CLI passes element info to Vite:
   - `VITE_ELEMENT_NAME` - e.g., "multiple-choice"
   - `VITE_ELEMENT_PATH` - e.g., "packages/elements-react/multiple-choice"
   - `VITE_ELEMENT_TYPE` - e.g., "react" or "svelte"
3. **Dynamic Loading**: [+page.ts](element-demo/src/routes/+page.ts) uses dynamic imports with `@vite-ignore`
4. **Generic Config**: [vite.config.ts](element-demo/vite.config.ts) has shared package aliases (NOT element-specific)
5. **Module Resolution**: Vite resolves element packages through workspace

### Benefits

- **No Duplication**: Single 30MB app instead of 26 × 30MB = 780MB
- **Exact Match**: Looks identical to per-element demos
- **Easy Maintenance**: Update once, applies to all elements
- **HMR Support**: Source aliases for instant updates
- **Future-Proof**: Works with elements-react and future elements-svelte

### Per-Element Demos (Legacy)

Per-element demos under `packages/elements-react/<element>/demo/` will be removed after verifying the shared demo works. The upstream sync script will stop generating them.

## Architecture Decision

This directory contains the shared element demo app and test tooling.

## Running the Demo

```bash
bun run dev:demo <element>
```

## ESM Player Tests

See `apps/esm-player-test/TESTING.md`.

### Per-package Demos

Each element package has a `demo` script that uses Vite's dev server:

```bash
cd packages/elements-react/multiple-choice
bun run build  # Build the package first
bun run demo   # Start demo server
```

Then open <http://localhost:5174>

This is equivalent to running `bun react-demo --element multiple-choice` from the project root.
