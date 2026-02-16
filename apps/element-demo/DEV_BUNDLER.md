# Element Demo IIFE Bundler Modes

The element demo supports both player modes:

- `player=esm` (default)
- `player=iife`

When `player=iife`, bundling is local-only.

## dev:demo

Use the CLI command:

```bash
bun run dev:demo
```

Notes:

- IIFE bundling is local-only.
- The dev server uses a per-run temp workspace and cache.
- Restarting `dev:demo` starts with a fresh local bundler cache/output.
- Optional env var `DEMO_BUNDLER_RESOLUTION_MODE` controls dependency resolution:
  - `workspace-fast` (default): resolves `@pie-*` from local workspace
  - `prod-faithful`: resolves from package versions like production

## URL params

The player mode is URL-driven (for refresh/deep-link support):

- `player=esm|iife`

Examples:

- `?player=esm`
- `?player=iife`

## Local build telemetry

In IIFE local mode, the delivery view shows:

- build duration
- cache hit/miss
- bundle hash
- current build stage (`queued`, `installing`, `generating_entries`, `bundling`)

## Async build API (SSE + polling)

The local bundler endpoint supports async build tracking while keeping the same dependency request shape.

Start (async):

```bash
curl -X POST http://localhost:5339/api/bundle \
  -H "Content-Type: application/json" \
  -d '{
    "dependencies":[{"name":"@pie-element/categorize","version":"latest"}],
    "wait": false
  }'
```

Response includes:

- `buildId`
- `hash`
- `statusUrl` (`/api/bundle?buildId=...`) for polling
- `eventsUrl` (`/api/bundle/events?buildId=...`) for SSE

Poll latest status:

```bash
curl "http://localhost:5339/api/bundle?buildId=<buildId>"
```

Stream progress (SSE):

```bash
curl -N "http://localhost:5339/api/bundle/events?buildId=<buildId>"
```

## Dependency version policy

Bundler dependency updates follow a hybrid policy:

- Default to latest stable versions for low-risk tooling.
- Keep high-risk bundler-core packages aligned with the current production bundler until validated.

Current high-risk/parity-set packages:

- `webpack`
- `esbuild-loader`
- loader pipeline behavior (`url-loader` / `file-loader` or webpack asset-module equivalent)

Low-risk packages can generally track latest unless a concrete regression is observed (for example `@babel/runtime`).

Source maps policy:

- Local bundler now builds with webpack `devtool: false` (no `.map` output).
- This is intentional to reduce build time and artifact size when source maps are not used operationally.

## Modernization backlog

1. Replace legacy asset loaders with webpack 5 asset modules:
   - implemented: bundler webpack config now uses webpack asset modules
   - completed: removed `url-loader` / `file-loader` from bundler runtime template and package deps
   - pending: broader runtime verification across additional elements beyond smoke tests
2. Stage `webpack` / `esbuild-loader` upgrades with comparison tests:
   - keep parity versions as control
   - upgrade in a branch/canary path
   - compare build success, output behavior, and runtime compatibility across representative element sets

