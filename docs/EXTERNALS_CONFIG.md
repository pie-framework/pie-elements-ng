# Vite/Rollup Externals Configuration

This document explains the shared externals configuration used across all package builds in this monorepo.

## What Are Externals?

Externals are dependencies that should **NOT** be bundled into library outputs. Instead, they are resolved at runtime from the consuming application.

This is **standard practice** for library builds, not a hack or workaround.

## Why Externals Are Needed

### 1. Framework Peer Dependencies

**React, MUI, Emotion** MUST be external to avoid duplicate instances:

```typescript
// ❌ BAD: Bundling React creates duplicate instances
// Library bundles React v18.2.0
// Application uses React v18.3.0
// Result: Two React instances = broken hooks, context, state

// ✅ GOOD: React is external
// Library declares: "I need React"
// Application provides: React v18.3.0
// Result: Single React instance = everything works
```

### 2. Internal Monorepo Packages

**@pie-lib/\*, @pie-element/\*, @pie-elements-ng/\*** are external for separate resolution:

- Each package is built independently
- Changes to one package don't require rebuilding all consumers
- Import maps resolve packages at runtime
- Enables faster development iteration

### 3. Utility Libraries

**prop-types, classnames, debug, i18next, humps, mathjs, react-jss, js-combinatorics** are external to reduce duplication:

- These are common dependencies used by many packages
- Bundling them into each package would duplicate the code 10-15 times
- External resolution means one copy shared across all packages

### 4. Specialized UI Libraries

**@dnd-kit/core, react-transition-group, styled-components** are external to avoid version conflicts:

- Multiple packages use these libraries
- Version conflicts cause runtime errors
- External resolution ensures single version at runtime

### 5. Lodash Variants

**lodash/lodash-es** are external for runtime resolution:

- Elements use `lodash` (CommonJS)
- PIE-lib uses `lodash-es` (ESM)
- Import maps provide the correct version at runtime

### 6. D3 Modules

**d3-\*** are external as they're commonly shared:

- Multiple visualization packages use D3
- D3 modules are modular and tree-shakeable
- External resolution reduces bundle size

### 7. Konva Visualization Library

**konva, react-konva** are external for hotspot and drawing-response elements:

- Canvas-based graphics library for interactive visualizations
- Used by hotspot and drawing-response elements
- External resolution avoids bundling large graphics library

### 8. Material Design Icons

**@mdi/react, @mdi/js** are external for icon support:

- Used by drawing-response element for tool icons
- Large icon libraries benefit from external resolution
- Reduces bundle size for elements that don't need all icons

### 9. Testing Libraries

**@testing-library/\*** are external for test utilities:

- Used by @pie-lib/test-utils for component testing helpers
- Testing libraries should not be bundled into production code
- External resolution ensures proper test environment setup

## Shared Configuration

All externals are defined in `tools/cli/src/commands/upstream/sync-externals.ts`:

```typescript
export function isExternal(id: string, variant: 'element' | 'pielib'): boolean {
  // React and React DOM - always external (peer dependencies)
  if (/^react($|\/)/.test(id)) return true;
  if (/^react-dom($|\/)/.test(id)) return true;

  // Internal monorepo packages - always external
  if (/^@pie-lib\//.test(id)) return true;
  if (/^@pie-element\//.test(id)) return true;
  if (/^@pie-elements-ng\//.test(id)) return true;
  if (/^@pie-framework\//.test(id)) return true;

  // UI framework packages - always external (peer dependencies)
  if (/^@mui\//.test(id)) return true;
  if (/^@emotion\//.test(id)) return true;

  // D3 visualization modules - always external
  if (/^d3-/.test(id)) return true;

  // Lodash - variant-specific
  if (variant === 'element') {
    if (id === 'lodash') return true;
    if (/^lodash\//.test(id)) return true;
  } else {
    if (id === 'lodash-es') return true;
    if (/^lodash-es\//.test(id)) return true;
  }

  // Styled-components - external to avoid multiple instances
  if (/^styled-components/.test(id)) return true;

  // Common utility and UI libraries - always external
  const commonExternals = [
    'prop-types',
    'classnames',
    'debug',
    'i18next',
    'humps',
    '@dnd-kit/core',
    'react-transition-group',
  ];

  return commonExternals.includes(id);
}
```

## Variants

### Element Variant

Used by: `packages/elements-react/*`

- Uses `lodash` (CommonJS)
- External check: `createExternalFunction('element')`

### PIE-Lib Variant

Used by: `packages/lib-react/*` and `packages/controllers/*`

- Uses `lodash-es` (ESM)
- External check: `createExternalFunction('pielib')`

### Konva Variant

Used by: `packages/elements-react/drawing-response/*`

- Special case: bundles konva, react-konva, scheduler, react-reconciler
- All other dependencies remain external
- External check: `createKonvaExternalFunction()`

## Where Externals Are Used

The shared configuration is automatically applied when generating Vite configs:

1. **PIE-Lib Packages** - `sync-vite-config.ts`
2. **React Elements** - `sync-react-strategy.ts`
3. **Controllers** - `sync-controllers-strategy.ts`

Example from generated vite.config.ts:

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: { index: resolve(__dirname, 'src/index.ts') },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => {
        return (
          /^react($|\/)/.test(id) ||
          /^react-dom($|\/)/.test(id) ||
          /^@pie-lib\//.test(id) ||
          /^@pie-element\//.test(id) ||
          /^@pie-elements-ng\//.test(id) ||
          /^@pie-framework\//.test(id) ||
          /^@mui\//.test(id) ||
          /^@emotion\//.test(id) ||
          /^d3-/.test(id) ||
          id === 'lodash-es' ||
          /^lodash-es\//.test(id) ||
          /^styled-components/.test(id) ||
          ['prop-types', 'classnames', 'debug', 'i18next', 'humps', '@dnd-kit/core', 'react-transition-group'].includes(id)
        );
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
```

## Benefits

### ✅ Single Source of Truth

- All packages use the same external configuration
- Changes to externals are applied consistently
- No duplication across 50+ vite.config.ts files

### ✅ Correct Library Build Practice

- Framework peer dependencies avoid duplicate instances
- Internal packages resolve independently
- Utility libraries shared across packages

### ✅ Runtime Efficiency

- Import maps resolve externals at runtime
- Single copy of each dependency
- Smaller bundle sizes

### ✅ Development Efficiency

- Changes to external libraries don't require rebuilding all packages
- Faster development iteration
- Easier dependency management

## Common Questions

### Q: Why not just bundle everything?

**A:** Bundling framework libraries like React causes duplicate instance errors. Bundling utility libraries duplicates code across packages.

### Q: Are externals a hack?

**A:** No, externals are standard practice for library builds. Every major React component library (MUI, Chakra, etc.) uses externals.

### Q: What if an external isn't available at runtime?

**A:** Import maps in demo HTML files provide all externals. Production applications using these packages must also provide the peer dependencies.

### Q: Why variant-specific lodash handling?

**A:** Elements were synced from upstream using `lodash`, while PIE-lib uses `lodash-es` for better ESM tree-shaking. Eventually elements should migrate to `lodash-es`.

### Q: Can I add a new external?

**A:** Yes, edit `sync-externals.ts` and rebuild the CLI:

```bash
cd tools/cli
bun run build
bun cli upstream:update  # Regenerate all vite configs
```

## Related Documentation

- [SYNC_TRANSFORMS.md](SYNC_TRANSFORMS.md) - Import transformation pipeline
- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall codebase architecture

---

**Last Updated**: January 21, 2026
