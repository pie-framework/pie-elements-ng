# MathQuill Package Maintenance Guide

This package is a legacy compatibility wrapper around MathQuill with PIE-specific extensions.

## Overview

- **Runtime Dependency**: `mathquill@0.10.1` (npm package)
- **Package Location**: `packages/shared/mathquill`
- **Package Name**: `@pie-element/shared-mathquill`
- **Version**: 1.1.4 (ESM modernized)
- **Module Format**: ESM with TypeScript declarations
- **Build System**: Vite + TypeScript

## Current Ownership Model

This package is currently treated as **locally owned** in `pie-elements-ng`:

- Upstream sync for `packages/shared/mathquill` is intentionally blocked by default.
- `pie upstream:sync-mathquill` requires an explicit `--force` override.
- We optimize for local stability and reproducibility before considering upstream pulls.

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

1. **Legacy Runtime**: `mathquill/build/mathquill.js` (UMD/global runtime)
2. **ESM Wrapper**: `src/index.ts` and `src/extensions/index.ts` expose a stable API
3. **Global Setup**: jQuery is set on `window` before MathQuill initialization
4. **Runtime Backports**: `src/extensions/pie/fork-backports.ts` patches selected unpublished fork fixes
5. **Vite Build**: Bundles wrapper/extensions into ESM output
6. **TypeScript**: Generates type declarations for wrapper APIs

### Runtime Backports (Local)

The current runtime baseline is `mathquill@0.10.1`, but we also apply local patches for
behavior that exists in `pie-framework/mathquill` commits that were never published from
upstream MathQuill:

- Reflow trigger when editing text blocks (`TextBlock.write`)
- LaTeX sanitization for repeated backslashes before parse (`renderLatexMath`)
- Defensive horizontal scroll guard (`scrollHoriz`)

When upgrading the runtime baseline, verify these behaviors still exist (natively or via patch)
before removing `fork-backports.ts`.

### Build Commands

```bash
# Clean build
bun run clean && bun run build

# Development mode (watch)
bun run dev

# Just build
bun run build
```

## Updating Dependency Baseline

When updating the MathQuill runtime dependency:

### 1. Update dependency and lockfile

Edit `package.json` dependency and run `bun install` from repo root.

### 2. Validate wrapper compatibility

Confirm extension hooks and global setup still work:

- `src/extensions/index.ts`
- `src/index.ts`
- `src/mathquill.d.ts` / `src/types.ts`

### 3. Build and test

```bash
# Build the package
bun run build

# Test with consuming packages
cd ../../lib-react/math-input
bun run build

cd ../../elements-react/math-inline
bun run build
```

### 4. Update changelog/notes

Document dependency and behavior changes in `CHANGELOG.md` and migration metadata.

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
import '@pie-element/shared-mathquill/mathquill.css';
```

## jQuery Dependency

MathQuill has a deep dependency on jQuery. This wrapper keeps jQuery as a runtime dependency for pragmatic compatibility:

- **Kept**: jQuery as production dependency
- **Global**: Made available via `window.jQuery` and `window.$`
- **Order-sensitive**: jQuery must be initialized before MathQuill UMD evaluates

**Future consideration**: Gradually replace jQuery with native DOM APIs, but this is non-trivial.

## Workspace Integration

This package is used by legacy/non-migrated paths:

- `@pie-element/math-inline` (elements-react)
- selected authoring/configure surfaces that still rely on MathQuill internals

The modern delivery/input path now uses `@pie-element/shared-math-engine`.

All consuming packages reference it as:
```json
{
  "dependencies": {
    "@pie-element/shared-mathquill": "workspace:*"
  }
}
```

## Sync Scripts Integration

The upstream sync tooling treats this as a shared workspace package, and MathQuill upstream sync is
blocked by default for local ownership.

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

**"Workspace dependency @pie-element/shared-mathquill not found"**:
- Ensure package.json exists in `packages/shared/mathquill/`
- Run `bun install` from workspace root
- Check that `name` field is `"@pie-element/shared-mathquill"`

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
- **TypeScript Usage**: Import types from `@pie-element/shared-mathquill`

## Support

For issues with:
- **Dependency/runtime behavior**: check `package.json` + `src/extensions/index.ts` initialization
- **Build/packaging**: check this MAINTENANCE.md and local sync guard configuration
- **Type definitions**: update `src/types.ts` and rebuild

---

**Last Updated**: January 2025
**Maintainer**: PIE Framework Team
