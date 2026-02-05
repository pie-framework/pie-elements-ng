# Automatic Menu → InlineMenu Transformation

This document describes the automatic transformation system that replaces MUI's `Menu` component with `InlineMenu` during the upstream sync process.

## Problem

MUI's `Menu` component, when used in inline contexts (like dropdowns within text), creates a modal overlay that covers the entire screen with a white background. This blocks the rest of the UI and creates a poor user experience.

## Solution

We've implemented an **automatic transformation** in the upstream sync pipeline that:

1. **Detects** imports of `Menu` from `@mui/material/Menu`
2. **Replaces** them with `InlineMenu` from `@pie-lib/render-ui`
3. **Preserves** all existing code patterns (styled components, props, etc.)

This means **no manual changes needed** to synced files - the transformation happens automatically during sync.

## How It Works

### Transform Function

Location: `tools/cli/src/lib/upstream/sync-imports.ts`

```typescript
export function transformMenuToInlineMenu(content: string): string
```

This function handles two import patterns:

**Pattern 1: Default import**
```typescript
// Before
import Menu from '@mui/material/Menu';

// After
import { InlineMenu as Menu } from '@pie-lib/render-ui';
```

**Pattern 2: Default + Named imports**
```typescript
// Before
import Menu, { MenuProps } from '@mui/material/Menu';

// After
import { InlineMenu as Menu } from '@pie-lib/render-ui';
import type { MenuProps } from '@mui/material/Menu';
```

### Integration in Sync Pipeline

Location: `tools/cli/src/lib/upstream/sync-transforms.ts`

The transform is applied as part of the standard source transformation pipeline (step 6):

```typescript
export function applySourceTransforms(content: string, options: TransformOptions = {}): string {
  let transformed = content;

  // Core transforms (always applied)
  transformed = transformLodashToLodashEs(transformed);
  transformed = transformPieFrameworkEventImports(transformed);
  transformed = transformControllerUtilsImports(transformed);
  transformed = transformSharedPackageImports(transformed);
  transformed = transformMathquillImports(transformed);
  transformed = transformMenuToInlineMenu(transformed);  // ← Menu transform

  // ... rest of transforms

  return transformed;
}
```

## What Gets Transformed

All files synced from upstream (pie-lib and pie-elements) that import `Menu` from `@mui/material/Menu` will automatically have their imports rewritten.

### Currently Affected Files

After sync, these files will automatically use `InlineMenu`:

1. **`packages/lib-react/mask-markup/src/components/dropdown.tsx`**
   - ✅ Inline dropdown within text

2. **`packages/lib-react/rubric/src/point-menu.tsx`**
   - Context menu for rubric points

3. **`packages/lib-react/config-ui/src/choice-configuration/feedback-menu.tsx`**
   - Feedback options menu

4. **`packages/elements-react/multi-trait-rubric/src/author/traitsHeader.tsx`**
   - Traits header menu

5. **`packages/elements-react/multi-trait-rubric/src/author/trait.tsx`**
   - Individual trait menu

6. **`packages/elements-react/matrix/src/author/MatrixLabelEditableButton.tsx`**
   - Matrix label menu

## Testing the Transform

The transform has been tested with:

1. **Simple default imports** - ✓ Pass
2. **Default + named imports** - ✓ Pass
3. **Usage with styled components** - ✓ Pass

## Running a Sync

To apply the transform to all synced files:

```bash
# Sync a specific package
bun run cli upstream:sync @pie-lib/mask-markup

# Or sync all packages
bun run cli upstream:update
```

The transform will automatically be applied to any file that imports `Menu` from `@mui/material/Menu`.

## InlineMenu Component

Location: `packages/lib-react/render-ui/src/inline-menu.tsx`

The `InlineMenu` component is a wrapper around MUI's `Menu` that:
- Removes the backdrop (`hideBackdrop`)
- Makes the modal root transparent and non-interactive
- Prevents scroll locking (`disableScrollLock`)
- Keeps the menu itself interactive

See [INLINE-MENU.md](../packages/lib-react/render-ui/INLINE-MENU.md) for detailed usage documentation.

## Benefits

### 1. **Zero Manual Changes**
   - No need to manually update imports in synced files
   - Changes persist across upstream syncs

### 2. **Consistent Behavior**
   - All Menu components get the fix automatically
   - No risk of forgetting to apply the fix

### 3. **Easy Maintenance**
   - Single source of truth for the transformation logic
   - Can be updated/disabled centrally if needed

## Verification

After running a sync, verify the transformation by checking a file:

```bash
# Check the dropdown component
cat packages/lib-react/mask-markup/src/components/dropdown.tsx | grep "InlineMenu"
```

Expected output:
```typescript
import { InlineMenu as Menu } from '@pie-lib/render-ui';
```

## Disabling the Transform

If you need to disable the transform for any reason:

1. Open `tools/cli/src/lib/upstream/sync-transforms.ts`
2. Comment out the transform line:
   ```typescript
   // transformed = transformMenuToInlineMenu(transformed);
   ```
3. Rebuild the CLI: `cd tools/cli && bun run build`

## Implementation Details

### Why "as Menu"?

The transform uses `import { InlineMenu as Menu }` instead of replacing all `Menu` references with `InlineMenu` because:

1. **Minimal Changes**: Keeps all existing code (styled components, JSX) unchanged
2. **Type Compatibility**: `InlineMenu` has the same type signature as `Menu`
3. **Readability**: Code still reads naturally as "Menu"

### Why Split Named Imports?

When encountering:
```typescript
import Menu, { MenuProps } from '@mui/material/Menu';
```

We split it into two imports:
```typescript
import { InlineMenu as Menu } from '@pie-lib/render-ui';
import type { MenuProps } from '@mui/material/Menu';
```

This is because:
1. `InlineMenu` comes from a different package
2. Type imports should use `type` keyword for clarity
3. TypeScript can still import types from the original package

## Future Enhancements

Possible future improvements:

1. **Add transform for other MUI components** that might have similar issues
2. **Create a test suite** for all transforms
3. **Add logging** to show which files were transformed during sync

## Related Documentation

- [InlineMenu Usage Guide](../packages/lib-react/render-ui/INLINE-MENU.md)
- [Upstream Sync Documentation](../tools/cli/README.md)
- [Transform Pipeline Architecture](../tools/cli/src/lib/upstream/sync-transforms.ts)
