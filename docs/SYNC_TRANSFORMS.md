# Sync Transform Pipeline

This document explains how code transforms work in the sync pipeline when importing code from upstream repositories.

## Overview

When syncing code from upstream `pie-lib` repository, several automatic transforms ensure the code is compatible with this codebase. These transforms preserve improvements made locally even when syncing updates from upstream.

## Active Transforms

### 1. Lodash to Lodash-ES
**File**: `tools/cli/src/commands/upstream/sync-imports.ts`
**Function**: `transformLodashToLodashEs()`

Converts all lodash imports to lodash-es for ESM compatibility:

```javascript
// Before (upstream)
import isEmpty from 'lodash/isEmpty';
import { isEqual } from 'lodash';

// After (synced)
import { isEmpty } from 'lodash-es';
import { isEqual } from 'lodash-es';
```

### 2. PIE Framework Event Packages
**File**: `tools/cli/src/commands/upstream/sync-imports.ts`
**Function**: `transformPieFrameworkEventImports()`

Replaces external event packages with internal workspace packages:

```javascript
// Before (upstream)
import { PiePlayerEvent } from '@pie-framework/pie-player-events';

// After (synced)
import { PiePlayerEvent } from '@pie-element/shared-player-events';
```

### 3. Editable-HTML Constants Inlining

**File**: `tools/cli/src/commands/upstream/sync-imports.ts`
**Function**: `inlineEditableHtmlConstants()`

**Why needed**: The `editable-html` package depends on Slate v0.x which is not ESM-compatible. Some packages only need constants from it, so we inline them to avoid the dependency.

```javascript
// Before (upstream)
import Constants from '../../../editable-html/src/constants';

// After (synced)
// Inlined from editable-html/src/constants (not ESM-compatible)
const Constants = {
  MAIN_CONTAINER_CLASS: 'main-container',
  PIE_TOOLBAR__CLASS: 'pie-toolbar',
};
```

### 4. TokenTypes Re-export

**File**: `tools/cli/src/commands/upstream/sync-imports.ts`
**Function**: `reexportTokenTypes()`

**Why needed**: Upstream code works in CommonJS/Webpack (looser module resolution) but ESM requires explicit re-exports for proper module graph.

**Applied to**: `text-select/token-select/index.tsx`

```javascript
// Before (upstream)
import Token, { TokenTypes } from './token';
// ... component code ...
export default TokenSelect;

// After (synced)
import Token, { TokenTypes } from './token';
// ... component code ...
export default TokenSelect;
export { TokenTypes };  // ← Added explicit re-export
```

### 5. Configure Defaults Inlining

**File**: `tools/cli/src/commands/upstream/sync-imports.ts`
**Function**: `inlineConfigureDefaults()`

**Why needed**: The `configure` package depends on Slate v0.x which is not ESM-compatible. Student-facing UI only needs minimal fallback configuration, not the full authoring configuration.

```javascript
// Before (upstream)
import defaults from '../configure/lib/defaults';

// After (synced)
// Inlined from configure/lib/defaults (configure/ not synced - ESM-incompatible)
const defaults = {
  configuration: {
    // Minimal configuration for student-facing UI
    // Full authoring configuration is only needed in the configure package
  } as any
};
```

### 6. SSR-Unsafe require() to React.lazy() + Suspense

**File**: `tools/cli/src/commands/upstream/sync-imports.ts`
**Function**: `transformSsrRequireToReactLazy()`

**Why needed**: Upstream `pie-lib` code uses `require()` inside SSR checks for MathQuill compatibility. This pattern fails in browser ESM environments where `require` is not defined. We transform to React.lazy() with dynamic imports and automatically wrap usage in React.Suspense.

**Applied to**: `config-ui/feedback-selector.jsx`, `config-ui/choice-configuration/index.jsx`, `mask-markup/constructed-response.jsx`

**Transform 1: Convert require() to React.lazy()**

```javascript
// Before (upstream)
// - mathquill error window not defined
let EditableHtml;
let StyledEditableHTML;
if (typeof window !== 'undefined') {
  EditableHtml = require('@pie-lib/editable-html-tip-tap')['default'];
  StyledEditableHTML = styled(EditableHtml)(({ theme }) => ({
    fontFamily: theme.typography.fontFamily,
  }));
}

// After (synced)
// Lazy load EditableHtml to avoid SSR issues with mathquill
const EditableHtmlLazy = React.lazy(() =>
  import('@pie-lib/editable-html-tip-tap').then(module => ({ default: module.default }))
);

const StyledEditableHTML = styled(EditableHtmlLazy)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
}));
```

**Transform 2: Automatically wrap usage in React.Suspense**

```tsx
// Before (after Transform 1)
<StyledEditableHTML {...props} />

// After (Transform 2 - fully automatic)
<React.Suspense fallback={<div>Loading editor...</div>}>
  <StyledEditableHTML {...props} />
</React.Suspense>
```

**Benefits**:
- ✅ Fully automatic - no manual Suspense wrapping needed
- ✅ Handles both self-closing and paired JSX tags
- ✅ Skips components already wrapped in Suspense
- ✅ Works for both styled and unstyled components

### 7. Property Assignment to assignProps (Available, Not Enabled)

**File**: `tools/cli/src/commands/upstream/sync-imports.ts`
**Function**: `transformToAssignProps()`
**Status**: ⚠️ **Available but NOT currently enabled**

This transform is implemented but not enabled in the sync pipeline.

**Why not enabled**: We prefer manual refactoring for one-off cases rather than automatically transforming code that might not need it. Only enable if this pattern appears frequently.

**To enable**: Uncomment the line in `sync-pielib-strategy.ts` that calls `transformToAssignProps()`.

**What it would do** (if enabled):

```javascript
// Before (upstream)
Object.entries(props).forEach(([key, value]) => {
  element[key] = value;
});

// After (if enabled)
import { assignProps } from '@pie-element/shared-utils';
assignProps(element, props);
```

## How Transforms Are Applied

### Transform Order

Transforms are applied in different strategies based on the source:

#### PIE-Lib Packages (sync-pielib-strategy.ts)

```typescript
// Read source file
let sourceContent = await readFile(srcPath, 'utf-8');

// Apply transforms in order
sourceContent = transformLodashToLodashEs(sourceContent);
sourceContent = transformPieFrameworkEventImports(sourceContent);
sourceContent = inlineEditableHtmlConstants(sourceContent);
sourceContent = reexportTokenTypes(sourceContent, filePath);
sourceContent = transformSsrRequireToReactLazy(sourceContent);  // ← Convert require() to React.lazy()
// sourceContent = transformToAssignProps(sourceContent);  // ← Available but not enabled

// Convert to TypeScript and write
```

#### React Elements (sync-react-strategy.ts)

```typescript
// Read source file
let sourceContent = await readFile(srcPath, 'utf-8');

// Apply transforms in order
sourceContent = transformLodashToLodashEs(sourceContent);
sourceContent = transformPieFrameworkEventImports(sourceContent);
sourceContent = inlineConfigureDefaults(sourceContent);

// Convert to TypeScript and write
```

#### Controllers (sync-controllers-strategy.ts)

```typescript
// Read source file
let sourceContent = await readFile(srcPath, 'utf-8');

// Apply transforms
sourceContent = transformLodashToLodashEs(sourceContent);
sourceContent = transformPieFrameworkEventImports(sourceContent);

// Convert to TypeScript and write
```

### When Transforms Run

Transforms run automatically when:

- Running `bun cli upstream:update` (syncs all elements, controllers, and pie-lib packages)
- Running `bun cli upstream:sync` (syncs only pie-lib packages)
- Any file is synced from upstream repositories
- JavaScript files (`.js`, `.jsx`) are converted to TypeScript (`.ts`, `.tsx`)

## Adding New Transforms

To add a new transform:

1. **Create the transform function** in `tools/cli/src/commands/upstream/sync-imports.ts`:
   ```typescript
   export function transformMyPattern(content: string): string {
     let transformed = content;
     // ... perform transformations
     return transformed;
   }
   ```

2. **Import and use** in `tools/cli/src/commands/upstream/sync-pielib-strategy.ts`:
   ```typescript
   import { transformMyPattern } from './sync-imports.js';

   // In syncDirectory method:
   sourceContent = transformMyPattern(sourceContent);
   ```

3. **Rebuild CLI**:
   ```bash
   cd tools/cli
   bun run build
   ```

4. **Test the transform** on next sync

## Benefits

- ✅ **Consistency**: All synced code follows local conventions
- ✅ **Maintainability**: Manual improvements persist across syncs
- ✅ **Type Safety**: Upstream JS automatically uses typed utilities
- ✅ **Bug Prevention**: Transforms apply best practices (e.g., `skipUndefined`)
- ✅ **Automation**: No manual refactoring needed after sync

## Sync Commands

```bash
# Sync everything: elements, controllers, and pie-lib packages
bun cli upstream:update

# Sync only pie-lib packages
bun cli upstream:sync

# Sync with verbose output
bun cli upstream:update --verbose

# Dry run (see what would change without modifying files)
bun cli upstream:update --dry-run
```

## Files Affected by Transforms

Transforms only affect files synced from upstream:

- `packages/lib-react/*/src/**/*.tsx` (synced from pie-lib)
- `packages/elements-react/*/src/**/*.tsx` (synced from pie-elements)
- `packages/controllers/*/src/**/*.ts` (synced from pie-elements controllers)
- Auto-generated files marked with `@synced-from` comment

Files NOT affected:

- Manually created files in this repository
- Files in `packages/elements-svelte/`
- Files in `packages/shared/`
- Configuration files

## Troubleshooting

### Transform Not Applied

1. Check the file has `@synced-from pie-lib` comment
2. Verify the pattern matches exactly
3. Test the regex pattern manually
4. Check CLI was rebuilt after changes

### Import Not Added

The `assignProps` transform checks if the import already exists:
```typescript
if (!transformed.includes("from '@pie-element/shared-utils'"))
```

If you see duplicate imports, the check needs refinement.

### Pattern Not Matching

Test your regex pattern:
```javascript
const pattern = /your-pattern-here/g;
const testCode = `...`;
console.log(testCode.match(pattern));
```

## Related Documentation

- [ASSIGN_PROPS_IMPLEMENTATION.md](../ASSIGN_PROPS_IMPLEMENTATION.md) - Full assignProps implementation details
- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall codebase architecture
- [web-components-strategy.md](web-components-strategy.md) - Web components approach

---

**Last Updated**: January 27, 2026
