# Bundler Tests

This directory contains unit and integration tests for the PIE element bundler.

## Test Files

### Unit Tests

- **[dependency-hash.test.ts](./dependency-hash.test.ts)** - Tests for deterministic hash generation
  - ✅ Deterministic hashing
  - ✅ Order-independent hashing
  - ✅ Version sensitivity
  - ✅ Duplicate handling
  - ✅ Hash stability

### Integration Tests

- **[bundler.test.ts](./bundler.test.ts)** - End-to-end bundler tests
  - ✅ Bundle creation for single elements
  - ✅ Bundle creation for multiple elements
  - ✅ Caching behavior
  - ✅ Deterministic hash generation
  - ✅ Version resolution for @pie-lib packages
  - ✅ IIFE bundle format validation
  - ✅ Error handling
  - ✅ Performance benchmarks

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test dependency-hash.test.ts

# Run in watch mode
bun test --watch

# Run with coverage
bun test --coverage
```

## Test Performance

### Unit Tests
- **Duration**: ~10-20ms
- **Network**: Not required
- **Cache**: Not applicable

### Integration Tests
- **First Run**: 2-3 minutes per test (downloads packages from NPM)
- **Cached Run**: 30-60 seconds per test (packages already downloaded)
- **Network**: Required for package downloads

## Integration Test Details

The integration tests create temporary directories for testing:
- **Output**: `/tmp/pie-bundler-test-output/`
- **Cache**: `/tmp/pie-bundler-test-cache/`

These directories are cleaned up automatically after tests complete.

### ⚠️ Current Limitation - Upstream Broken Dependencies

**The integration tests currently cannot run successfully** because the older PIE element versions on NPM have broken dependencies:

1. Versions like `@pie-element/multiple-choice@2.0.0` depend on: `mathquill@git+https://github.com/pie-framework/mathquill-webpack.git`
2. This GitHub repository no longer exists (returns 404)
3. Bun install fails when trying to resolve this missing git dependency

**This has been fixed in pie-elements-ng:**
- This repo includes `@pie-element/shared-mathquill` which replaces the broken git dependency
- All elements in this repo have been modernized to use `@pie-element/shared-mathquill`
- Once these modernized elements are published to NPM, the integration tests will work

**Status:**
- ✅ **Unit tests** (`dependency-hash.test.ts`) - 7/7 passing
- ⚠️ **Integration tests** (`bundler.test.ts`) - 19 tests skipped with `describe.skip()`
- ⏳ **Waiting for:** Modernized elements to be published to NPM with fixed dependencies

**Alternative Testing:**
Until NPM packages are fixed, use the **CLI test command** with local workspace packages:
```bash
# Test with local workspace packages (bypasses NPM entirely)
bun cli dev:test-bundler

# With verbose output
bun cli dev:test-bundler --verbose

# Keep workspace for inspection
bun cli dev:test-bundler --keep-workspace
```

See [../TESTING.md](../TESTING.md) for complete documentation on workspace testing.

## Testing with Local Packages (Verdaccio)

You can test the bundler with local packages using Verdaccio (a local NPM registry):

### Quick Start

```bash
# 1. Start Verdaccio
docker compose up -d verdaccio

# 2. Run the Verdaccio test script
cd packages/shared/bundler-shared
bun run tests/run-verdaccio-test.ts
```

The script will:
1. Build local packages (`@pie-element/shared-mathquill`, `@pie-element/multiple-choice`, etc.)
2. Publish them to Verdaccio with a test version (e.g., `0.0.0-test.1234567890`)
3. Run the bundler using Verdaccio as the registry
4. Verify the bundles are created correctly

### Manual Verdaccio Testing

If you want more control:

```bash
# 1. Start Verdaccio
docker compose up -d verdaccio

# 2. Build and publish a package
cd packages/elements-react/multiple-choice
bun run build
npm version 0.0.0-test.1 --no-git-tag-version
npm publish --registry http://localhost:4873

# 3. Test with the bundler
cd packages/shared/bundler-shared
bun run test-with-local.ts  # (create this script)
```

### Environment Variable

The bundler supports a custom registry via environment variable:

```bash
export NPM_REGISTRY=http://localhost:4873
bun test
```

Or pass it directly to the Bundler constructor:

```typescript
const bundler = new Bundler('./bundles', './cache', 'http://localhost:4873');
```

### What Gets Tested

1. **Basic Bundle Creation**
   - Single element bundling
   - File creation on disk
   - IIFE format validation

2. **Caching**
   - Instant retrieval of cached bundles (<100ms)
   - Cache hit/miss detection
   - Hash-based lookup

3. **Multiple Elements**
   - Bundling multiple elements together
   - Order-independent hashing

4. **Version Resolution**
   - Different @pie-lib versions per element
   - Webpack NormalModuleReplacementPlugin behavior

5. **Error Handling**
   - Invalid package names
   - Invalid versions
   - Network failures

6. **Bundle Types**
   - Player bundle (Element export)
   - Client-player bundle
   - Editor bundle (Configure export)

7. **Performance**
   - Build time < 2 minutes
   - Cache retrieval < 100ms

## CI/CD Integration

For CI environments, consider:

1. **Caching NPM packages** between test runs
2. **Parallel test execution** (tests are independent)
3. **Timeout configuration** (increase for first runs)

Example GitHub Actions:

```yaml
- name: Run bundler tests
  run: bun test
  timeout-minutes: 15
  env:
    NODE_ENV: test
```

## Debugging Failed Tests

If integration tests fail:

1. Check network connectivity (NPM registry access)
2. Verify Bun is installed and working
3. Check disk space (bundles can be large)
4. Review console output for webpack errors
5. Manually inspect temp directories:
   ```bash
   ls -la /tmp/pie-bundler-test-output/
   ls -la /tmp/pie-bundler-test-cache/
   ```

## Writing New Tests

When adding new tests:

1. Use descriptive test names
2. Set appropriate timeouts (120s for builds, 60s for errors)
3. Clean up resources in `afterAll`
4. Test both success and failure cases
5. Verify actual bundle content, not just metadata

Example:

```typescript
it('should handle edge case', async () => {
  const result = await bundler.build({
    dependencies: [/* ... */],
  });

  expect(result.success).toBe(true);
  // Verify actual bundle files...
}, 120000); // 2 minute timeout
```
