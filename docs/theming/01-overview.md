# Theming Overview

PIE elements support dynamic theming through CSS custom properties and adapter packages.

## Architecture

### Three-Layer System

The PIE theming system consists of three layers:

#### 1. CSS Variables Layer (`--pie-*`)

- 45+ CSS custom properties with `--pie-` prefix
- Fallback values from defaults object
- Used by all element components via `color.*()` functions
- Framework-agnostic and performant

```typescript
import { color } from '@pie-lib/render-ui';

const Container = styled('div')({
  color: color.text(),              // var(--pie-text, black)
  backgroundColor: color.background(), // var(--pie-background, transparent)
});
```

#### 2. Base Theming Package (`@pie-element/theming`)

- CSS variable generation from theme objects
- MUI theme creation (optional)
- React hooks and providers
- Framework-agnostic utilities

```typescript
import { generateCssVariables, cssVariablesToStyleString } from '@pie-element/theming';

const cssVars = generateCssVariables(pieTheme);
const styleString = cssVariablesToStyleString(cssVars);
```

#### 3. Adapter Packages

Framework-specific theme extraction and conversion:

- **@pie-element/theming-daisyui** - DaisyUI themes (oklch color space support)
- **@pie-element/theming-mui** - Material-UI themes
- Future: Bootstrap, Tailwind, custom frameworks

```typescript
import { extractDaisyUiTheme, daisyUiToPieTheme } from '@pie-element/theming-daisyui';

const daisyTheme = extractDaisyUiTheme();
const pieTheme = daisyUiToPieTheme(daisyTheme); // 12 colors → 45+ colors
```

## Key Concepts

### PieTheme Interface

Base theme interface with 12 semantic colors:

```typescript
interface PieTheme {
  // Semantic colors
  primary?: string;
  secondary?: string;
  accent?: string;
  neutral?: string;

  // State colors
  success?: string;      // Maps to PIE 'correct'
  error?: string;        // Maps to PIE 'incorrect'
  warning?: string;      // Maps to PIE 'missing'
  info?: string;

  // Base colors
  'base-100'?: string;   // Background
  'base-200'?: string;   // Secondary background
  'base-300'?: string;   // Tertiary background
  'base-content'?: string; // Text color
}
```

### PieThemeExtended Interface

Extended with 45+ PIE-specific colors:

```typescript
interface PieThemeExtended extends PieTheme {
  // Primary variants
  'primary-light'?: string;
  'primary-dark'?: string;
  'faded-primary'?: string;

  // State variants
  'correct-secondary'?: string;
  'correct-tertiary'?: string;
  'correct-icon'?: string;
  'incorrect-secondary'?: string;
  'incorrect-icon'?: string;
  'missing-icon'?: string;

  // UI elements
  disabled?: string;
  'disabled-secondary'?: string;
  border?: string;
  'border-light'?: string;
  'border-dark'?: string;

  // Focus states
  'focus-checked'?: string;
  'focus-checked-border'?: string;
  'focus-unchecked'?: string;
  'focus-unchecked-border'?: string;

  // Blue-grey palette
  'blue-grey-100'?: string;
  'blue-grey-300'?: string;
  'blue-grey-600'?: string;
  'blue-grey-900'?: string;

  // ... and more (45+ total)
}
```

### Color Derivation

Adapters derive extended colors from base colors using simple algorithms:

```typescript
// From 12 base colors
const daisyTheme = extractDaisyUiTheme(); // 12 colors

// To 45+ extended colors
const pieTheme = daisyUiToPieTheme(daisyTheme); // 45+ colors

// Derivation examples:
// primary-light = lighten(primary, 0.3)
// primary-dark = darken(primary, 0.3)
// faded-primary = rgba(primary, 0.15)
// correct-icon = darken(success, 0.2)
```

**Benefits:**
- Consistent color relationships
- Automatic adaptation to any base theme
- User can override specific derived colors if needed

### CSS Variable Mapping

Each PIE color maps to a CSS variable with a fallback:

```typescript
const DEFAULT_CSS_MAPPINGS = [
  { variableName: '--pie-text', themeKey: 'base-content', fallback: 'black' },
  { variableName: '--pie-correct', themeKey: 'success', fallback: '#4CAF50' },
  { variableName: '--pie-primary', themeKey: 'primary', fallback: '#3F51B5' },
  // ... 45+ mappings
];
```

Components use these variables via helper functions:

```typescript
import { color } from '@pie-lib/render-ui';

const Button = styled('button')({
  color: color.text(),              // var(--pie-text, black)
  backgroundColor: color.primary(), // var(--pie-primary, #3F51B5)
  border: `1px solid ${color.border()}`, // var(--pie-border, #9A9A9A)
});
```

## Design Philosophy

### Framework Agnostic

The base theming system is framework-agnostic:
- CSS variables work in any framework
- Adapters handle framework-specific extraction
- Elements don't depend on framework internals

### Backwards Compatible

Existing elements work without modification:
- CSS variables already used via `color.*()` functions
- Fallback values ensure graceful degradation
- No breaking changes to element APIs

### Extensible

Easy to add new adapters:
- Base package provides utilities
- Adapter implements extraction and conversion
- Color derivation functions are reusable

### Performance First

Optimized for runtime performance:
- CSS variables are native and fast
- Theme extraction cached when possible
- Minimal JavaScript overhead

## Workflow

### For Application Developers

1. Install theming packages
2. Extract theme from your UI framework
3. Convert to PIE theme (base → extended)
4. Generate CSS variables
5. Apply to PIE element containers

### For Element Authors

1. Use `color.*()` functions for all colors
2. Never hardcode hex/rgb values
3. Test with light and dark themes
4. Follow styling guidelines (see [Creating Elements](./06-creating-elements.md))

### For Theme Creators

1. Define 12 base semantic colors
2. Let adapters derive 45+ extended colors
3. Override specific colors if needed
4. Test across multiple elements

## Next Steps

- [**Color System**](./02-color-system.md) - Learn about all 45+ colors
- [**Using Themes**](./03-using-themes.md) - Integrate in your application
- [**Creating Elements**](./06-creating-elements.md) - Build themeable elements
