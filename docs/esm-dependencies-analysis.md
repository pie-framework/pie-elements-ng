# ESM Dependencies Analysis

## Summary

Analysis of dependencies for potential ESM compatibility issues in the pie-elements-ng project.

## Status: Mostly ESM-Ready ✅

The project is in good shape for ESM loading. The main transformation needed (lodash → lodash-es) has already been implemented.

## Current Dependencies Status

### ✅ Already ESM-Compatible

1. **lodash-es** (^4.17.22)
   - Pure ESM package
   - Automatically transformed during sync from upstream lodash usage
   - See [lodash-es-analysis.md](./lodash-es-analysis.md)

2. **uuid**
   - Project uses native `crypto.randomUUID()` instead of external package
   - Implemented in `packages/shared/utils/src/utils.ts`
   - Zero ESM issues

3. **Core frameworks**
   - Svelte 5: Native ESM
   - Vite: Native ESM bundler
   - Vitest: Native ESM test runner

### ✅ All Issues Resolved

**1. Previously problematic debug package has been removed** from `packages/shared/math-rendering`.

Replaced with a simple inline logger that:
- Only logs in development mode (`import.meta.env.DEV`)
- Uses native console methods (no external dependencies)
- Maintains the same debug output format
- Zero ESM compatibility concerns

**2. External @pie-framework/mathml-to-latex dependency has been internalized** as `@pie-elements-ng/shared-mathml-to-latex`.

This ensures:
- Full control over ESM configuration
- Proper TypeScript types for xmldom compatibility
- Latest dependencies (`@xmldom/xmldom@^0.9.8`)
- No reliance on external package ESM compatibility
- Consistent with our monorepo architecture

**3. External @pie-framework event packages have been internalized**:

- `@pie-framework/pie-player-events` → `@pie-elements-ng/shared-player-events`
- `@pie-framework/pie-configure-events` → `@pie-elements-ng/shared-configure-events`

This ensures:
- Full control over ESM configuration
- Modernized from TypeScript 2.7.2 (2018) to TypeScript 5.9.3
- Proper strict mode TypeScript with no legacy type assertions
- No reliance on external package maintenance
- Automatic transformation during upstream sync
- Consistent with our monorepo architecture

### ✅ No Issues Found

Checked for these commonly-problematic packages - **NONE found**:
- ❌ moment.js (should use date-fns or native Temporal)
- ❌ classnames (should use clsx or native)
- ❌ react-dom/server (doesn't apply - Svelte project)
- ❌ CommonJS-only uuid package (using native crypto API)

## Dependencies Tracked by `deps` Command

The following dependencies are actively tracked for version sync with upstream:

```typescript
// From tools/cli/src/commands/upstream/deps.ts
const TRACKED_DEPS = [
  // Math rendering
  'katex',              // ✅ ESM-ready
  'mathjax-full',       // ✅ ESM-ready
  'mathlive',           // ✅ ESM-ready

  // Sanitization
  'dompurify',          // ✅ ESM-ready

  // Rich text
  '@tiptap/core',                      // ✅ ESM-ready
  '@tiptap/pm',                        // ✅ ESM-ready
  '@tiptap/starter-kit',               // ✅ ESM-ready
  '@tiptap/extension-mathematics',     // ✅ ESM-ready
  '@tiptap/extension-image',           // ✅ ESM-ready
  '@tiptap/extension-link',            // ✅ ESM-ready
  '@tiptap/extension-table',           // ✅ ESM-ready
  '@tiptap/extension-task-list',       // ✅ ESM-ready

  // PIE framework (now internalized)
  '@pie-framework/pie-player-events',   // ✅ Internalized as @pie-elements-ng/shared-player-events
  '@pie-framework/pie-configure-events',// ✅ Internalized as @pie-elements-ng/shared-configure-events

  // Utilities
  'lodash-es',          // ✅ ESM-ready (auto-transformed)
  'uuid',               // ✅ Not used (native crypto.randomUUID)
];
```

**Note on PIE Framework packages:** These have been internalized into the monorepo as `@pie-elements-ng/shared-player-events` and `@pie-elements-ng/shared-configure-events` with full ESM support and modern TypeScript. The sync CLI automatically transforms imports during upstream sync.

## Recommendations

### Immediate Actions: None Required ✅

The project is fully ESM-ready:
- ✅ lodash-es transformation implemented (automatic during sync)
- ✅ debug package removed from math-rendering
- ✅ mathml-to-latex internalized with full ESM support
- ✅ PIE Framework event packages internalized with full ESM support
- ✅ All core dependencies are ESM-compatible
- ✅ Sync CLI automatically transforms external package imports to internal packages

### Adding New Dependencies

When adding new dependencies, prefer packages that are:
- Pure ESM (package.json has `"type": "module"`)
- Have dual builds with proper conditional exports
- Native browser APIs over npm packages when possible

**Check ESM compatibility before adding:**
- npm package page should mention ESM support
- Look for `"type": "module"` in package.json
- Check if it has "exports" field with ESM entry points

## Tools

Run dependency version check:
```bash
bun run upstream:deps
```

This compares tracked dependencies between pie-elements, pie-lib, and pie-elements-ng.
