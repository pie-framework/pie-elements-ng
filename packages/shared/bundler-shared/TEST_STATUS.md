# Bundler Test Status

Last Updated: 2026-02-01

## Quick Summary

```
✅ Unit Tests:         7/7 passing
⚠️  Integration Tests:  19 skipped (NPM packages have broken dependencies)
✅ Manual Testing:     Available via `bun cli dev:test-bundler`
```

## Test Suite Breakdown

### ✅ Unit Tests - PASSING

**File**: `tests/dependency-hash.test.ts`

**Status**: All tests passing

**Tests**:
1. ✅ Deterministic hash generation
2. ✅ Order-independent hashing (same hash regardless of dependency order)
3. ✅ Version sensitivity (different versions = different hashes)
4. ✅ Package sensitivity (different packages = different hashes)
5. ✅ Duplicate handling (duplicates removed before hashing)
6. ✅ Multiple dependencies support
7. ✅ Stability across process restarts (hash `1091131105` for `multiple-choice@2.0.0`)

**Run**: `bun test dependency-hash.test.ts`

**Duration**: ~25ms

### ⚠️ Integration Tests - SKIPPED

**File**: `tests/bundler.test.ts`

**Status**: All tests skipped with `describe.skip()`

**Why Skipped**:
The integration tests download packages from NPM, but NPM packages (v2.0.0+) have a broken dependency:
```
mathquill@git+https://github.com/pie-framework/mathquill-webpack.git (404)
```

This repo has fixed the issue by using `@pie-element/shared-mathquill`, but NPM packages haven't been republished yet.

**Tests (19 total)**:
- Basic Bundle Creation (3 tests)
  - Build bundle for single element
  - Create bundle files on disk
  - Generate valid IIFE bundles
- Caching (5 tests)
  - Return cached bundle on second build
  - Different hashes for different versions
  - Check bundle existence with `exists()`
  - Get bundle URLs
  - Fast cache retrieval
- Multiple Elements (2 tests)
  - Bundle multiple elements
  - Deterministic hashes regardless of order
- Version Resolution (1 test)
  - Handle elements with different @pie-lib versions
- Error Handling (2 tests)
  - Invalid package name
  - Invalid version
- Bundle Types (3 tests)
  - Player bundle with Element export
  - Client-player bundle
  - Editor bundle with Configure export
- Performance (2 tests)
  - Build completion within 2 minutes
  - Fast cache retrieval (<100ms)

**Run**: Tests are skipped by default. To attempt running: `bun test bundler.test.ts`

**Expected Duration** (if working): 2-3 minutes per test on first run, 30-60s on subsequent runs

### ✅ Manual Testing - WORKING

**Command**: `bun cli dev:test-bundler`

**Status**: Fully functional

**What it does**:
1. Builds local packages (mathquill, test element)
2. Creates test workspace with symlinked packages
3. Runs bundler without downloading from NPM
4. Verifies bundle outputs

**Features**:
- `--element <name>` - Test with specific element (default: multiple-choice)
- `--verbose` - Show detailed webpack output
- `--keep-workspace` - Keep workspace for debugging
- `--clean` - Clean workspace before running

**Example**:
```bash
# Basic test
bun cli dev:test-bundler

# Verbose with workspace inspection
bun cli dev:test-bundler --verbose --keep-workspace

# Test different element
bun cli dev:test-bundler --element hotspot
```

See [TESTING.md](./TESTING.md) for complete documentation.

## Can Tests Run in CI?

| Test Type | CI Ready? | Notes |
|-----------|-----------|-------|
| Unit Tests | ✅ YES | Fast, no external dependencies |
| Integration Tests | ❌ NO | Requires NPM packages with broken deps |
| Manual Testing | ⚠️ OPTIONAL | Could run in CI but slower (builds packages) |

### Recommended CI Configuration

```yaml
# .github/workflows/test.yml
- name: Run bundler unit tests
  working-directory: packages/shared/bundler-shared
  run: bun test dependency-hash.test.ts
  timeout-minutes: 1
```

Or to include manual testing:

```yaml
# Run unit tests + manual integration test
- name: Run bundler tests
  run: |
    cd packages/shared/bundler-shared
    bun test dependency-hash.test.ts
    cd ../../..
    bun cli dev:test-bundler
  timeout-minutes: 5
```

## Re-enabling Integration Tests

Once NPM packages are published with fixed dependencies:

1. **Remove the skip** in `tests/bundler.test.ts`:
   ```typescript
   // Change:
   describe.skip('Bundler Integration Tests (DISABLED - NPM packages have broken deps)', () => {

   // To:
   describe('Bundler Integration Tests', () => {
   ```

2. **Update the header comment** to remove the warning

3. **Run tests**:
   ```bash
   bun test
   ```

4. **Update this document** to reflect that integration tests are now active

## Bundle Compatibility Verification

The bundler output has been verified to be compatible with production bundles from `pie-api-aws`:

✅ **Verified Against**:
- `https://builder.pie-api.com/bundles/@pie-element/passage@1.12.2/client-player.js`
- `https://builder.pie-api.com/bundles/@pie-element/multiple-choice@7.16.0/client-player.js`

✅ **Compatibility**:
- IIFE format: ✅
- Global assignment to `window.pie`: ✅
- Export structure: ✅
  ```javascript
  window.pie = {
    '@pie-element/passage': { Element: Component },
    '@pie-element/passage@1.12.2': { Element: Component }
  }
  ```

See [tests/verify-bundle-compatibility.md](./tests/verify-bundle-compatibility.md) for details.

## Next Steps

- [ ] Publish modernized elements to NPM with fixed dependencies
- [ ] Re-enable integration tests
- [ ] Consider adding integration tests that use workspace packages (like `dev:test-bundler`)
- [ ] Add bundle size regression tests
- [ ] Add tests for @pie-lib version resolution edge cases
