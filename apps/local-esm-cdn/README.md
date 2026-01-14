# Local ESM CDN (dev-only)

This app runs a tiny HTTP server that:

- serves **local built** PIE packages (from `pie-elements-ng` on disk)
- rewrites **external** import specifiers to **`https://esm.sh/...`**
- exposes a `/health` endpoint for auto-detection from other repos (like `pie-players`)

## Run

From the `pie-elements-ng` repo root:

```bash
bun run local-esm-cdn
```

Default URL: `http://localhost:5179`

## Requirements

By default, the server runs a **targeted build** first to make sure `dist/` is fresh (builds `packages/elements-react/*` and `packages/lib-react/*`, excluding `@pie-lib/test-utils`).

```bash
bun run local-esm-cdn
```

If you want to skip the build step (faster iteration when you know outputs are fresh):

```bash
LOCAL_ESM_CDN_SKIP_BUILD=1 bun run local-esm-cdn
```

If you want to run the full monorepo build instead:

```bash
LOCAL_ESM_CDN_BUILD_SCOPE=all bun run local-esm-cdn
```

## Endpoints

- `GET /health` → `200` only when built artifacts are detected
- `GET /@pie-element/<name>@<version>` → serves `packages/elements-react/<name>/dist/index.js`
- `GET /@pie-element/<name>@<version>/controller` → serves `packages/elements-react/<name>/dist/controller/index.js` (if present)
- `GET /@pie-lib/<name>@<version>` → serves `packages/lib-react/<name>/dist/index.js`

## Environment variables

- `PIE_ELEMENTS_NG_PATH`: override the repo root used to locate `packages/…` (default: this repo root)
- `LOCAL_ESM_CDN_PORT`: server port (default: `5179`)
- `LOCAL_ESM_CDN_ESM_SH_BASE_URL`: where external imports are rewritten to (default: `https://esm.sh`)

