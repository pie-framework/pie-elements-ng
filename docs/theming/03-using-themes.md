# Using Themes in Applications

How to integrate PIE element theming in your application.

## Quick Start

### 1. Install Packages

Choose the adapter for your UI framework:

```bash
# For DaisyUI applications
npm install @pie-element/theming @pie-element/theming-daisyui

# For Material-UI applications
npm install @pie-element/theming @pie-element/theming-mui

# For custom themes (no adapter needed)
npm install @pie-element/theming
```

### 2. Extract and Convert Theme

#### DaisyUI

```typescript
import { extractDaisyUiTheme, daisyUiToPieTheme } from '@pie-element/theming-daisyui';
import { generateCssVariables, cssVariablesToStyleString } from '@pie-element/theming';

// Extract current DaisyUI theme from DOM
const daisyTheme = extractDaisyUiTheme();

// Convert to extended PIE theme (12 → 45+ colors)
const pieTheme = daisyUiToPieTheme(daisyTheme);

// Generate CSS variables
const cssVars = generateCssVariables(pieTheme);
const styleString = cssVariablesToStyleString(cssVars);
```

#### Material-UI

```typescript
import { useTheme } from '@mui/material/styles';
import { useMuiPieTheme } from '@pie-element/theming-mui';
import { generateCssVariables, cssVariablesToStyleString } from '@pie-element/theming';

function MyComponent() {
  // Extract PIE theme from MUI theme context
  const pieTheme = useMuiPieTheme();

  // Generate CSS variables
  const cssVars = generateCssVariables(pieTheme);
  const styleString = cssVariablesToStyleString(cssVars);

  // Use in component...
}
```

### 3. Apply to PIE Elements

Apply CSS variables to a container element wrapping your PIE elements:

```html
<div class="pie-container" style="{styleString}">
  <pie-element-player element-name="multiple-choice" />
  <pie-element-player element-name="text-entry" />
</div>
```

All PIE elements inside will inherit the CSS variables.

## Advanced Usage

### React Context Provider

For React applications, use the `PieThemeProvider` to manage theme globally:

```typescript
import { PieThemeProvider } from '@pie-element/theming';

function App() {
  const config = {
    theme: myPieTheme,
    injectGlobally: true, // Inject CSS vars to document root
    muiOptions: {
      useThemePalette: false,
      injectCssVariables: true,
    },
  };

  return (
    <PieThemeProvider config={config}>
      <YourApp />
    </PieThemeProvider>
  );
}
```

Access theme anywhere in your component tree:

```typescript
import { usePieTheme, usePieThemeVariables, usePieThemeStyle } from '@pie-element/theming';

function MyComponent() {
  const { theme, setTheme } = usePieTheme();
  const cssVariables = usePieThemeVariables(); // Record<string, string>
  const styleObject = usePieThemeStyle();      // React.CSSProperties

  return (
    <div style={styleObject}>
      {/* PIE elements here */}
    </div>
  );
}
```

### Runtime Theme Switching

#### DaisyUI

Watch for DaisyUI theme changes (when `data-theme` attribute changes):

```typescript
import { watchDaisyUiTheme, daisyUiToPieTheme } from '@pie-element/theming-daisyui';
import { generateCssVariables, injectCssVariables } from '@pie-element/theming';

// Watch for theme changes
const unwatch = watchDaisyUiTheme((newDaisyTheme) => {
  if (newDaisyTheme) {
    const pieTheme = daisyUiToPieTheme(newDaisyTheme);
    const cssVars = generateCssVariables(pieTheme);
    injectCssVariables(cssVars); // Update document root
  }
});

// Later: stop watching
unwatch();
```

Example in React/Svelte:

```typescript
import { onMount } from 'svelte';
import { watchDaisyUiTheme, daisyUiToPieTheme } from '@pie-element/theming-daisyui';
import { generateCssVariables, injectCssVariables } from '@pie-element/theming';

let currentTheme = $state<PieThemeExtended | undefined>(undefined);

onMount(() => {
  // Extract initial theme
  const daisyTheme = extractDaisyUiTheme();
  if (daisyTheme) {
    currentTheme = daisyUiToPieTheme(daisyTheme);
  }

  // Watch for changes
  const unwatch = watchDaisyUiTheme((newDaisyTheme) => {
    if (newDaisyTheme) {
      currentTheme = daisyUiToPieTheme(newDaisyTheme);
    }
  });

  return unwatch; // Cleanup
});
```

#### Material-UI

MUI themes update automatically through `useTheme()` hook:

```typescript
import { useMuiPieTheme } from '@pie-element/theming-mui';
import { generateCssVariables, injectCssVariables } from '@pie-element/theming';
import { useEffect } from 'react';

function ThemeWatcher() {
  const pieTheme = useMuiPieTheme(); // Automatically updates with MUI theme

  useEffect(() => {
    const cssVars = generateCssVariables(pieTheme);
    injectCssVariables(cssVars);
  }, [pieTheme]);

  return null;
}
```

### Manual Theme Injection

Inject theme at any DOM level:

```typescript
import { generateCssVariables, injectCssVariables } from '@pie-element/theming';

const myTheme = {
  primary: '#3F51B5',
  success: '#4CAF50',
  error: '#FF9800',
  'base-content': '#000000',
  'base-100': '#FFFFFF',
  // ...
};

const cssVars = generateCssVariables(myTheme);

// Inject to document root (affects entire page)
injectCssVariables(cssVars);

// Inject to specific element (affects only that subtree)
const container = document.querySelector('.pie-container');
injectCssVariables(cssVars, container);
```

### Custom CSS Mappings

Override default CSS variable mappings:

```typescript
import { generateCssVariables, type CssVariableMapping } from '@pie-element/theming';

const customMappings: CssVariableMapping[] = [
  { variableName: '--my-text-color', themeKey: 'base-content', fallback: 'black' },
  { variableName: '--my-bg-color', themeKey: 'base-100', fallback: 'white' },
  // ...
];

const cssVars = generateCssVariables(myTheme, { mappings: customMappings });
```

## Framework-Specific Examples

### Svelte with DaisyUI

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
    const daisyTheme = extractDaisyUiTheme();
    if (daisyTheme) {
      currentTheme = daisyUiToPieTheme(daisyTheme);
    }

    return watchDaisyUiTheme((newDaisyTheme) => {
      if (newDaisyTheme) {
        currentTheme = daisyUiToPieTheme(newDaisyTheme);
      }
    });
  });
</script>

<div class="pie-container" style={cssVars}>
  <!-- PIE elements here -->
</div>
```

### React with Material-UI

```typescript
import { ThemeProvider } from '@mui/material/styles';
import { PieThemeProvider } from '@pie-element/theming';
import { useMuiPieTheme } from '@pie-element/theming-mui';

function App() {
  return (
    <ThemeProvider theme={myMuiTheme}>
      <PieThemeAdapter />
    </ThemeProvider>
  );
}

function PieThemeAdapter() {
  const pieTheme = useMuiPieTheme();

  return (
    <PieThemeProvider config={{ theme: pieTheme, injectGlobally: true }}>
      <MyContent />
    </PieThemeProvider>
  );
}
```

### Vue with Custom Theme

```vue
<template>
  <div class="pie-container" :style="cssVarsStyle">
    <!-- PIE elements -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { generateCssVariables, cssVariablesToStyleString } from '@pie-element/theming';

const theme = ref({
  primary: '#3F51B5',
  success: '#4CAF50',
  // ...
});

const cssVarsStyle = computed(() => {
  const cssVars = generateCssVariables(theme.value);
  return cssVariablesToStyleString(cssVars);
});

function switchToDark() {
  theme.value = {
    'base-content': '#FFFFFF',
    'base-100': '#1A1A1A',
    // ...
  };
}
</script>
```

## Testing Theme Integration

Verify theme is working correctly:

```javascript
// In browser console
const container = document.querySelector('.pie-container');
const style = getComputedStyle(container);

// Check CSS variables
const pieVars = Object.keys(style)
  .filter(key => key.startsWith('--pie-'))
  .map(key => `${key}: ${style.getPropertyValue(key)}`);

console.log(`Found ${pieVars.length} PIE variables:`, pieVars);

// Check specific variable
console.log('Text color:', style.getPropertyValue('--pie-text'));
console.log('Background:', style.getPropertyValue('--pie-background'));
```

## Troubleshooting

### Colors Not Updating

1. **Check CSS variable injection:**
   ```javascript
   console.log(getComputedStyle(document.documentElement).getPropertyValue('--pie-text'));
   ```

2. **Verify theme extraction:**
   ```javascript
   const theme = extractDaisyUiTheme();
   console.log('Extracted theme:', theme);
   ```

3. **Check element inheritance:**
   CSS variables must be set on an ancestor element of PIE elements.

### Adapter Not Finding Theme

**DaisyUI**: Ensure `data-theme` attribute is set:
```html
<html data-theme="light">
```

**MUI**: Ensure component is inside `<ThemeProvider>`:
```typescript
<ThemeProvider theme={muiTheme}>
  <YourComponent />
</ThemeProvider>
```

### Colors Look Wrong

1. **Check color space:** DaisyUI v4+ uses oklch - ensure you're using the latest adapter version
2. **Verify derivation:** Print extended theme to see derived colors
3. **Test with defaults:** Try using default PIE colors to isolate the issue

## Next Steps

- [**DaisyUI Integration**](./04-daisyui-integration.md) - DaisyUI-specific guide
- [**MUI Integration**](./05-mui-integration.md) - Material-UI-specific guide
- [**Custom Themes**](./07-custom-themes.md) - Create your own themes
