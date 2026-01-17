# Local ESM CDN Integration Tests

This directory contains integration tests for the local-esm-cdn package.

## Test Files

- **standalone.test.ts** - Tests for the standalone Bun server mode
- **embedded.test.ts** - Tests for the embedded API (`createLocalEsmCdn`)
- **adapters.test.ts** - Tests for framework adapters (Vite, SvelteKit, Connect)

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test test/standalone.test.ts
bun test test/embedded.test.ts
bun test test/adapters.test.ts

# Run with watch mode
bun test --watch
```

## Prerequisites

Make sure packages are built before running tests:

```bash
# Build all packages (slow)
bun run build

# Or build just elements/libs (faster)
bun x turbo run build --filter=./packages/elements-react/* --filter=./packages/lib-react/*
```

## Test Coverage

### Standalone Server Tests
- ✅ Health endpoint
- ✅ Package serving (@pie-element, @pie-lib, @pie-elements-ng, @pie-framework)
- ✅ CORS headers
- ✅ Import rewriting (external → esm.sh, local preserved)
- ✅ Error handling (404s)
- ✅ Help text

### Embedded API Tests
- ✅ Request handler
- ✅ Health checks
- ✅ Config updates
- ✅ Import rewriting
- ✅ Multiple package types
- ✅ CORS preflight

### Adapter Tests
- ✅ Vite plugin structure and behavior
- ✅ SvelteKit handle function
- ✅ Express/Connect middleware
- ✅ Request routing (PIE vs non-PIE)
- ✅ Configuration handling

## Environment Variables

- `PIE_ELEMENTS_NG_PATH` - Override repo root for tests (optional, auto-detected)

## Notes

- Tests use random ports to avoid conflicts
- Standalone tests start/stop a real server
- Embedded tests use the Web Request/Response API
- Adapter tests use mocks where appropriate
