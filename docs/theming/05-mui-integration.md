# Material-UI Integration

Complete guide to using PIE elements with Material-UI themes.

## Overview

The `@pie-element/theming-mui` package provides:
- Theme extraction from MUI Theme objects
- Conversion to extended PIE theme (12 → 45+ colors)
- Reverse conversion (PIE → MUI ThemeOptions)
- React hooks that automatically update with MUI theme
- Integration with MUI's ThemeProvider

## Installation

```bash
npm install @pie-element/theming @pie-element/theming-mui
```

**Peer dependencies** (should already be installed):
```bash
npm install @mui/material @emotion/react @emotion/styled
```

## Basic Usage

### Extract MUI Theme

```typescript
import { useTheme } from '@mui/material/styles';
import { extractMuiTheme } from '@pie-element/theming-mui';

function MyComponent() {
  const muiTheme = useTheme();
  const pieBaseTheme = extractMuiTheme(muiTheme);

  console.log(pieBaseTheme);
  // {
  //   primary: '#3F51B5',
  //   'primary-light': '#9FA8DA',
  //   'primary-dark': '#283593',
  //   success: '#4CAF50',
  //   ...
  // }
}
```

### Convert to Extended PIE Theme

```typescript
import { muiToPieTheme } from '@pie-element/theming-mui';

const pieBaseTheme = extractMuiTheme(muiTheme);
const pieExtendedTheme = muiToPieTheme(pieBaseTheme);

console.log(Object.keys(pieExtendedTheme).length); // 45+
```

### Apply to PIE Elements

```typescript
import { generateCssVariables, cssVariablesToStyleString } from '@pie-element/theming';

function MyComponent() {
  const pieTheme = useMuiPieTheme();
  const cssVars = generateCssVariables(pieTheme);
  const styleString = cssVariablesToStyleString(cssVars);

  return (
    <div style={{ cssText: styleString }}>
      {/* PIE elements here */}
    </div>
  );
}
```

## React Hooks

### useMuiTheme

Extract base PIE theme from MUI theme context:

```typescript
import { useMuiTheme } from '@pie-element/theming-mui';

function MyComponent() {
  const pieTheme = useMuiTheme(); // 12-16 colors from MUI palette

  return (
    <div>
      <div>Primary: {pieTheme.primary}</div>
      <div>Success: {pieTheme.success}</div>
    </div>
  );
}
```

### useMuiPieTheme

Get extended PIE theme with automatic updates:

```typescript
import { useMuiPieTheme } from '@pie-element/theming-mui';

function MyComponent() {
  const pieTheme = useMuiPieTheme(); // 45+ colors

  return (
    <div>
      <div>Primary: {pieTheme.primary}</div>
      <div>Primary Light: {pieTheme['primary-light']}</div>
      <div>Correct Icon: {pieTheme['correct-icon']}</div>
    </div>
  );
}
```

### useMuiPieThemes

Get both base and extended themes:

```typescript
import { useMuiPieThemes } from '@pie-element/theming-mui';

function MyComponent() {
  const { baseTheme, extendedTheme } = useMuiPieThemes();

  return (
    <div>
      <h3>Base MUI Colors</h3>
      <div>Primary: {baseTheme.primary}</div>

      <h3>Derived PIE Colors</h3>
      <div>Primary Light: {extendedTheme['primary-light']}</div>
      <div>Focus Checked: {extendedTheme['focus-checked']}</div>
    </div>
  );
}
```

## Theme Extraction Details

### MUI Palette Mapping

The adapter extracts colors from MUI's palette:

| MUI Palette | PIE Theme Key | Notes |
|-------------|---------------|-------|
| `palette.primary.main` | `primary` | Primary brand color |
| `palette.primary.light` | `primary-light` | Light variant (MUI provides) |
| `palette.primary.dark` | `primary-dark` | Dark variant (MUI provides) |
| `palette.secondary.main` | `secondary` | Secondary brand color |
| `palette.secondary.light` | `secondary-light` | Light variant |
| `palette.secondary.dark` | `secondary-dark` | Dark variant |
| `palette.success.main` | `success` | Correct answers |
| `palette.error.main` | `error` | Incorrect answers |
| `palette.warning.main` | `warning` | Missing answers |
| `palette.info.main` | `info` | Info messages |
| `palette.text.primary` | `base-content` | Text color |
| `palette.background.default` | `base-100` | Background |
| `palette.background.paper` | `base-200` | Secondary bg |
| `palette.grey[500]` | `neutral` | Neutral gray |
| `palette.grey[100]` | `base-300` | Tertiary bg |

### Color Derivation

Extended colors are derived from base colors:

```typescript
// Primary variants (if not provided by MUI)
if (muiTheme.primary && !pieTheme['primary-light']) {
  pieTheme['primary-light'] = lighten(muiTheme.primary, 0.3);
}
if (muiTheme.primary && !pieTheme['primary-dark']) {
  pieTheme['primary-dark'] = darken(muiTheme.primary, 0.3);
}
pieTheme['faded-primary'] = rgba(muiTheme.primary, 0.15);

// Correct (success) variants
if (muiTheme.success) {
  pieTheme['correct-secondary'] = rgba(muiTheme.success, 0.1);
  pieTheme['correct-tertiary'] = darken(muiTheme.success, 0.1);
  pieTheme['correct-icon'] = darken(muiTheme.success, 0.2);
}

// Incorrect (error) variants
if (muiTheme.error) {
  pieTheme.incorrect = muiTheme.error;
  pieTheme['incorrect-secondary'] = rgba(muiTheme.error, 0.1);
  pieTheme['incorrect-icon'] = darken(muiTheme.error, 0.2);
}

// ... and 20+ more derivations
```

## Reverse Conversion (PIE → MUI)

Convert PIE theme to MUI ThemeOptions:

### piePaletteToMui

```typescript
import { piePaletteToMui } from '@pie-element/theming-mui';

const pieTheme = {
  primary: '#3F51B5',
  secondary: '#FF1493',
  success: '#4CAF50',
  error: '#FF9800',
  'base-content': '#000000',
  'base-100': '#FFFFFF',
};

const muiThemeOptions = piePaletteToMui(pieTheme);
console.log(muiThemeOptions);
// {
//   palette: {
//     primary: { main: '#3F51B5' },
//     secondary: { main: '#FF1493' },
//     success: { main: '#4CAF50' },
//     error: { main: '#FF9800' },
//     text: { primary: '#000000' },
//     background: { default: '#FFFFFF' },
//   }
// }
```

### createMuiThemeFromPie

Create complete MUI theme from PIE theme:

```typescript
import { createMuiThemeFromPie } from '@pie-element/theming-mui';
import { createTheme } from '@mui/material/styles';

const pieTheme = { /* ... */ };
const muiThemeOptions = createMuiThemeFromPie(pieTheme);
const muiTheme = createTheme(muiThemeOptions);
```

## Complete Examples

### React with ThemeProvider

```typescript
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useMuiPieTheme } from '@pie-element/theming-mui';
import { generateCssVariables, cssVariablesToStyleString } from '@pie-element/theming';

const muiTheme = createTheme({
  palette: {
    primary: { main: '#3F51B5' },
    secondary: { main: '#FF1493' },
  },
});

function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <PieElementContainer />
    </ThemeProvider>
  );
}

function PieElementContainer() {
  const pieTheme = useMuiPieTheme();
  const cssVars = generateCssVariables(pieTheme);
  const styleString = cssVariablesToStyleString(cssVars);

  return (
    <div style={{ cssText: styleString }}>
      {/* PIE elements here */}
    </div>
  );
}
```

### Dynamic Theme Switching

```typescript
import { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useMuiPieTheme } from '@pie-element/theming-mui';
import { generateCssVariables, injectCssVariables } from '@pie-element/theming';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#3F51B5' },
    background: { default: '#FFFFFF' },
    text: { primary: '#000000' },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#9FA8DA' },
    background: { default: '#121212' },
    text: { primary: '#FFFFFF' },
  },
});

function App() {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <button onClick={() => setIsDark(!isDark)}>
        Toggle {isDark ? 'Light' : 'Dark'}
      </button>
      <PieThemeAdapter />
    </ThemeProvider>
  );
}

function PieThemeAdapter() {
  const pieTheme = useMuiPieTheme();

  useEffect(() => {
    const cssVars = generateCssVariables(pieTheme);
    injectCssVariables(cssVars);
  }, [pieTheme]);

  return <YourContent />;
}
```

### Nested Themes

Apply different themes to different parts of the page:

```typescript
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useMuiPieTheme } from '@pie-element/theming-mui';
import { generateCssVariables, cssVariablesToStyleString } from '@pie-element/theming';

const theme1 = createTheme({ palette: { primary: { main: '#3F51B5' } } });
const theme2 = createTheme({ palette: { primary: { main: '#F44336' } } });

function App() {
  return (
    <>
      <ThemeProvider theme={theme1}>
        <PieSection title="Section 1" />
      </ThemeProvider>

      <ThemeProvider theme={theme2}>
        <PieSection title="Section 2" />
      </ThemeProvider>
    </>
  );
}

function PieSection({ title }) {
  const pieTheme = useMuiPieTheme();
  const styleString = cssVariablesToStyleString(generateCssVariables(pieTheme));

  return (
    <div style={{ cssText: styleString }}>
      <h2>{title}</h2>
      {/* PIE elements inherit this section's theme */}
    </div>
  );
}
```

## MUI Theme Customization

### Custom Palette Colors

```typescript
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3F51B5',
      light: '#9FA8DA',
      dark: '#283593',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF1493',
      light: '#FF80AB',
      dark: '#C51162',
    },
    success: {
      main: '#4CAF50',
    },
    error: {
      main: '#FF9800',
    },
    warning: {
      main: '#FFC107',
    },
    info: {
      main: '#2196F3',
    },
    grey: {
      100: '#F5F5F5',
      500: '#9E9E9E',
      900: '#212121',
    },
  },
});
```

### Dark Mode

```typescript
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90CAF9', // Lighter for dark backgrounds
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
});
```

### Custom Colors

Add custom colors to MUI palette:

```typescript
declare module '@mui/material/styles' {
  interface Palette {
    correct: Palette['primary'];
    incorrect: Palette['error'];
  }
  interface PaletteOptions {
    correct?: PaletteOptions['primary'];
    incorrect?: PaletteOptions['error'];
  }
}

const theme = createTheme({
  palette: {
    correct: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
    },
    incorrect: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
  },
});
```

## Integration with Existing MUI Apps

### Alongside Existing Themes

PIE theming works alongside existing MUI themes:

```typescript
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useMuiPieTheme } from '@pie-element/theming-mui';

// Your existing MUI theme
const myExistingTheme = createTheme({
  /* ... your existing config ... */
});

function App() {
  return (
    <ThemeProvider theme={myExistingTheme}>
      {/* Your existing MUI components work normally */}
      <Button variant="contained">MUI Button</Button>

      {/* PIE elements use extracted theme */}
      <PieElementWrapper>
        <pie-element-player />
      </PieElementWrapper>
    </ThemeProvider>
  );
}

function PieElementWrapper({ children }) {
  const pieTheme = useMuiPieTheme();
  const styleString = cssVariablesToStyleString(generateCssVariables(pieTheme));

  return <div style={{ cssText: styleString }}>{children}</div>;
}
```

### Global CSS Variables

Inject PIE CSS variables globally:

```typescript
import { useEffect } from 'react';
import { useMuiPieTheme } from '@pie-element/theming-mui';
import { generateCssVariables, injectCssVariables } from '@pie-element/theming';

function GlobalPieTheme() {
  const pieTheme = useMuiPieTheme();

  useEffect(() => {
    const cssVars = generateCssVariables(pieTheme);
    injectCssVariables(cssVars); // Injects to document.documentElement
  }, [pieTheme]);

  return null; // No visual component
}

function App() {
  return (
    <ThemeProvider theme={myTheme}>
      <GlobalPieTheme />
      {/* All PIE elements now have theme */}
    </ThemeProvider>
  );
}
```

## Troubleshooting

### Theme Not Extracting

Ensure component is inside `<ThemeProvider>`:

```typescript
import { ThemeProvider } from '@mui/material/styles';

// ❌ Wrong - no ThemeProvider
function App() {
  const pieTheme = useMuiPieTheme(); // Will use default theme
  // ...
}

// ✅ Correct - inside ThemeProvider
function App() {
  return (
    <ThemeProvider theme={myTheme}>
      <MyComponent /> {/* useMuiPieTheme works here */}
    </ThemeProvider>
  );
}
```

### Colors Not Updating

The hooks automatically update when MUI theme changes. If not updating:

1. **Check ThemeProvider rerenders:**
   ```typescript
   console.log('Theme object identity:', muiTheme);
   ```

2. **Verify hook is called:**
   ```typescript
   const pieTheme = useMuiPieTheme();
   console.log('PIE theme:', pieTheme);
   ```

3. **Check CSS variable injection:**
   ```typescript
   useEffect(() => {
     console.log('Injecting CSS vars');
     injectCssVariables(generateCssVariables(pieTheme));
   }, [pieTheme]);
   ```

### Missing Colors

If some PIE colors are undefined, MUI theme may not provide all colors:

```typescript
const pieTheme = useMuiPieTheme();
console.log('Missing:', Object.entries(pieTheme).filter(([k, v]) => !v));
```

Solution: Provide default values or use PIE defaults:

```typescript
import { PIE_COLOR_DEFAULTS } from '@pie-element/theming';

const completeTheme = {
  ...PIE_COLOR_DEFAULTS,
  ...pieTheme,
};
```

## Best Practices

1. **Use hooks inside ThemeProvider:** All hooks require MUI ThemeProvider context

2. **Inject globally when possible:** Reduces duplication and improves performance

3. **Test with dark mode:** MUI's dark mode may need adjusted derivation amounts

4. **Override specific colors:** If derived colors don't match your design, override them

5. **Keep MUI theme as source of truth:** Let adapter derive PIE colors from MUI palette

## Next Steps

- [**Color System**](./02-color-system.md) - Learn about all 45+ colors
- [**Creating Elements**](./06-creating-elements.md) - Build MUI-aware elements
- [**API Reference**](./08-api-reference.md) - Complete API documentation
