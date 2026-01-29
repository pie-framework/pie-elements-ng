# Migration Guide: @pie-lib/config-ui → @pie-element/config-ui

## Overview

The `@pie-lib/config-ui` package has been moved to `@pie-element/config-ui` in the shared packages directory with the following improvements:

**Note**: The package still depends on `@pie-lib/render-ui` which remains in `lib-react/`. This is intentional - `render-ui` will continue to be synced from upstream. The `config-ui` package re-exports `InputContainer` from `render-ui`, so elements don't need to import from `render-ui` directly.

- **Modern Package**: ESM, proper exports, TypeScript
- **Enhanced Theming**: Comprehensive MUI theme with CSS variables
- **Better Maintainability**: No longer synced from upstream
- **Published**: Available on npm

## Status

✅ Package created: `packages/shared/config-ui/`
✅ Theme system added: `src/theme.ts`
✅ Build successful: JavaScript and declarations
⏳ **TODO**: Rewrite imports in 26 elements
⏳ **TODO**: Remove old package

## Automated Migration Steps

### Step 1: Rewrite All Imports

Replace all occurrences of `@pie-lib/config-ui` with `@pie-element/config-ui`:

```bash
# Find all files that need updating
grep -r "@pie-lib/config-ui" packages/elements-react --include="*.ts" --include="*.tsx" -l

# Count occurrences
grep -r "@pie-lib/config-ui" packages/elements-react --include="*.ts" --include="*.tsx" | wc -l
# Result: 56 import statements across 26 elements
```

**Find and replace command** (run from repository root):

```bash
# macOS/Linux
find packages/elements-react -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/@pie-lib\/config-ui/@pie-element\/config-ui/g' {} \;

# Or use your editor's find-and-replace:
# Find: @pie-lib/config-ui
# Replace: @pie-element/config-ui
# Scope: packages/elements-react/**/*.{ts,tsx}
```

### Step 2: Update package.json Dependencies

Update all 26 element package.json files:

```bash
# Find all package.json files that depend on config-ui
find packages/elements-react -name "package.json" -exec grep -l "@pie-lib/config-ui" {} \;

# Update dependencies
find packages/elements-react -name "package.json" -exec sed -i '' 's/"@pie-lib\/config-ui"/"@pie-element\/config-ui"/g' {} \;
```

### Step 3: Verify Builds

```bash
# Rebuild affected elements (sample)
cd packages/elements-react/multiple-choice
bun run build

cd ../categorize
bun run build

# Or rebuild all
bun run build:all
```

### Step 4: Remove Old Package

Once all imports are updated and verified:

```bash
# Remove old lib-react package
rm -rf packages/lib-react/config-ui

# Update .compatibility/report.json to remove config-ui from pieLibPackages list
# (This stops the sync system from trying to sync it)
```

## Affected Elements (26 total)

```
categorize
charting
complex-rubric
drag-in-the-blank
drawing-response
ebsr
explicit-constructed-response
extended-text-entry
fraction-model
graphing
graphing-solution-set
hotspot
image-cloze-association
inline-dropdown
likert
match
match-list
math-inline
math-templated
matrix
multi-trait-rubric
multiple-choice
number-line
passage
placement-ordering
select-text
```

## Manual Migration (Alternative)

If you prefer manual migration:

### 1. Update One Element at a Time

```typescript
// Before
import { InputContainer, layout, settings } from '@pie-lib/config-ui';

// After
import { InputContainer, layout, settings } from '@pie-element/config-ui';
```

### 2. Update package.json

```json
// Before
{
  "dependencies": {
    "@pie-lib/config-ui": "workspace:*"
  }
}

// After
{
  "dependencies": {
    "@pie-element/config-ui": "workspace:*"
  }
}
```

### 3. Test the Element

```bash
cd packages/elements-react/your-element
bun install
bun run build
bun run test
```

## New Features Available

### Comprehensive Theme

```typescript
import { ThemeProvider } from '@mui/material/styles';
import { pieConfigUiTheme } from '@pie-element/config-ui/theme';

function Configure() {
  return (
    <ThemeProvider theme={pieConfigUiTheme}>
      <YourConfigUI />
    </ThemeProvider>
  );
}
```

The theme automatically adapts to CSS variables set by the theming system.

### Multiple Entry Points

```typescript
// Main exports
import { InputContainer } from '@pie-element/config-ui';

// Layout components
import { ConfigLayout } from '@pie-element/config-ui/layout';

// Settings components
import { Panel, Toggle } from '@pie-element/config-ui/settings';

// Theme
import { pieConfigUiTheme } from '@pie-element/config-ui/theme';
```

## Verification Checklist

After migration:

- [ ] All 56 imports updated (`@pie-lib/config-ui` → `@pie-element/config-ui`)
- [ ] All 26 package.json files updated
- [ ] All elements build successfully
- [ ] Element demo works correctly
- [ ] Configuration UI displays properly
- [ ] Theme switching works (light/dark)
- [ ] Old package removed (`packages/lib-react/config-ui/`)
- [ ] Compatibility report updated (remove config-ui from sync list)

## Rollback Plan

If issues arise:

1. **Revert imports**: Change back to `@pie-lib/config-ui`
2. **Revert package.json files**: Change dependencies back
3. **Rebuild**: `bun install && bun run build`

The old package (`packages/lib-react/config-ui/`) will still exist until explicitly removed.

## Benefits of Migration

1. **No more upstream sync conflicts** - Own the code
2. **Enhanced theming** - Comprehensive MUI theme with CSS variables
3. **Modern package** - ESM, proper exports, TypeScript
4. **Better maintainability** - Can improve without upstream dependencies
5. **Publishable** - Can publish to npm as `@pie-element/config-ui`

## Support

For issues or questions:
- Check the README: `packages/shared/config-ui/README.md`
- Review theming docs: `docs/theming/`
- Refer to this migration guide
