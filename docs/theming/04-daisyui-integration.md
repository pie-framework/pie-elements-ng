# DaisyUI Integration

Complete guide to using PIE elements with DaisyUI themes.

## Overview

The `@pie-element/theming-daisyui` package provides:
- DOM-based theme extraction from DaisyUI utility classes
- OKLCH color space support (DaisyUI v4+)
- Color derivation (12 base → 45+ extended colors)
- Runtime theme watching via MutationObserver
- Color manipulation utilities (lighten, darken, rgba)

## Installation

```bash
npm install @pie-element/theming @pie-element/theming-daisyui
```

**Peer dependencies** (should already be installed):
```bash
npm install daisyui tailwindcss
```

## Basic Usage

### Extract Current Theme

```typescript
import { extractDaisyUiTheme } from '@pie-element/theming-daisyui';

// Extract theme from document root
const theme = extractDaisyUiTheme();

console.log(theme);
// {
//   primary: 'oklch(0.45 0.24 277.023)',
//   secondary: 'oklch(0.69 0.19 342.55)',
//   success: 'oklch(0.65 0.16 160)',
//   ...
// }
```

### Convert to Extended Theme

```typescript
import { daisyUiToPieTheme } from '@pie-element/theming-daisyui';

const daisyTheme = extractDaisyUiTheme();
const pieTheme = daisyUiToPieTheme(daisyTheme);

console.log(Object.keys(pieTheme).length); // 45+
// Includes: primary, primary-light, primary-dark, correct-icon, etc.
```

### Apply to PIE Elements

```typescript
import { generateCssVariables, cssVariablesToStyleString } from '@pie-element/theming';

const cssVars = generateCssVariables(pieTheme);
const styleString = cssVariablesToStyleString(cssVars);

// Apply to container
document.querySelector('.pie-container').style.cssText = styleString;
```

## Theme Extraction Details

### How Extraction Works

The adapter creates a temporary hidden element and applies DaisyUI utility classes to extract colors:

```typescript
// Internally:
const tempDiv = document.createElement('div');
tempDiv.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
document.body.appendChild(tempDiv);

tempDiv.className = 'text-primary';
const primaryColor = getComputedStyle(tempDiv).color;

tempDiv.className = 'bg-base-200';
const base200Color = getComputedStyle(tempDiv).backgroundColor;

document.body.removeChild(tempDiv);
```

This technique works because:
- DaisyUI defines colors via utility classes
- Computed styles reflect current `data-theme`
- No need to parse Tailwind config files

### Extracted Colors

12 base colors are extracted:

| DaisyUI Color | Utility Class | PIE Theme Key | Usage |
|---------------|---------------|---------------|-------|
| Primary | `text-primary` | `primary` | Brand color |
| Secondary | `text-secondary` | `secondary` | Secondary brand |
| Accent | `text-accent` | `accent` | Accent color |
| Neutral | `text-neutral` | `neutral` | Neutral/gray |
| Base Content | `text-base-content` | `base-content` | Text color |
| Base 100 | `bg-base-100` | `base-100` | Background |
| Base 200 | `bg-base-200` | `base-200` | Secondary bg |
| Base 300 | `bg-base-300` | `base-300` | Tertiary bg |
| Success | `text-success` | `success` | Correct answers |
| Error | `text-error` | `error` | Incorrect answers |
| Warning | `text-warning` | `warning` | Missing answers |
| Info | `text-info` | `info` | Info messages |

## Color Derivation

The adapter derives 33+ additional colors from the 12 base colors:

### Primary Variants

```typescript
if (daisyTheme.primary) {
  pieTheme['primary-light'] = lighten(daisyTheme.primary, 0.3);
  pieTheme['primary-dark'] = darken(daisyTheme.primary, 0.3);
  pieTheme['faded-primary'] = rgba(daisyTheme.primary, 0.15);
}
```

### Success (Correct) Variants

```typescript
if (daisyTheme.success) {
  pieTheme['correct-secondary'] = rgba(daisyTheme.success, 0.1);
  pieTheme['correct-tertiary'] = darken(daisyTheme.success, 0.1);
  pieTheme['correct-icon'] = darken(daisyTheme.success, 0.2);
}
```

### Error (Incorrect) Variants

```typescript
if (daisyTheme.error) {
  pieTheme.incorrect = daisyTheme.error;
  pieTheme['incorrect-secondary'] = rgba(daisyTheme.error, 0.1);
  pieTheme['incorrect-icon'] = darken(daisyTheme.error, 0.2);
}
```

### Border Colors

```typescript
if (daisyTheme.neutral) {
  pieTheme.border = daisyTheme.neutral;
  pieTheme['border-light'] = lighten(daisyTheme.neutral, 0.3);
  pieTheme['border-dark'] = darken(daisyTheme.neutral, 0.3);
  pieTheme['border-gray'] = daisyTheme.neutral;
}
```

### Focus States

```typescript
if (daisyTheme.primary) {
  pieTheme['focus-checked'] = rgba(daisyTheme.primary, 0.2);
  pieTheme['focus-checked-border'] = darken(daisyTheme.primary, 0.2);
}

if (daisyTheme.neutral) {
  pieTheme['focus-unchecked'] = rgba(daisyTheme.neutral, 0.2);
  pieTheme['focus-unchecked-border'] = daisyTheme.neutral;
}
```

### Blue-Grey Palette

```typescript
if (daisyTheme.neutral) {
  pieTheme['blue-grey-100'] = lighten(daisyTheme.neutral, 0.5);
  pieTheme['blue-grey-300'] = lighten(daisyTheme.neutral, 0.3);
  pieTheme['blue-grey-600'] = daisyTheme.neutral;
  pieTheme['blue-grey-900'] = darken(daisyTheme.neutral, 0.4);
}
```

## Runtime Theme Watching

Watch for theme changes when user toggles light/dark mode:

```typescript
import { watchDaisyUiTheme } from '@pie-element/theming-daisyui';

const unwatch = watchDaisyUiTheme((newTheme) => {
  console.log('Theme changed:', newTheme);
  // Update your application
});

// Later: stop watching
unwatch();
```

### How Watching Works

Uses MutationObserver to detect `data-theme` attribute changes:

```typescript
// Internally:
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.attributeName === 'data-theme') {
      const newTheme = extractDaisyUiTheme();
      callback(newTheme);
    }
  }
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});
```

Detects changes from:
- JavaScript: `document.documentElement.setAttribute('data-theme', 'dark')`
- User theme toggles
- System preference changes

## OKLCH Color Space Support

DaisyUI v4+ uses OKLCH color space for perceptually uniform colors.

### What is OKLCH?

- **O**K: Based on Oklab color space (human perception)
- **L**: Lightness (0-1)
- **C**: Chroma/saturation (0-0.4 typical)
- **H**: Hue angle (0-360 degrees)

Example: `oklch(0.45 0.24 277.023)` = medium indigo

### Color Conversion

The adapter converts OKLCH → RGB for color manipulation:

```typescript
import { oklchToRgb } from '@pie-element/theming-daisyui';

const rgb = oklchToRgb('oklch(0.45 0.24 277.023)');
// { r: 63, g: 81, b: 181 } (indigo)
```

**Conversion pipeline:**
1. Parse OKLCH values (L, C, H)
2. Convert to OKLAB (L, a, b)
3. Convert to linear RGB
4. Apply gamma correction → sRGB
5. Clamp to 0-255 range

This ensures accurate color manipulation (lighten, darken) on OKLCH colors.

## Color Utilities

The package exports color manipulation functions:

### Lighten

```typescript
import { lighten } from '@pie-element/theming-daisyui';

lighten('#3F51B5', 0.3); // '#9FA8DA' (30% lighter)
lighten('oklch(0.45 0.24 277.023)', 0.3); // Also works with oklch
```

### Darken

```typescript
import { darken } from '@pie-element/theming-daisyui';

darken('#3F51B5', 0.3); // '#283593' (30% darker)
darken('oklch(0.45 0.24 277.023)', 0.3); // Also works with oklch
```

### RGBA

```typescript
import { rgba } from '@pie-element/theming-daisyui';

rgba('#3F51B5', 0.5); // 'rgba(63, 81, 181, 0.5)'
rgba('oklch(0.45 0.24 277.023)', 0.5); // Also works with oklch
```

### Mix Colors

```typescript
import { mix } from '@pie-element/theming-daisyui';

mix('#FF0000', '#0000FF', 0.5); // '#800080' (purple, 50/50 mix)
mix('#FF0000', '#0000FF', 0.75); // '#BF0040' (more red)
```

## React Hooks

### useDaisyUiTheme

Extract DaisyUI theme with automatic updates:

```typescript
import { useDaisyUiTheme } from '@pie-element/theming-daisyui';

function MyComponent() {
  const daisyTheme = useDaisyUiTheme(); // 12 base colors

  return <div style={{ color: daisyTheme?.primary }}>Hello</div>;
}
```

### useDaisyUiPieTheme

Get extended PIE theme with automatic updates:

```typescript
import { useDaisyUiPieTheme } from '@pie-element/theming-daisyui';

function MyComponent() {
  const pieTheme = useDaisyUiPieTheme(); // 45+ colors

  return (
    <div>
      <div>Primary: {pieTheme?.primary}</div>
      <div>Primary Light: {pieTheme?.['primary-light']}</div>
      <div>Correct Icon: {pieTheme?.['correct-icon']}</div>
    </div>
  );
}
```

## Complete Example

### Svelte Component

```svelte
<script>
  import { onMount } from 'svelte';
  import { extractDaisyUiTheme, watchDaisyUiTheme, daisyUiToPieTheme } from '@pie-element/theming-daisyui';
  import { generateCssVariables, cssVariablesToStyleString } from '@pie-element/theming';

  let currentTheme = $state(undefined);
  let cssVars = $derived(
    currentTheme ? cssVariablesToStyleString(generateCssVariables(currentTheme)) : ''
  );

  onMount(() => {
    // Extract initial theme
    const daisyTheme = extractDaisyUiTheme();
    if (daisyTheme) {
      currentTheme = daisyUiToPieTheme(daisyTheme);
    }

    // Watch for changes
    return watchDaisyUiTheme((newDaisyTheme) => {
      if (newDaisyTheme) {
        currentTheme = daisyUiToPieTheme(newDaisyTheme);
      }
    });
  });
</script>

<div class="pie-container" style={cssVars}>
  <slot />
</div>
```

### React Component

```typescript
import { useState, useEffect } from 'react';
import { useDaisyUiPieTheme } from '@pie-element/theming-daisyui';
import { generateCssVariables, cssVariablesToStyleString } from '@pie-element/theming';

export function PieThemeContainer({ children }) {
  const pieTheme = useDaisyUiPieTheme();
  const [styleString, setStyleString] = useState('');

  useEffect(() => {
    if (pieTheme) {
      const cssVars = generateCssVariables(pieTheme);
      setStyleString(cssVariablesToStyleString(cssVars));
    }
  }, [pieTheme]);

  return (
    <div className="pie-container" style={{ cssText: styleString }}>
      {children}
    </div>
  );
}
```

## DaisyUI Theme Examples

### Light Theme

```html
<html data-theme="light">
```

Typical colors:
- Base content: `#000000` (black text)
- Base 100: `#FFFFFF` (white background)
- Primary: `oklch(0.45 0.24 277.023)` (indigo)
- Success: `oklch(0.65 0.16 160)` (green)

### Dark Theme

```html
<html data-theme="dark">
```

Typical colors:
- Base content: `#FFFFFF` (white text)
- Base 100: `#1D232A` (dark background)
- Primary: `oklch(0.65 0.24 277.023)` (lighter indigo)
- Success: `oklch(0.75 0.16 160)` (lighter green)

### Custom Theme

Define in Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: 'oklch(0.45 0.24 277.023)',
          secondary: 'oklch(0.69 0.19 342.55)',
          accent: 'oklch(0.76 0.18 183.61)',
          neutral: 'oklch(0.32 0.03 256.80)',
          'base-100': 'oklch(1 0 0)',
          info: 'oklch(0.70 0.14 231.60)',
          success: 'oklch(0.65 0.16 160)',
          warning: 'oklch(0.84 0.14 83.87)',
          error: 'oklch(0.65 0.24 27.33)',
        },
      },
    ],
  },
};
```

```html
<html data-theme="mytheme">
```

## Troubleshooting

### Colors Not Extracting

1. **Check DaisyUI is loaded:**
   ```javascript
   console.log(getComputedStyle(document.documentElement).getPropertyValue('--p'));
   ```
   Should output a color value if DaisyUI is active.

2. **Verify data-theme:**
   ```javascript
   console.log(document.documentElement.getAttribute('data-theme'));
   ```

3. **Test extraction manually:**
   ```javascript
   const theme = extractDaisyUiTheme();
   console.log('Extracted:', theme);
   ```

### OKLCH Conversion Issues

If colors look wrong, check if OKLCH values are valid:

```javascript
import { oklchToRgb } from '@pie-element/theming-daisyui';

const rgb = oklchToRgb('oklch(0.45 0.24 277.023)');
console.log('RGB:', rgb); // Should be { r: 63, g: 81, b: 181 }
```

### Theme Not Updating

Ensure watcher is set up before theme changes:

```javascript
import { watchDaisyUiTheme } from '@pie-element/theming-daisyui';

const unwatch = watchDaisyUiTheme((theme) => {
  console.log('Theme changed:', theme);
});

// Now change theme
document.documentElement.setAttribute('data-theme', 'dark');
```

## Next Steps

- [**Color System**](./02-color-system.md) - Learn about all 45+ colors
- [**Creating Elements**](./06-creating-elements.md) - Build DaisyUI-aware elements
- [**API Reference**](./08-api-reference.md) - Complete API documentation
