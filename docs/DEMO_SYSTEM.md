# PIE Element Demo System

## Overview

The demo system uses a single shared app and picks the element to load at runtime.

- **`dev:demo`**: runs `apps/element-demo` and loads an element via `VITE_*` env vars.

## Quick Start

```bash
# Default demo (shared app)
bun run dev:demo categorize

```

## How It Works

`apps/element-demo` reads:

- `VITE_ELEMENT_NAME`
- `VITE_ELEMENT_PATH`
- `VITE_ELEMENT_TYPE`

The CLI commands set these env vars and start a single Vite dev server.
The app loads the element from the workspace using the resolver plugin.

## Per-Element Demo Data

Each element supplies demo data under:

```
packages/elements-{react|svelte}/{element}/docs/demo/
├── config.mjs
└── session.mjs
```

The shared app reads those files to populate the model and session.
