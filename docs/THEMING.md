# PIE Elements Theming Guide

PIE Elements use CSS custom properties (CSS variables) for theming, providing a flexible and framework-agnostic way to customize element appearance.

## Overview

PIE Elements are implemented as React components using Material-UI (MUI) and Emotion for styling internally. However, theming is exposed through CSS variables, making it possible to theme elements regardless of the surrounding application framework.

**Key concepts:**
- Elements reference CSS variables like `var(--pie-text, fallback)`
- You set CSS variables at a container level
- Variables cascade down to all nested elements
- Fallback values ensure elements work even without theming

## Architecture

### How Elements Use CSS Variables

Elements use helper functions from `@pie-lib/render-ui` that generate CSS variable references:

```typescript
// From element code
import { color } from '@pie-lib/render-ui';

const Container = styled('div')({
  color: color.text(),           // Generates: var(--pie-text, black)
  backgroundColor: color.background(), // Generates: var(--pie-background, rgba(255,255,255,0))
  borderColor: color.border(),   // Generates: var(--pie-border, #9A9A9A)
});
```

This abstraction means:
- ✅ Element internals (MUI/Emotion) are implementation details
- ✅ Theming works through standard CSS custom properties
- ✅ Elements work in any framework (React, Vue, Svelte, vanilla JS)
- ✅ Graceful fallbacks if variables aren't set

### Theming Packages

For programmatic theme management, see:
- [`@pie-element/shared-theming`](../packages/shared/theming/) - Core theming utilities with PIE light/dark themes
- [`@pie-element/shared-theming-daisyui`](../packages/shared/theming-daisyui/) - DaisyUI adapter
- [Theming system documentation](./theming/) - Complete theming architecture

### PIE Default Themes

PIE Elements provides two default themes with PIE branding (orange #FF6F00):
- `PIE_LIGHT_THEME` - Clean, professional light theme
- `PIE_DARK_THEME` - Modern dark theme for reduced eye strain

Both themes are WCAG AA compliant and fully customizable.

## Formal CSS Variables

These are the officially supported CSS variables defined in the PIE theming system. All elements use these variables through the `color.*()` helper functions.

### Core Colors (5 variables)

| Variable | Theme Key | Default | Description |
|----------|-----------|---------|-------------|
| `--pie-text` | `base-content` | `black` | Primary text color |
| `--pie-background` | `base-100` | `rgba(255,255,255,0)` | Primary background color |
| `--pie-background-dark` | `background-dark` | `#ECEDF1` | Darker background variant |
| `--pie-secondary-background` | `secondary-background` | `rgba(241,241,241,1)` | Secondary background (containers, panels) |
| `--pie-dropdown-background` | `dropdown-background` | `#E0E1E6` | Dropdown menu backgrounds |

### Primary Colors (4 variables)

| Variable | Theme Key | Default | Description |
|----------|-----------|---------|-------------|
| `--pie-primary` | `primary` | `#3F51B5` (indigo[500]) | Main brand color |
| `--pie-primary-light` | `primary-light` | `#9FA8DA` (indigo[200]) | Lighter primary variant |
| `--pie-primary-dark` | `primary-dark` | `#283593` (indigo[800]) | Darker primary variant |
| `--pie-faded-primary` | `faded-primary` | `#DCDAFB` | Very light primary (backgrounds) |

### Secondary Colors (3 variables)

| Variable | Theme Key | Default | Description |
|----------|-----------|---------|-------------|
| `--pie-secondary` | `secondary` | `#F50057` (pink.A400) | Secondary brand color |
| `--pie-secondary-light` | `secondary-light` | `#F48FB1` (pink[200]) | Lighter secondary variant |
| `--pie-secondary-dark` | `secondary-dark` | `#880E4F` (pink[900]) | Darker secondary variant |

### Tertiary Colors (2 variables)

| Variable | Theme Key | Default | Description |
|----------|-----------|---------|-------------|
| `--pie-tertiary` | `tertiary` | `#146EB3` | Tertiary brand color |
| `--pie-tertiary-light` | `tertiary-light` | `#D0E2F0` | Lighter tertiary variant |

### Status Colors - Correct (4 variables)

| Variable | Theme Key | Default | Description |
|----------|-----------|---------|-------------|
| `--pie-correct` | `success` | `#4CAF50` (green[500]) | Correct answer color |
| `--pie-correct-secondary` | `correct-secondary` | `#E8F5E9` (green[50]) | Correct background (very light) |
| `--pie-correct-tertiary` | `correct-tertiary` | `#0EA449` | Correct borders/accents |
| `--pie-correct-icon` | `correct-icon` | `#087D38` | Correct icons (darker for visibility) |

### Status Colors - Incorrect (3 variables)

| Variable | Theme Key | Default | Description |
|----------|-----------|---------|-------------|
| `--pie-incorrect` | `error` | `#FF9800` (orange[500]) | Incorrect answer color |
| `--pie-incorrect-secondary` | `incorrect-secondary` | `#FFEBEE` (red[50]) | Incorrect background (very light) |
| `--pie-incorrect-icon` | `incorrect-icon` | `#BF0D00` | Incorrect icons (darker for visibility) |

### Status Colors - Missing (2 variables)

| Variable | Theme Key | Default | Description |
|----------|-----------|---------|-------------|
| `--pie-missing` | `warning` | `#D32F2F` (red[700]) | Missing/partial answer color |
| `--pie-missing-icon` | `missing-icon` | `#6A78A1` | Missing answer icons |

### Disabled State (2 variables)

| Variable | Theme Key | Default | Description |
|----------|-----------|---------|-------------|
| `--pie-disabled` | `disabled` | `grey` | Disabled text/controls |
| `--pie-disabled-secondary` | `disabled-secondary` | `#ABABAB` | Disabled backgrounds |

### Border Colors (4 variables)

| Variable | Theme Key | Default | Description |
|----------|-----------|---------|-------------|
| `--pie-border` | `border` | `#9A9A9A` | Default border color |
| `--pie-border-light` | `border-light` | `#D1D1D1` | Lighter borders (subtle) |
| `--pie-border-dark` | `border-dark` | `#646464` | Darker borders (emphasis) |
| `--pie-border-gray` | `border-gray` | `#7E8494` | Gray borders (neutral) |

### Focus States (4 variables)

| Variable | Theme Key | Default | Description |
|----------|-----------|---------|-------------|
| `--pie-focus-checked` | `focus-checked` | `#BBDEFB` | Focus ring for selected items |
| `--pie-focus-checked-border` | `focus-checked-border` | `#1565C0` | Focus border for selected items |
| `--pie-focus-unchecked` | `focus-unchecked` | `#E0E0E0` | Focus ring for unselected items |
| `--pie-focus-unchecked-border` | `focus-unchecked-border` | `#757575` | Focus border for unselected items |

### Blue-Grey Palette (4 variables)

| Variable | Theme Key | Default | Description |
|----------|-----------|---------|-------------|
| `--pie-blue-grey-100` | `blue-grey-100` | `#F3F5F7` | Lightest blue-grey |
| `--pie-blue-grey-300` | `blue-grey-300` | `#C0C3CF` | Light blue-grey |
| `--pie-blue-grey-600` | `blue-grey-600` | `#7E8494` | Medium blue-grey |
| `--pie-blue-grey-900` | `blue-grey-900` | `#152452` | Darkest blue-grey |

### Absolute Colors (2 variables)

| Variable | Theme Key | Default | Description |
|----------|-----------|---------|-------------|
| `--pie-black` | `black` | `#000000` | Pure black |
| `--pie-white` | `white` | `#ffffff` | Pure white |

**Total: 43 formal CSS variables**

---

## Component-Specific Variables

These variables provide fine-grained control over specific element components. They are now **formally supported** as part of the PIE theming system and are automatically derived when using theme adapters (DaisyUI, MUI, etc.).

### Choice Input Variables

Used by: `multiple-choice`, `likert`, `matrix` elements

| Variable | Default Fallback | Description |
|----------|------------------|-------------|
| `--choice-input-color` | `var(--pie-text, black)` | Choice radio/checkbox color |
| `--choice-input-selected-color` | `var(--pie-primary, #3F51B5)` | Selected choice color |
| `--choice-input-disabled-color` | `var(--pie-disabled, grey)` | Disabled choice color |

**Dynamic pattern**: `--choice-input-${state}` where `state` can be:
- `correct-color` → Text color for correct choices
- `incorrect-color` → Text color for incorrect choices
- `correct-selected-color` → Selected color for correct choices
- `incorrect-checked` → Checked color for incorrect choices
- `correct-disabled-color` → Disabled color for correct choices
- `incorrect-disabled-color` → Disabled color for incorrect choices

**Example usage:**
```css
:root {
  --choice-input-color: #333;
  --choice-input-selected-color: #007bff;
  --choice-input-correct-color: #28a745;
  --choice-input-incorrect-color: #dc3545;
}
```

### Feedback Variables

Used by: `multiple-choice`, `match-list` elements

| Variable | Default Fallback | Description |
|----------|------------------|-------------|
| `--feedback-correct-bg-color` | `var(--pie-correct, #4CAF50)` | Correct feedback background |
| `--feedback-incorrect-bg-color` | `var(--pie-incorrect, #FF9800)` | Incorrect feedback background |

**Example usage:**
```css
:root {
  --feedback-correct-bg-color: #d4edda;
  --feedback-incorrect-bg-color: #f8d7da;
}
```

### Annotation Variables

Used by: `extended-text-entry` element (annotation feature)

| Variable | Default | Description |
|----------|---------|-------------|
| `--before-right` | `100%` | Annotation pointer right position |
| `--before-top` | `5px` | Annotation pointer top position |
| `--before-border-width` | `7px` | Annotation pointer border width |
| `--before-border-color` | `rgb(153, 255, 153)` | Annotation pointer color |

**Note**: These control the pseudo-element pointer that connects annotations to text.

### Number Line / Graphing Variables

Used by: `number-line` element

| Variable | Default | Description |
|----------|---------|-------------|
| `--arrow-color` | Varies by state | Arrow color on number line |
| `--tick-color` | `white` | Tick mark color |
| `--line-stroke` | `white` | Line stroke color |
| `--point-fill` | `black` | Point fill color |
| `--point-stroke` | `white` | Point outline color |
| `--correct-answer-toggle-label-color` | `white` | Toggle label text color |

**Note**: Some values are dynamically set based on answer state (correct/incorrect/selected).

### Utility Variables

| Variable | Used By | Description |
|----------|---------|-------------|
| `--pie-zoom` | `drawing-response`, `hotspot` | Zoom scale factor (read from inline styles) |
| `--pie-primary-text` | `likert` | Primary text color (nested fallback: `var(--pie-text, #000000)`) |

### Math Keypad Theming (New)

The refreshed keypad in `@pie-lib/math-input` now relies on PIE semantic tokens rather than hardcoded palette values:

- key text: `--pie-text`
- standard/template lane key background/hover: `--pie-blue-grey-100` / `--pie-blue-grey-300`
- operator lane key background/hover: `--pie-blue-grey-300` / `--pie-blue-grey-600`
- deterministic placeholder fill (template pink boxes): `--pie-secondary-light`
- focus ring: `--pie-focus-checked-border`
- key borders: `--pie-border-light`

All deterministic keycap primitives (fraction bars, root bars, geometry overlays, placeholder boxes) use these tokens, so keypad theming follows PIE light/dark theme packs without MathJax-specific overrides.

---

**Total: 60+ CSS variables** (43 core + 17 component-specific)

---

## Usage Examples

### Using PIE Default Themes

The simplest way to get started with a professionally designed theme:

```javascript
import { PIE_LIGHT_THEME, PIE_DARK_THEME, generateCssVariables, injectCssVariables } from '@pie-element/shared-theming';

// Apply PIE light theme
const cssVars = generateCssVariables(PIE_LIGHT_THEME);
injectCssVariables(cssVars);

// Or apply PIE dark theme
const darkCssVars = generateCssVariables(PIE_DARK_THEME);
injectCssVariables(darkCssVars);
```

### Basic Theme Setup

Set CSS variables on a container element to theme all nested PIE elements:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .pie-container {
      /* Core colors */
      --pie-text: #2d3748;
      --pie-background: #ffffff;

      /* Brand colors */
      --pie-primary: #0066cc;
      --pie-primary-light: #3399ff;
      --pie-primary-dark: #004c99;

      /* Status colors */
      --pie-correct: #28a745;
      --pie-incorrect: #dc3545;

      /* Borders */
      --pie-border: #dee2e6;
    }
  </style>
</head>
<body>
  <div class="pie-container">
    <!-- All PIE elements in here will use the theme -->
    <pie-multiple-choice-element />
    <pie-text-entry-element />
  </div>
</body>
</html>
```

### Dark Theme Example

```css
.pie-container.dark {
  /* Core colors */
  --pie-text: #e2e8f0;
  --pie-background: #1a202c;
  --pie-background-dark: #2d3748;
  --pie-secondary-background: #374151;

  /* Brand colors */
  --pie-primary: #60a5fa;
  --pie-primary-light: #93c5fd;
  --pie-primary-dark: #3b82f6;

  /* Status colors */
  --pie-correct: #10b981;
  --pie-incorrect: #f59e0b;
  --pie-missing: #ef4444;

  /* Borders */
  --pie-border: #4b5563;
  --pie-border-light: #6b7280;

  /* Focus states */
  --pie-focus-checked: #1e40af;
  --pie-focus-unchecked: #4b5563;
}
```

### Customizing Choice Inputs

Override component-specific variables for granular control:

```css
.custom-quiz {
  /* Use formal variables for main theming */
  --pie-primary: #8b5cf6;
  --pie-correct: #22c55e;
  --pie-incorrect: #ef4444;

  /* Customize choice inputs specifically */
  --choice-input-color: #6b7280;
  --choice-input-selected-color: #8b5cf6;
  --choice-input-disabled-color: #d1d5db;

  /* Custom feedback backgrounds */
  --feedback-correct-bg-color: #d1fae5;
  --feedback-incorrect-bg-color: #fee2e2;
}
```

### DaisyUI Integration

PIE Elements work seamlessly with DaisyUI themes using the theming adapter:

```javascript
// Using the DaisyUI adapter
import { initializeAutoTheming } from '@pie-element/theming-daisyui';

// Initialize once - automatically extracts DaisyUI theme and sets --pie-* variables
initializeAutoTheming();

// Now changing data-theme attribute updates all PIE elements
document.documentElement.setAttribute('data-theme', 'corporate');
```

```html
<!DOCTYPE html>
<html data-theme="corporate">
<head>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@latest/dist/full.css" rel="stylesheet">
  <script type="module">
    import { initializeAutoTheming } from '@pie-element/theming-daisyui';
    initializeAutoTheming();
  </script>
</head>
<body>
  <!-- PIE elements automatically use DaisyUI theme colors -->
  <pie-multiple-choice-element />
</body>
</html>
```

See [DaisyUI integration documentation](./theming/04-daisyui-integration.md) for details.

### Custom Theme System

Programmatically generate and inject CSS variables:

```javascript
import { generateCssVariables, injectCssVariables } from '@pie-element/shared-theming';

// Your custom theme
const myTheme = {
  'base-content': '#1a202c',
  'base-100': '#ffffff',
  primary: '#0066cc',
  success: '#28a745',
  error: '#dc3545',
  // ... other colors
};

// Generate CSS variables
const cssVars = generateCssVariables(myTheme);
// Returns: { '--pie-text': '#1a202c', '--pie-primary': '#0066cc', ... }

// Inject to document root
injectCssVariables(cssVars);

// Or inject to specific element
const container = document.querySelector('.pie-container');
injectCssVariables(cssVars, container);
```

---

## Best Practices

### ✅ Do's

- **Start with PIE themes** - Use `PIE_LIGHT_THEME` or `PIE_DARK_THEME` as a base
- **Use formal variables** - All 60+ variables are formally supported
- **Set at container level** - Set CSS variables on a wrapper element, not globally
- **Test light and dark themes** - Ensure your theme works in both modes
- **Check contrast** - Verify WCAG AA compliance (4.5:1 contrast ratio) for text
- **Use semantic colors** - Use `--pie-correct`, `--pie-incorrect` for feedback, not arbitrary colors
- **Leverage theme adapters** - DaisyUI/MUI adapters automatically derive all variables

### ❌ Don'ts

- **Don't hardcode colors in element HTML** - Always use CSS variables
- **Don't override MUI theme directly** - Theme through CSS variables, not MUI's ThemeProvider
- **Don't use color alone for meaning** - Supplement with icons or text for accessibility
- **Don't forget focus states** - Ensure `--pie-focus-*` variables have good contrast
- **Don't skip component variables** - They provide fine-grained control and are now formal

### Accessibility Considerations

**Color Contrast**:
- Text on background: minimum 4.5:1 ratio
- Status indicators: minimum 3:1 ratio
- Focus indicators: minimum 3:1 ratio

**High Contrast Mode**:
```css
@media (prefers-contrast: high) {
  .pie-container {
    --pie-text: #000000;
    --pie-background: #ffffff;
    --pie-primary: #0000ff;
    --pie-border: #000000;
    /* Stronger, bolder colors */
  }
}
```

**Dark Mode Preference**:
```css
@media (prefers-color-scheme: dark) {
  .pie-container {
    --pie-text: #f8f9fa;
    --pie-background: #212529;
    /* ... dark theme variables */
  }
}
```

---

## See Also

- [Complete theming system documentation](./theming/) - Architecture and detailed guides
- [Color system reference](./theming/02-color-system.md) - Complete color palette
- [DaisyUI integration](./theming/04-daisyui-integration.md) - DaisyUI adapter usage
- [Creating elements with theming](./theming/06-creating-elements.md) - Guidelines for element authors
- [Accessibility requirements](./ACCESSIBILITY.md) - WCAG compliance guidelines

---

**Source Files**:
- Formal variables: [`packages/shared/theming/src/constants.ts`](../packages/shared/theming/src/constants.ts)
- Color functions: [`packages/lib-react/render-ui/src/color.ts`](../packages/lib-react/render-ui/src/color.ts)

**Last Updated**: 2026-02-02
