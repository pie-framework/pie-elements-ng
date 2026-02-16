# Custom Themes

Guide to creating custom themes for PIE elements.

## Overview

Custom themes allow you to brand PIE elements to match your application's design. You can create themes from scratch or extend existing themes.

## Creating a Theme

### Minimal Theme

A minimal theme requires just 12 base colors:

```typescript
import type { PieTheme } from '@pie-element/shared-types';

const myTheme: PieTheme = {
  // Brand colors
  primary: '#6366F1',        // Indigo
  secondary: '#EC4899',      // Pink
  accent: '#8B5CF6',         // Purple

  // State colors
  success: '#10B981',        // Green
  error: '#EF4444',          // Red
  warning: '#F59E0B',        // Amber
  info: '#3B82F6',           // Blue

  // Base colors
  'base-100': '#FFFFFF',     // Background
  'base-200': '#F3F4F6',     // Secondary background
  'base-300': '#E5E7EB',     // Tertiary background
  'base-content': '#111827', // Text
  neutral: '#6B7280',        // Gray
};
```

The theming system will automatically derive 33+ additional colors.

### Extended Theme

For full control, define all 45+ colors:

```typescript
import type { PieThemeExtended } from '@pie-element/theming';

const myExtendedTheme: PieThemeExtended = {
  // Base colors
  primary: '#6366F1',
  'primary-light': '#A5B4FC',
  'primary-dark': '#4F46E5',
  'faded-primary': 'rgba(99, 102, 241, 0.15)',

  secondary: '#EC4899',
  'secondary-light': '#F9A8D4',
  'secondary-dark': '#DB2777',

  // Semantic colors
  success: '#10B981',
  'correct-secondary': 'rgba(16, 185, 129, 0.1)',
  'correct-tertiary': '#059669',
  'correct-icon': '#047857',

  error: '#EF4444',
  incorrect: '#EF4444',
  'incorrect-secondary': 'rgba(239, 68, 68, 0.1)',
  'incorrect-icon': '#DC2626',

  warning: '#F59E0B',
  missing: '#F59E0B',
  'missing-icon': '#D97706',

  // ... and 20+ more colors
};
```

## Theme Presets

### Light Theme

```typescript
const lightTheme: PieTheme = {
  primary: '#3F51B5',
  secondary: '#FF1493',
  accent: '#E91E63',
  success: '#4CAF50',
  error: '#FF9800',
  warning: '#FFC107',
  info: '#2196F3',
  neutral: '#9E9E9E',

  'base-100': '#FFFFFF',
  'base-200': '#F5F5F5',
  'base-300': '#E0E0E0',
  'base-content': '#000000',
};
```

### Dark Theme

```typescript
const darkTheme: PieTheme = {
  primary: '#90CAF9',
  secondary: '#FF80AB',
  accent: '#F48FB1',
  success: '#81C784',
  error: '#FFB74D',
  warning: '#FFD54F',
  info: '#64B5F6',
  neutral: '#757575',

  'base-100': '#121212',
  'base-200': '#1E1E1E',
  'base-300': '#2A2A2A',
  'base-content': '#FFFFFF',
};
```

### High Contrast Theme

```typescript
const highContrastTheme: PieTheme = {
  primary: '#000080',        // Dark blue
  secondary: '#8B008B',      // Dark magenta
  accent: '#2F4F4F',         // Dark slate gray
  success: '#006400',        // Dark green
  error: '#8B0000',          // Dark red
  warning: '#FF8C00',        // Dark orange
  info: '#00008B',           // Dark blue
  neutral: '#696969',        // Dim gray

  'base-100': '#FFFFFF',
  'base-200': '#F0F0F0',
  'base-300': '#D3D3D3',
  'base-content': '#000000',
};
```

### Pastel Theme

```typescript
const pastelTheme: PieTheme = {
  primary: '#B4A7D6',        // Pastel purple
  secondary: '#FFB3BA',      // Pastel pink
  accent: '#FFDFBA',         // Pastel peach
  success: '#BAFFC9',        // Pastel green
  error: '#FFB3BA',          // Pastel red
  warning: '#FFFFBA',        // Pastel yellow
  info: '#BAE1FF',           // Pastel blue
  neutral: '#D4D4D4',        // Light gray

  'base-100': '#FFFFFF',
  'base-200': '#F9F9F9',
  'base-300': '#F0F0F0',
  'base-content': '#333333',
};
```

## Using Custom Themes

### Apply with PieThemeProvider

```typescript
import { PieThemeProvider } from '@pie-element/theming';

function App() {
  return (
    <PieThemeProvider config={{ theme: myTheme, injectGlobally: true }}>
      <YourApp />
    </PieThemeProvider>
  );
}
```

### Apply Manually

```typescript
import { generateCssVariables, injectCssVariables } from '@pie-element/theming';

const cssVars = generateCssVariables(myTheme);
injectCssVariables(cssVars);
```

### Apply to Specific Element

```typescript
import { generateCssVariables, cssVariablesToStyleString } from '@pie-element/theming';

const cssVars = generateCssVariables(myTheme);
const styleString = cssVariablesToStyleString(cssVars);

<div style={{ cssText: styleString }}>
  {/* PIE elements here */}
</div>
```

## Extending Existing Themes

### Extend DaisyUI Theme

```typescript
import { extractDaisyUiTheme, daisyUiToPieTheme } from '@pie-element/theming-daisyui';

// Start with DaisyUI theme
const baseTheme = extractDaisyUiTheme();
const pieTheme = daisyUiToPieTheme(baseTheme);

// Override specific colors
const customTheme = {
  ...pieTheme,
  primary: '#6366F1',              // Custom primary
  'primary-light': '#A5B4FC',
  'correct-icon': '#047857',       // Custom correct icon color
};
```

### Extend MUI Theme

```typescript
import { useMuiPieTheme } from '@pie-element/theming-mui';

function MyComponent() {
  const baseTheme = useMuiPieTheme();

  // Override specific colors
  const customTheme = {
    ...baseTheme,
    'correct-secondary': 'rgba(16, 185, 129, 0.2)', // Stronger correct background
    border: '#D1D5DB',                               // Custom border color
  };

  // Use customTheme...
}
```

## Color Derivation Helpers

Use color utilities to derive variants:

```typescript
import { lighten, darken, rgba } from '@pie-element/theming-daisyui';

const myTheme: PieThemeExtended = {
  primary: '#6366F1',
  'primary-light': lighten('#6366F1', 0.3),
  'primary-dark': darken('#6366F1', 0.3),
  'faded-primary': rgba('#6366F1', 0.15),

  success: '#10B981',
  'correct-secondary': rgba('#10B981', 0.1),
  'correct-icon': darken('#10B981', 0.2),

  // ...
};
```

## Brand Colors

### Converting Brand Colors

If you have brand colors in specific formats:

```typescript
// Hex colors - use directly
const brandPrimary = '#6366F1';

// RGB colors - convert to hex or use rgba
const brandRgb = 'rgb(99, 102, 241)';
const brandRgba = 'rgba(99, 102, 241, 1)';

// HSL colors - convert to hex
function hslToHex(h: number, s: number, l: number): string {
  // ... conversion logic
}
```

### Brand Color Palette

```typescript
const brandColors = {
  primary: '#6366F1',      // Indigo 500
  secondary: '#EC4899',    // Pink 500
  tertiary: '#8B5CF6',     // Purple 500
  success: '#10B981',      // Emerald 500
  error: '#EF4444',        // Red 500
  warning: '#F59E0B',      // Amber 500
  info: '#3B82F6',         // Blue 500
};

// Map to PIE theme
const brandTheme: PieTheme = {
  primary: brandColors.primary,
  secondary: brandColors.secondary,
  accent: brandColors.tertiary,
  success: brandColors.success,
  error: brandColors.error,
  warning: brandColors.warning,
  info: brandColors.info,
  // ... base colors
};
```

## Accessibility Considerations

### Color Contrast

Ensure sufficient contrast ratios:

- **Normal text:** 4.5:1 minimum
- **Large text:** 3:1 minimum
- **Interactive elements:** 3:1 minimum

```typescript
// Good contrast examples
const accessibleTheme: PieTheme = {
  'base-100': '#FFFFFF',      // White background
  'base-content': '#111827',  // Very dark gray text (18.5:1 contrast)

  primary: '#1E40AF',         // Dark blue (7.3:1 on white)
  success: '#047857',         // Dark green (5.8:1 on white)
  error: '#B91C1C',           // Dark red (6.8:1 on white)
};
```

### Testing Contrast

Use browser devtools or online tools:

```typescript
// Example: Check contrast of text on background
function getContrast(foreground: string, background: string): number {
  // Calculate relative luminance
  // Return contrast ratio
}

const contrast = getContrast('#111827', '#FFFFFF');
console.log(`Contrast ratio: ${contrast}:1`); // 18.5:1
```

## Theme Switching

### Toggle Between Themes

```typescript
import { useState } from 'react';
import { PieThemeProvider } from '@pie-element/theming';

function App() {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <PieThemeProvider config={{ theme, injectGlobally: true }}>
      <button onClick={() => setIsDark(!isDark)}>
        Toggle {isDark ? 'Light' : 'Dark'}
      </button>
      <YourApp />
    </PieThemeProvider>
  );
}
```

### System Preference

```typescript
import { useState, useEffect } from 'react';

function useSystemTheme() {
  const [isDark, setIsDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isDark ? darkTheme : lightTheme;
}

function App() {
  const theme = useSystemTheme();

  return (
    <PieThemeProvider config={{ theme, injectGlobally: true }}>
      <YourApp />
    </PieThemeProvider>
  );
}
```

## Testing Custom Themes

### Visual Testing

```typescript
import { render } from '@testing-library/react';

it('renders with custom theme', () => {
  const { container } = render(
    <PieThemeProvider config={{ theme: myCustomTheme }}>
      <MyElement />
    </PieThemeProvider>
  );

  expect(container).toMatchSnapshot();
});
```

### Color Validation

```typescript
import { generateCssVariables } from '@pie-element/theming';

it('generates all required CSS variables', () => {
  const cssVars = generateCssVariables(myTheme);

  expect(cssVars).toHaveProperty('--pie-text');
  expect(cssVars).toHaveProperty('--pie-primary');
  expect(cssVars).toHaveProperty('--pie-correct');
  // ... check all 45+ variables
});
```

## Best Practices

1. **Start with base theme:** Define 12 colors, let system derive the rest
2. **Test accessibility:** Verify color contrast ratios
3. **Test both modes:** Ensure light and dark themes work
4. **Use semantic names:** Name themes by purpose, not color
5. **Document deviations:** If overriding derived colors, document why
6. **Version themes:** Track theme changes like code

## Troubleshooting

### Colors Look Wrong

Check color values are valid:

```typescript
import { parseColor } from '@pie-element/theming-daisyui';

const rgb = parseColor('#6366F1');
console.log(rgb); // { r: 99, g: 102, b: 241 }
```

### Derived Colors Don't Match

Override specific colors:

```typescript
const theme = daisyUiToPieTheme(baseTheme);
theme['correct-icon'] = '#047857'; // Override derived color
```

### Theme Not Applying

Verify CSS variables are injected:

```typescript
console.log(
  getComputedStyle(document.documentElement).getPropertyValue('--pie-primary')
);
```

## Examples

See complete theme examples in:
- `packages/shared/element-player/src/PieElementPlayer.svelte`
- `packages/shared/theming/src/constants.ts`
- Theme presets in this document

## Next Steps

- [**Color System**](./02-color-system.md) - Learn about all 45+ colors
- [**Using Themes**](./03-using-themes.md) - Apply themes in applications
- [**API Reference**](./08-api-reference.md) - Complete API documentation
