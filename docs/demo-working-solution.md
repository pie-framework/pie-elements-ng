# Demo System Working Solution

**Date**: 2026-01-30 (Updated)
**Status**: ✅ WORKING (RESTORED)

## Summary

Successfully got the element demo system working by combining two approaches:

1. **Workspace Resolver Plugin** (restored from commit 20c9291) - resolves workspace packages to source files
2. **Absolute Path Imports in element-imports.ts** - bypasses package.json exports for element loading

**IMPORTANT**: This solution requires `element-imports.ts` with absolute `/@fs/` paths. An attempt was made to remove this file and use bare specifiers directly, but it failed because **dynamic imports with variable paths don't benefit from Vite's alias resolution**. This is a fundamental Vite limitation.

## Key Files

### 1. vite.config.ts

```typescript
import { findWorkspaceRoot, workspaceResolver } from './src/vite-plugin-workspace-resolver';

export default defineConfig({
  plugins: [
    workspaceResolver({
      resolveSources: true, // Use source files for proper resolution
      debug: false,
    }),
    tailwindcss({ optimize: false }),
    sveltekit(),
  ],
  // ... rest of config
});
```

**Critical**: The `workspaceResolver` plugin with `resolveSources: true` enables Vite to resolve workspace packages like `@pie-element/shared-math-rendering-katex` to their source files.

### 2. vite-plugin-workspace-resolver.ts

This plugin (restored from commit 20c9291) creates Vite aliases for all workspace packages, mapping them to their source files. Located at:
```
apps/element-demo/src/vite-plugin-workspace-resolver.ts
```

### 3. element-imports.ts

```typescript
// Register element: multiple-choice
// IMPORTANT: Use absolute paths to bypass package.json exports and ensure we load dist files
registerElement('multiple-choice', () => import('/@fs/.../packages/elements-react/multiple-choice/dist/index.js'));
registerController('multiple-choice', () => import('/@fs/.../packages/elements-react/multiple-choice/dist/controller/index.js'));
```

**Critical**: Using `/@fs/` absolute paths bypasses package.json export conditions, ensuring we load the BUILT dist files for the element itself, not source files.

## Why This Works

### The Problem
1. Element imports like `import('@pie-element/multiple-choice')` were resolving to SOURCE files via the 'development' export condition
2. Source files have imports like `import { renderMath } from '@pie-element/shared-math-rendering-katex'`
3. Vite couldn't resolve these workspace package imports

### The Solution
1. **For the element itself**: Use absolute `/@fs/` paths in `element-imports.ts` to load DIST files, which are fully built and have all their internal dependencies bundled
2. **For external workspace dependencies**: Use the workspace resolver plugin to create aliases that map workspace packages to their source files
3. This means the element's external dependencies (like math-rendering-katex) resolve correctly via the plugin

### Why Can't We Remove element-imports.ts?

The user asked if we still need `element-imports.ts` since we have the workspace resolver plugin. The answer is **YES, we need it**.

**Attempted simplification (FAILED):**
- Tried to remove `element-imports.ts` and use bare specifiers like `@pie-element/multiple-choice` directly in `demo-element-loader.ts`
- The workspace resolver creates aliases correctly (verified with debug logs showing 175 aliases)
- However, **dynamic imports with variable paths** don't benefit from Vite's alias resolution
- Example: `await import(modulePath)` where `modulePath` is a variable containing `'@pie-element/multiple-choice'` fails
- Vite can only resolve aliases for static imports or imports with literal strings

**Why element-imports.ts works:**
- Uses arrow functions with import statements containing literal strings: `() => import('/@fs/absolute/path/to/file.js')`
- The import path is a literal string (not a variable), so Vite can resolve it
- The `/@fs/` prefix tells Vite to load the file directly from the filesystem
- The arrow function wrapper allows lazy loading when the element is actually needed

This is a fundamental limitation of how Vite's import analysis works, not something we can work around.

## Critical Insight

The key difference from previous attempts:

- **Previous attempts**: Tried to use either all source files (causes loops with resolve.conditions) or all dist files (Vite can't resolve workspace imports)
- **This solution**: Hybrid approach - element from dist, dependencies resolved to source via plugin

## How It Works Step-by-Step

1. Browser requests the multiple-choice element
2. `element-imports.ts` loads it from `/@fs/.../dist/index.js` (built dist file)
3. The dist file contains: `import { renderMath } from "@pie-element/shared-math-rendering-katex"`
4. The workspace resolver plugin intercepts this import
5. Plugin maps `@pie-element/shared-math-rendering-katex` to its source file at `packages/shared/math-rendering-katex/src/index.ts`
6. Vite loads the source file, which in turn imports other workspace packages
7. All workspace package imports are resolved by the plugin

## Files Modified

1. `apps/element-demo/vite.config.ts` - Added workspace resolver plugin
2. `apps/element-demo/src/vite-plugin-workspace-resolver.ts` - Restored from commit 20c9291
3. `apps/element-demo/src/lib/element-imports.ts` - Using absolute `/@fs/` paths for elements
4. `apps/element-demo/src/lib/element-player/lib/demo-element-loader.ts` - Uses static imports registry

## Avoiding Infinite HMR Loops

**Important**: Despite using `resolveSources: true`, this doesn't cause infinite HMR loops because:
1. We're NOT using `resolve.conditions: ['development']` in vite.config
2. The workspace resolver plugin creates explicit aliases, not condition-based resolution
3. Only the workspace dependencies (shared packages) use source files
4. The element itself loads from dist, which is stable

## Testing

All 4 views are confirmed working:

```bash
cd apps/element-demo
PORT=5600 bun run dev
```

Then visit:
- **Delivery**: http://localhost:5600/player/deliver?element=multiple-choice - Interactive question
- **Author**: http://localhost:5600/player/author?element=multiple-choice - Full configure UI
- **Print**: http://localhost:5600/player/print?element=multiple-choice - Print-friendly view
- **Source**: http://localhost:5600/player/source?element=multiple-choice - JSON editor

## Auto-Generation of element-imports.ts

**IMPORTANT**: The `element-imports.ts` file contains absolute paths specific to each developer's machine. To handle this:

1. **The file is auto-generated**: Run `bun run generate-imports` in the `apps/element-demo` directory
2. **It runs automatically**: The `predev` script runs before `npm run dev` starts the server
3. **It's gitignored**: The file is in `.gitignore` so absolute paths don't get committed
4. **It reads the registry**: The generator script reads `src/lib/elements/registry.ts` to know which elements exist
5. **It checks for built files**: Only includes elements that have built dist files

### Manual Generation

If you need to regenerate the imports manually:

```bash
cd apps/element-demo
bun run generate-imports
```

### Adding New Elements

To add a new element to the demo:

1. Build the element: `cd packages/elements-react/your-element && bun run build`
2. The element will automatically be picked up by the generator on next `npm run dev`
3. Or manually run `bun run generate-imports` to regenerate immediately

## References

- Working commit with workspace resolver: 20c929178d53cd463df138ecccf34affab608e4e
- Demo system redesign doc: docs/demo-system-redesign.md
- Auto-generation script: apps/element-demo/scripts/generate-element-imports.ts
