# MathQuill Package Maintenance Guide

This package is a modernized ESM wrapper around the PIE Framework fork of MathQuill.

## Overview

- **Upstream Source**: `../../../mathquill` (PIE fork)
- **Package Location**: `packages/shared/mathquill`
- **Package Name**: `@pie-framework/mathquill`
- **Version**: 1.1.4 (ESM modernized)
- **Module Format**: ESM with TypeScript declarations
- **Build System**: Vite + TypeScript

## Package Structure

```
packages/shared/mathquill/
├── src/
│   ├── index.ts              # ESM entry point
│   ├── types.ts              # TypeScript type definitions
│   ├── legacy/
│   │   └── mathquill-bundle.js  # Concatenated IIFE source
│   ├── intro.js              # IIFE start (from upstream)
│   ├── outro.js              # IIFE end (from upstream)
│   ├── tree.js               # Core files (from upstream)
│   ├── cursor.js
│   ├── controller.js
│   ├── publicapi.js
│   ├── services/             # Service modules (from upstream)
│   ├── commands/             # Math commands (from upstream)
│   ├── css/                  # LESS stylesheets (from upstream)
│   └── fonts/                # Symbola fonts (from upstream)
├── scripts/
│   └── prepare-bundle.sh     # Bundle concatenation script
├── dist/                     # Build output (gitignored)
│   ├── index.js              # ESM bundle
│   ├── index.d.ts            # Type declarations
│   ├── mathquill.css         # Compiled CSS
│   └── fonts/                # Font files
├── package.json
├── tsconfig.json
├── vite.config.ts
└── MAINTENANCE.md (this file)
```

## Build Process

The package uses a hybrid approach:

1. **Legacy Bundle**: Source files are concatenated into an IIFE bundle
2. **ESM Wrapper**: `src/index.ts` imports the bundle and exports the API
3. **Vite Build**: Bundles everything into ESM format
4. **TypeScript**: Generates type declarations for the wrapper

### Build Commands

```bash
# Clean build
bun run clean && bun run build

# Development mode (watch)
bun run dev

# Just build
bun run build
```

## Updating from Upstream

When the upstream PIE mathquill fork (`../../../mathquill`) is updated:

### 1. Sync Source Files

Copy updated files from upstream:

```bash
cd packages/shared/mathquill

# Copy JavaScript sources
cp -r ../../../mathquill/src/*.js src/
cp -r ../../../mathquill/src/services src/
cp -r ../../../mathquill/src/commands src/

# Copy CSS
cp -r ../../../mathquill/src/css src/

# Copy fonts
cp -r ../../../mathquill/src/fonts src/

# Copy documentation
cp ../../../mathquill/README.md .
cp ../../../mathquill/CHANGELOG.md .
```

### 2. Regenerate Bundle

Run the bundle preparation script:

```bash
bun run cli upstream:sync-mathquill
```

This concatenates all source files in the correct order into `src/legacy/mathquill-bundle.js`.

### 3. Update Version

Update `package.json` version to match upstream + patch increment:

```json
{
  "version": "1.1.5"  // If upstream is 1.1.3, use 1.1.4, 1.1.5, etc.
}
```

### 4. Build and Test

```bash
# Build the package
bun run build

# Test with consuming packages
cd ../../lib-react/math-input
bun run build

cd ../../elements-react/math-inline
bun run build
```

### 5. Update Changelog

Document changes in `CHANGELOG.md` with the upstream version referenced.

## TypeScript Definitions

The package includes minimal TypeScript definitions in `src/types.ts`. These cover:

- `MathQuillInterface` - Main API
- `MathField` - Editable math field
- `StaticMath` - Read-only math display
- `MathFieldConfig` - Configuration options

To expand type definitions:
1. Add new interfaces to `src/types.ts`
2. Export them in `src/index.ts`
3. Rebuild to generate updated `.d.ts` files

## CSS and Fonts

**CSS**: LESS files in `src/css/` are compiled by Vite to `dist/mathquill.css`

**Fonts**: Symbola font files are copied from `src/fonts/` to `dist/fonts/` by vite-plugin-static-copy

**Import in consuming packages**:
```typescript
import '@pie-framework/mathquill/mathquill.css';
```

## jQuery Dependency

MathQuill has a deep dependency on jQuery (~171 usages). This modernization keeps jQuery as a dependency for pragmatic reasons:

- **Kept**: jQuery as production dependency (^3.7.1)
- **Global**: Made available via `window.jQuery` and `window.$`
- **Bundle**: jQuery is externalized (not bundled with mathquill)

**Future consideration**: Gradually replace jQuery with native DOM APIs, but this is non-trivial.

## Workspace Integration

This package is used by:

- `@pie-lib/math-input` (lib-react)
- `@pie-element/math-inline` (elements-react)
- `@pie-element/math-templated` (elements-react)

All consuming packages reference it as:
```json
{
  "dependencies": {
    "@pie-framework/mathquill": "workspace:*"
  }
}
```

## Sync Scripts Integration

The upstream sync scripts in `tools/cli/src/lib/upstream/` automatically handle mathquill as a workspace package:

**File**: `sync-package-manager.ts`

The `isPieFrameworkWorkspacePackage()` function checks if `@pie-framework/mathquill` exists in `packages/shared/mathquill/package.json` and treats it as a workspace dependency (not external npm).

**No changes needed** to sync scripts when updating mathquill - it's treated as a shared package, not synced from upstream.

## Troubleshooting

### Build Errors

**"Expression expected" in outro.js**:
- Ensure intro.js and outro.js are NOT imported separately in index.ts
- They should only be in the concatenated bundle

**"Cannot find module jquery"**:
```bash
bun install jquery
```

**Font files not copying**:
- Check `vite.config.ts` viteStaticCopy plugin configuration
- Ensure `src/fonts/` exists with all Symbola variants

### Type Errors

**"MathQuillInterface is declared but never used"**:
- Remove unused imports from `src/index.ts`
- Only import types used for exports

**"Subsequent property declarations must have the same type"**:
- Check `src/types.ts` global Window interface
- Ensure getInterface is defined as callable with MIN/MAX properties

### Workspace Resolution

**"Workspace dependency @pie-framework/mathquill not found"**:
- Ensure package.json exists in `packages/shared/mathquill/`
- Run `bun install` from workspace root
- Check that `name` field is `"@pie-framework/mathquill"`

## Publishing

This package is marked `"private": true` in package.json because it's intended for internal workspace use only.

If you need to publish:
1. Remove `"private": true`
2. Ensure all build artifacts are in `dist/`
3. Update version appropriately
4. Run `bun publish`

## Documentation

- **MathQuill API**: See [mathquill.com](http://mathquill.com) or upstream README.md
- **PIE Customizations**: See CHANGELOG.md for PIE-specific features
- **TypeScript Usage**: Import types from `@pie-framework/mathquill`

## Support

For issues with:
- **Upstream features**: Report to PIE mathquill fork: https://github.com/pie-framework/mathquill
- **Build/packaging**: Check this MAINTENANCE.md or tools/cli sync scripts
- **Type definitions**: Update `src/types.ts` and rebuild

---

**Last Updated**: January 2025
**Maintainer**: PIE Framework Team
