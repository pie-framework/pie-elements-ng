# ESM Testing Strategy

## Overview

This document outlines a planned strategy for validating that PIE element packages are production-ready for ESM consumption via npm/CDN services like esm.sh.
The automation scripts for this flow are not part of the repo yet.

## The Problem

We need to ensure that:
1. Built packages are truly ESM-compatible
2. Import/export resolution works correctly
3. Relative imports in built files resolve properly
4. Package.json `exports` fields are configured correctly
5. All dependencies are properly externalized

## The Solution: Verdaccio Local Registry

We use [Verdaccio](https://verdaccio.org/) as a local npm registry to test package publishing and consumption in a production-like environment.

### Why Verdaccio?

**Compared to Development Approaches:**
- ❌ Local file serving: Doesn't test npm package resolution
- ❌ Vite dev server: Uses module transforms, not real package loading
- ❌ Local ESM CDN simulation: Too many edge cases with virtual modules
- ✅ **Verdaccio: Exact npm behavior, real tarball extraction, true resolution**

**Benefits:**
- Tests real npm package structure and resolution
- Validates `package.json` exports and module fields
- Catches issues before publishing to real npm
- Works identically across all platforms (via Docker)
- Fast local iteration without external dependencies

## Architecture

```
┌─────────────────┐
│ Source Code     │
│ (TypeScript)    │
└────────┬────────┘
         │ bun run build
         ▼
┌─────────────────────────────────────────┐
│ Built Packages (dist/ folders)          │
└─────┬──────────────────────┬────────────┘
      │                      │
      │ npm publish          │ direct file access
      │                      │
      ▼                      ▼
┌─────────────┐      ┌─────────────────┐
│ Verdaccio   │      │ Package Server  │
│ (Docker)    │      │ (Bun)           │
│ :4873       │      │ :4874           │
└─────────────┘      └────────┬────────┘
  Validates                   │ HTTP file requests
  packages                    │
                              ▼
                      ┌─────────────────┐
                      │ Demo HTML       │
                      │ (Import Maps)   │
                      └─────────────────┘
```

## Workflow

### 1. Start Verdaccio

```bash
npm run registry:start
```

Starts Docker container on `http://localhost:4873`

### 2. Build & Publish

```bash
npm run registry:publish
```

Builds all packages with Turbo and publishes to local registry.

### 3. Test with Demos

Demos use import maps pointing to the package server:

```html
<script type="importmap">
{
  "imports": {
    "@pie-element/element-player": "http://localhost:4874/@pie-element/element-player/0.1.0/dist/pie-element-player.js",
    "@pie-element/multiple-choice/": "http://localhost:4874/@pie-element/multiple-choice/0.1.0/dist/",
    "@pie-lib/": "http://localhost:4874/@pie-lib/"
  }
}
</script>
```

### 4. Run E2E Tests

```bash
npm run test:demos
```

Playwright tests verify elements load and render correctly.

## Package Build Strategy

### Current Approach: `preserveModules`

Packages are built with Vite's `preserveModules: true` option:

```
dist/
  index.js
  configure/
    index.js
    utils.js
  controller/
    index.js
```

**Pros:**
- Matches source structure
- Good for debugging
- Works with upstream sync naturally

**Cons:**
- More HTTP requests on CDN
- Requires careful relative import handling

**Verdict:** This approach works fine with Verdaccio and real npm. The relative imports work because the package tarball preserves directory structure.

### Alternative: Bundled Subpaths

Could bundle each major export:

```
dist/
  index.js          (main bundle)
  configure.js      (configure bundle)
  controller.js     (controller bundle)
```

**When to consider:**
- If CDN costs become significant
- If bundle size needs optimization
- If tree-shaking is important

## Key Validations

Verdaccio testing validates:

1. ✅ **Package structure**: Are files in the right places?
2. ✅ **Module resolution**: Do imports resolve correctly?
3. ✅ **Exports field**: Does `package.json` exports work?
4. ✅ **Dependencies**: Are externals handled correctly?
5. ✅ **Relative imports**: Do built files import each other properly?
6. ✅ **TypeScript definitions**: Are `.d.ts` files generated correctly?

## Differences from Production

Verdaccio is **production-equivalent** for package structure testing, but there are minor differences:

| Aspect | Verdaccio | Real npm | Impact |
|--------|-----------|----------|--------|
| Package resolution | Identical | Identical | None |
| Tarball extraction | Identical | Identical | None |
| HTTP caching | Local | CDN-backed | Performance only |
| URL format | `localhost:4873` | `esm.sh` | Import map change only |

**Bottom line:** If it works with Verdaccio, it will work with npm/esm.sh.

## Troubleshooting Guide

### Issue: 404 for sub-paths

**Symptom:** `http://localhost:4873/@pie-lib/config-ui/tags-input/index.js` returns 404

**Cause:** `package.json` exports field doesn't include the subpath

**Fix:** Add to package.json:
```json
{
  "exports": {
    "./tags-input": "./dist/tags-input/index.js"
  }
}
```

### Issue: Relative import fails

**Symptom:** Built file has `import from "../foo"` but 404s

**Cause:** `preserveModules` kept relative import, but path doesn't exist in tarball

**Fix:** Ensure directory structure is preserved in build output, or use absolute imports

### Issue: Version conflict

**Symptom:** Changes don't appear after republishing

**Cause:** Verdaccio cached the package

**Fix:**
```bash
# Option 1: Bump version
npm run changeset && npm run version

# Option 2: Force publish
npm run registry:publish:force

# Option 3: Reset registry
npm run registry:reset
```

## CI/CD Integration

For automated testing in CI:

```yaml
# .github/workflows/test.yml
- name: Start Verdaccio
  run: docker compose up -d verdaccio

- name: Wait for registry
  run: npx wait-on http://localhost:4873

- name: Publish packages
  run: npm run registry:publish

- name: Run E2E tests
  run: npm run test:demos
```

## Why Two Servers?

Our demo system uses two complementary servers:

### 1. Verdaccio (Port 4873) - Package Validation

- Validates packages can be published to npm
- Tests package.json configuration
- Verifies tarball structure
- **Does NOT serve individual files** (only tarballs for npm install)

### 2. Package Server (Port 4874) - File Serving

- Serves built dist/ files directly from workspace
- Works with browser import maps
- Provides CDN-like file serving for demos
- Fast iteration without republishing

This two-server approach gives us both production validation (Verdaccio) and developer convenience (package server).

## Future Considerations

### Option 1: Keep Current Strategy
- Works well with Verdaccio
- Aligns with upstream structure
- No changes needed

### Option 2: Optimize for CDN
If CDN costs or performance become issues:
- Bundle major subpaths
- Reduce file count
- Improve tree-shaking

**Recommendation:** Stick with Option 1 until data shows optimization is needed.

## Related Documentation

- [Verdaccio Setup Guide](./verdaccio-setup.md)
- [Package Publishing Workflow](../README.md#publishing)
- [E2E Testing Guide](../tests/e2e/README.md)
