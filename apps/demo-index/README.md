# Demo Index (dev-only)

Small Bun server that discovers per-package demos and serves them with a simple index page.

## Run

From repo root:

```bash
bun run demos
```

The server will:
1. Build all element packages (`packages/elements-react/*` and `packages/lib-react/*`) before starting
2. Start watch mode to rebuild packages when source files change
3. Serve demos at `http://localhost:5181`

Default URL: `http://localhost:5181`

## Endpoints

- `GET /` → HTML index page
- `GET /__demos.json` → JSON list of demos
- `GET /pkg/<name>/docs/demo/demo.html` → serves the element demo
- `GET /demo/<name>/` → redirects to the demo URL above

## Environment

- `PIE_ELEMENTS_NG_PATH`: override repo root used to locate `packages/…` (default: auto-detected)
- `PIE_DEMO_INDEX_PORT`: server port (default: `5181`)
- `PIE_DEMO_INDEX_SKIP_BUILD`: skip initial build step (default: `false`)
- `PIE_DEMO_INDEX_SKIP_WATCH`: skip watch mode (default: `false`)