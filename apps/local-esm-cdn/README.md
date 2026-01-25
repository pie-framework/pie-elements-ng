# Local ESM CDN

A development-only ESM module server that serves local PIE packages from disk and proxies external dependencies to esm.sh.

## Features

- ✅ Serves locally-built PIE packages (@pie-element, @pie-lib, @pie-element, @pie-framework)
- ✅ Rewrites external imports (react, etc.) to esm.sh
- ✅ Framework-agnostic: Works with any web framework
- ✅ Two modes: Standalone server or embedded middleware
- ✅ Full CORS support
- ✅ Health check endpoint
- ✅ TypeScript support

## Usage

### Standalone Server (CLI)

Run as a standalone development server:

```bash
# From repo root
bun run local-esm-cdn

# From this directory
bun run dev
```

Default URL: `http://localhost:5179`

#### Environment Variables

- `PIE_ELEMENTS_NG_PATH` - Path to pie-element repo (default: auto-detected)
- `LOCAL_ESM_CDN_PORT` - Server port (default: 5179)
- `LOCAL_ESM_CDN_ESM_SH_BASE_URL` - CDN base URL (default: https://esm.sh)
- `LOCAL_ESM_CDN_SKIP_BUILD` - Skip pre-build (default: false)
- `LOCAL_ESM_CDN_BUILD_SCOPE` - Build scope: 'none', 'esm', or 'all' (default: 'esm')
- `LOCAL_ESM_CDN_ALLOW_RANDOM_PORT_FALLBACK` - Use random port if busy (default: true)
- `LOCAL_ESM_CDN_SELF_TEST` - Run self-test and exit (default: false)

Examples:

```bash
# Skip build step (faster when packages already built)
LOCAL_ESM_CDN_SKIP_BUILD=true bun run local-esm-cdn

# Build all packages (slower but thorough)
LOCAL_ESM_CDN_BUILD_SCOPE=all bun run local-esm-cdn

# Use custom port
LOCAL_ESM_CDN_PORT=3000 bun run local-esm-cdn
```

### Embedded Mode

Import and use in your web application for single-process development. No need to run a separate server!

#### Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { createVitePlugin } from '@pie-element/local-esm-cdn/adapters/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    createVitePlugin({
      repoRoot: path.resolve(__dirname, '../..'),
      esmShBaseUrl: 'https://esm.sh',
    }),
  ],
});
```

Now your Vite dev server will automatically serve `/@pie-element/*` routes!

#### SvelteKit

```typescript
// src/hooks.server.ts
import { createSvelteKitHandle } from '@pie-element/local-esm-cdn/adapters/sveltekit';

export const handle = createSvelteKitHandle({
  repoRoot: '/path/to/pie-element',
  esmShBaseUrl: 'https://esm.sh',
});
```

With other hooks:

```typescript
// src/hooks.server.ts
import { createSvelteKitHandle } from '@pie-element/local-esm-cdn/adapters/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';

const localEsmCdn = createSvelteKitHandle({
  repoRoot: '/path/to/pie-element',
  esmShBaseUrl: 'https://esm.sh',
});

export const handle = sequence(localEsmCdn, myOtherHandle);
```

#### Express/Connect

```typescript
import express from 'express';
import { createConnectMiddleware } from '@pie-element/local-esm-cdn/adapters/connect';

const app = express();

app.use(
  createConnectMiddleware({
    repoRoot: '/path/to/pie-element',
    esmShBaseUrl: 'https://esm.sh',
  })
);

app.listen(3000);
```

#### Custom Framework

For any framework that can handle Web API Request/Response:

```typescript
import { createLocalEsmCdn } from '@pie-element/local-esm-cdn/embedded';

const cdn = createLocalEsmCdn({
  repoRoot: '/path/to/pie-element',
  esmShBaseUrl: 'https://esm.sh',
});

// In your request handler:
if (req.url.startsWith('/@pie-')) {
  const webRequest = new Request(req.url, {
    method: req.method,
    headers: req.headers,
  });

  const webResponse = await cdn.handler(webRequest);

  // Convert webResponse back to your framework's response format
  return convertToFrameworkResponse(webResponse);
}
```

## Configuration

### LocalEsmCdnConfig

```typescript
interface LocalEsmCdnConfig {
  /** Root path to the pie-element repository */
  repoRoot: string;

  /** Base URL for esm.sh (or alternative CDN) */
  esmShBaseUrl: string;

  /** Whether to run build before serving (standalone mode only) */
  preBuild?: boolean;

  /** Build scope: 'none' | 'esm' | 'all' */
  buildScope?: BuildScope;

  /** Enable debug logging */
  debug?: boolean;
}
```

## Endpoints

When running (standalone or embedded), the following endpoints are available:

- `GET /health` - Health check (returns build status)
- `GET /@pie-element/<name>[@<version>][/<subpath>]` - Serve element package
- `GET /@pie-lib/<name>[@<version>][/<subpath>]` - Serve library package
- `GET /@pie-element/<name>[@<version>][/<subpath>]` - Serve shared package
- `GET /@pie-framework/<name>[@<version>][/<subpath>]` - Serve framework package

Examples:

- `/@pie-element/hotspot` → `packages/elements-react/hotspot/dist/index.js`
- `/@pie-element/hotspot/controller` → `packages/elements-react/hotspot/dist/controller/index.js`
- `/@pie-lib/render-ui` → `packages/lib-react/render-ui/dist/index.js`
- `/@pie-element/shared-math-rendering` → `packages/shared/math-rendering/dist/index.js`
- `/@pie-framework/pie-player-events` → `packages/shared/player-events/dist/index.js`

## How It Works

1. **Package Resolution**: Maps package requests to local dist/ directories
   - `@pie-element/NAME` → `packages/elements-react/NAME/dist/`
   - `@pie-lib/NAME` → `packages/lib-react/NAME/dist/`
   - `@pie-element/shared-NAME` → `packages/shared/NAME/dist/`
   - `@pie-framework/pie-NAME` → `packages/shared/NAME/dist/`

2. **Import Rewriting**: Analyzes JS code and rewrites imports
   - External packages (react, etc.) → `https://esm.sh/react`
   - Local PIE packages → Served from local disk
   - Relative imports → Converted to absolute package paths

3. **Health Checks**: Validates that packages are built and available

## Architecture

```
apps/local-esm-cdn/
├── src/
│   ├── core/                    # Framework-agnostic core
│   │   ├── config.ts           # Configuration types and defaults
│   │   ├── handler.ts          # Main request handler
│   │   ├── resolver.ts         # Package resolution logic
│   │   ├── health.ts           # Health check logic
│   │   └── utils.ts            # Response helpers, CORS
│   ├── runtime/
│   │   └── bun.ts              # Bun-specific server
│   ├── adapters/               # Framework adapters
│   │   ├── vite.ts             # Vite plugin
│   │   ├── sveltekit.ts        # SvelteKit hooks
│   │   └── connect.ts          # Express/Connect middleware
│   ├── rewrite-imports.ts      # Import rewriting logic
│   ├── index.ts                # Standalone CLI entry
│   └── embedded.ts             # Embedded/middleware entry
```

## Development

### Run Standalone Server

```bash
bun run dev
```

### Run Tests

The package includes comprehensive integration tests:

```bash
# Run all tests
bun test

# Run specific test suites
bun test:standalone    # Standalone server tests
bun test:embedded      # Embedded API tests
bun test:adapters      # Framework adapter tests

# Watch mode
bun test:watch
```

**Legacy routing test** (still supported):
```bash
# Start server in background
LOCAL_ESM_CDN_SKIP_BUILD=true bun run src/index.ts &

# Run legacy test
bun test-routing.ts

# Kill background server
kill %1
```

See [test/README.md](test/README.md) for more details.

### Build Packages

```bash
# Build all packages
bun run build

# Build only elements/libs (faster)
bun x turbo run build --filter=./packages/elements-react/* --filter=./packages/lib-react/*
```

## Benefits

1. ✅ **Single Process** - No separate server needed when embedded
2. ✅ **Framework Agnostic** - Works with any framework
3. ✅ **Backward Compatible** - Existing standalone usage unchanged
4. ✅ **Type Safe** - Full TypeScript support
5. ✅ **Testable** - Core logic is pure and isolated
6. ✅ **Extensible** - Easy to add new framework adapters
7. ✅ **Performance** - Shared in-memory caching when embedded

## Troubleshooting

### Health check returns "not ready"

Build the packages first:

```bash
bun run build
```

Or build just the packages you need:

```bash
bun x turbo run build --filter=@pie-element/hotspot
```

### Port already in use

Set a different port:

```bash
LOCAL_ESM_CDN_PORT=5180 bun run dev
```

Or let it find a random available port automatically (enabled by default).

### Import rewriting not working

Make sure you're requesting packages with the correct URL format:

- ✅ `/@pie-element/hotspot`
- ✅ `/@pie-element/hotspot@1.0.0`
- ✅ `/@pie-lib/render-ui`
- ❌ `/pie-element/hotspot` (missing `@`)
- ❌ `/@pie/hotspot` (wrong scope)

## License

This is a development tool for the pie-element monorepo.
