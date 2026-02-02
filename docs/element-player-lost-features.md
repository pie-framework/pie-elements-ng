## Feature: Theming System Integration ⭐ LOW PRIORITY

### What It Did

Integrated DaisyUI theme system with PIE elements, allowing dynamic theme switching and CSS variable generation.

### Implementation Details

**New Imports**:

```typescript
import type { PieTheme } from "@pie-element/shared-types";
import type { PieThemeExtended } from "@pie-element/theming";
import {
  extractDaisyUiTheme,
  watchDaisyUiTheme,
  daisyUiToPieTheme,
} from "@pie-element/theming-daisyui";
import {
  generateCssVariables,
  cssVariablesToStyleString,
} from "@pie-element/theming";
```

**New State**:

```typescript
let currentTheme = $state<PieThemeExtended | undefined>(undefined);
let cssVars = $derived(
  currentTheme
    ? cssVariablesToStyleString(generateCssVariables(currentTheme))
    : "",
);
```

**Usage** (presumably):

```svelte
<div style={cssVars}>
  <!-- Element content with theme variables -->
</div>
```

### Benefits

- ✅ Dynamic theming support
- ✅ Integration with DaisyUI themes
- ✅ CSS variables for consistent styling

### Concerns

- ⚠️ Most complex feature
- ⚠️ Requires theming packages to be fully implemented
- ⚠️ May need theme context/provider pattern
- ⚠️ Unclear where theme comes from (prop? context? DOM?)

### How to Re-implement Safely

1. Wait until theming packages are stable
2. Design theme API carefully (prop vs context vs attribute)
3. Test theme switching without breaking existing elements
4. Consider making it opt-in rather than always-on

---
