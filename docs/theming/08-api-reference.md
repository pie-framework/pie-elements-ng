# API Reference

Complete API documentation for PIE theming packages.

## @pie-element/theming

Base theming package with framework-agnostic utilities.

### Types

#### PieThemeExtended

Extended theme interface with all 45+ PIE colors.

```typescript
interface PieThemeExtended extends PieTheme {
  // Primary colors
  primary?: string;
  'primary-light'?: string;
  'primary-dark'?: string;
  'faded-primary'?: string;

  // Secondary colors
  secondary?: string;
  'secondary-light'?: string;
  'secondary-dark'?: string;

  // Semantic state colors
  success?: string;
  'correct-secondary'?: string;
  'correct-tertiary'?: string;
  'correct-icon'?: string;

  error?: string;
  incorrect?: string;
  'incorrect-secondary'?: string;
  'incorrect-icon'?: string;

  warning?: string;
  missing?: string;
  'missing-icon'?: string;

  info?: string;

  // UI colors
  disabled?: string;
  'disabled-secondary'?: string;
  border?: string;
  'border-light'?: string;
  'border-dark'?: string;
  'border-gray'?: string;

  // Backgrounds
  'background-dark'?: string;
  'dropdown-background'?: string;
  'secondary-background'?: string;

  // Focus states
  'focus-checked'?: string;
  'focus-checked-border'?: string;
  'focus-unchecked'?: string;
  'focus-unchecked-border'?: string;

  // Accent & tertiary
  accent?: string;
  tertiary?: string;
  'tertiary-light'?: string;

  // Blue-grey palette
  'blue-grey-100'?: string;
  'blue-grey-300'?: string;
  'blue-grey-600'?: string;
  'blue-grey-900'?: string;

  // Base colors (from PieTheme)
  'base-100'?: string;
  'base-200'?: string;
  'base-300'?: string;
  'base-content'?: string;
  neutral?: string;

  // Pure colors
  black?: string;
  white?: string;
}
```

#### CssVariableMapping

Mapping between theme keys and CSS variables.

```typescript
interface CssVariableMapping {
  variableName: string;            // e.g., '--pie-text'
  themeKey: keyof PieThemeExtended; // e.g., 'base-content'
  fallback: string;                 // e.g., 'black'
}
```

### Constants

#### PIE_COLOR_DEFAULTS

All 45+ PIE color default values.

```typescript
const PIE_COLOR_DEFAULTS: {
  readonly TEXT: string;
  readonly DISABLED: string;
  readonly CORRECT: string;
  readonly INCORRECT: string;
  readonly PRIMARY: string;
  // ... 40+ more colors
};
```

#### DEFAULT_CSS_MAPPINGS

Default mappings from theme keys to CSS variables.

```typescript
const DEFAULT_CSS_MAPPINGS: readonly CssVariableMapping[];
```

### Functions

#### generateCssVariables

Generate CSS variables from theme object.

```typescript
function generateCssVariables(
  theme: Partial<PieThemeExtended>,
  options?: {
    prefix?: string;
    mappings?: readonly CssVariableMapping[];
  }
): Record<string, string>;
```

**Parameters:**
- `theme` - Theme object with color values
- `options.prefix` - Optional prefix for variable names (default: none)
- `options.mappings` - Custom mappings (default: DEFAULT_CSS_MAPPINGS)

**Returns:** Object with CSS variable names and values

**Example:**
```typescript
const cssVars = generateCssVariables({
  primary: '#3F51B5',
  success: '#4CAF50',
});
// { '--pie-primary': '#3F51B5', '--pie-correct': '#4CAF50', ... }
```

#### cssVariablesToStyleString

Convert CSS variables object to inline style string.

```typescript
function cssVariablesToStyleString(
  cssVars: Record<string, string>
): string;
```

**Parameters:**
- `cssVars` - Object with CSS variable names and values

**Returns:** Style string suitable for `style` attribute

**Example:**
```typescript
const styleString = cssVariablesToStyleString(cssVars);
// '--pie-primary: #3F51B5; --pie-correct: #4CAF50; ...'

<div style={{ cssText: styleString }}>
```

#### injectCssVariables

Inject CSS variables into DOM element.

```typescript
function injectCssVariables(
  cssVars: Record<string, string>,
  target?: HTMLElement
): void;
```

**Parameters:**
- `cssVars` - Object with CSS variable names and values
- `target` - Target element (default: `document.documentElement`)

**Example:**
```typescript
injectCssVariables(cssVars); // Inject to <html>
injectCssVariables(cssVars, container); // Inject to specific element
```

### React Components

#### PieThemeProvider

Theme provider component for React applications.

```typescript
function PieThemeProvider(props: {
  children: React.ReactNode;
  config: {
    theme: Partial<PieThemeExtended>;
    injectGlobally?: boolean;
    muiOptions?: MuiThemeOptions;
  };
}): JSX.Element;
```

**Props:**
- `children` - Child components
- `config.theme` - Theme object
- `config.injectGlobally` - Inject CSS vars to document root (default: false)
- `config.muiOptions` - MUI theme options (optional)

**Example:**
```typescript
<PieThemeProvider config={{ theme: myTheme, injectGlobally: true }}>
  <App />
</PieThemeProvider>
```

### React Hooks

#### usePieTheme

Access theme context.

```typescript
function usePieTheme(): {
  theme: Partial<PieThemeExtended>;
  cssVariables: Record<string, string>;
  muiTheme?: Theme;
  setTheme: (theme: Partial<PieThemeExtended>) => void;
};
```

**Returns:** Theme context value

#### usePieThemeVariables

Get CSS variables object.

```typescript
function usePieThemeVariables(): Record<string, string>;
```

**Returns:** CSS variables object

#### usePieThemeStyle

Get style object for React components.

```typescript
function usePieThemeStyle(): React.CSSProperties;
```

**Returns:** Style object with CSS variables

## @pie-element/theming-daisyui

DaisyUI theme adapter package.

### Functions

#### extractDaisyUiTheme

Extract DaisyUI theme from DOM.

```typescript
function extractDaisyUiTheme(options?: {
  dataTheme?: string;
  element?: HTMLElement;
}): PieTheme | undefined;
```

**Parameters:**
- `options.dataTheme` - Theme name (uses current if not specified)
- `options.element` - Element to extract from (default: `document.documentElement`)

**Returns:** Base PIE theme with 12 colors

**Example:**
```typescript
const theme = extractDaisyUiTheme();
// { primary: 'oklch(0.45 0.24 277.023)', ... }
```

#### daisyUiToPieTheme

Convert DaisyUI theme to extended PIE theme.

```typescript
function daisyUiToPieTheme(
  daisyTheme: PieTheme
): PieThemeExtended;
```

**Parameters:**
- `daisyTheme` - Base theme with 12 colors

**Returns:** Extended theme with 45+ colors

**Example:**
```typescript
const baseTheme = extractDaisyUiTheme();
const extendedTheme = daisyUiToPieTheme(baseTheme);
```

#### watchDaisyUiTheme

Watch for DaisyUI theme changes.

```typescript
function watchDaisyUiTheme(
  callback: (theme: PieTheme | undefined) => void,
  options?: {
    element?: HTMLElement;
  }
): () => void;
```

**Parameters:**
- `callback` - Called when theme changes
- `options.element` - Element to watch (default: `document.documentElement`)

**Returns:** Cleanup function to stop watching

**Example:**
```typescript
const unwatch = watchDaisyUiTheme((newTheme) => {
  console.log('Theme changed:', newTheme);
});

// Later: stop watching
unwatch();
```

### Color Utilities

#### lighten

Lighten a color by given amount.

```typescript
function lighten(color: string, amount: number): string;
```

**Parameters:**
- `color` - Color string (hex, rgb, rgba, or oklch)
- `amount` - Amount to lighten (0-1)

**Returns:** Lightened color as hex string

**Example:**
```typescript
lighten('#3F51B5', 0.3); // '#9FA8DA'
lighten('oklch(0.45 0.24 277.023)', 0.3); // Works with oklch
```

#### darken

Darken a color by given amount.

```typescript
function darken(color: string, amount: number): string;
```

**Parameters:**
- `color` - Color string (hex, rgb, rgba, or oklch)
- `amount` - Amount to darken (0-1)

**Returns:** Darkened color as hex string

**Example:**
```typescript
darken('#3F51B5', 0.3); // '#283593'
```

#### rgba

Create rgba color with alpha transparency.

```typescript
function rgba(color: string, alpha: number): string;
```

**Parameters:**
- `color` - Color string (hex, rgb, or oklch)
- `alpha` - Alpha value (0-1)

**Returns:** RGBA color string

**Example:**
```typescript
rgba('#3F51B5', 0.5); // 'rgba(63, 81, 181, 0.5)'
```

#### mix

Mix two colors.

```typescript
function mix(
  color1: string,
  color2: string,
  weight?: number
): string;
```

**Parameters:**
- `color1` - First color
- `color2` - Second color
- `weight` - Weight of first color (0-1, default: 0.5)

**Returns:** Mixed color as hex string

**Example:**
```typescript
mix('#FF0000', '#0000FF', 0.5); // '#800080' (purple)
```

#### oklchToRgb

Convert OKLCH color to RGB.

```typescript
function oklchToRgb(
  oklch: string
): { r: number; g: number; b: number } | null;
```

**Parameters:**
- `oklch` - OKLCH color string (e.g., 'oklch(0.45 0.24 277.023)')

**Returns:** RGB object or null if invalid

### React Hooks

#### useDaisyUiTheme

Extract DaisyUI theme with automatic updates.

```typescript
function useDaisyUiTheme(): PieTheme | undefined;
```

**Returns:** Base PIE theme (12 colors)

#### useDaisyUiPieTheme

Get extended PIE theme with automatic updates.

```typescript
function useDaisyUiPieTheme(): PieThemeExtended | undefined;
```

**Returns:** Extended PIE theme (45+ colors)

## @pie-element/theming-mui

Material-UI theme adapter package.

### Functions

#### extractMuiTheme

Extract PIE theme from MUI Theme object.

```typescript
function extractMuiTheme(
  muiTheme: Theme
): Partial<PieThemeExtended>;
```

**Parameters:**
- `muiTheme` - MUI Theme object

**Returns:** Base PIE theme (12-16 colors)

**Example:**
```typescript
import { useTheme } from '@mui/material/styles';

const muiTheme = useTheme();
const pieTheme = extractMuiTheme(muiTheme);
```

#### muiToPieTheme

Convert MUI theme to extended PIE theme.

```typescript
function muiToPieTheme(
  muiTheme: Partial<PieThemeExtended>
): PieThemeExtended;
```

**Parameters:**
- `muiTheme` - Base MUI theme

**Returns:** Extended PIE theme (45+ colors)

#### piePaletteToMui

Convert PIE theme to MUI ThemeOptions.

```typescript
function piePaletteToMui(
  pieTheme: Partial<PieThemeExtended>
): ThemeOptions;
```

**Parameters:**
- `pieTheme` - PIE theme object

**Returns:** MUI ThemeOptions for `createTheme()`

**Example:**
```typescript
const muiOptions = piePaletteToMui(pieTheme);
const muiTheme = createTheme(muiOptions);
```

#### createMuiThemeFromPie

Create complete MUI theme from PIE theme.

```typescript
function createMuiThemeFromPie(
  pieTheme: Partial<PieThemeExtended>
): ThemeOptions;
```

**Parameters:**
- `pieTheme` - PIE theme object

**Returns:** Complete MUI ThemeOptions

### React Hooks

#### useMuiTheme

Extract base PIE theme from MUI theme context.

```typescript
function useMuiTheme(): Partial<PieThemeExtended>;
```

**Returns:** Base PIE theme (12-16 colors)

#### useMuiPieTheme

Get extended PIE theme from MUI theme context.

```typescript
function useMuiPieTheme(): PieThemeExtended;
```

**Returns:** Extended PIE theme (45+ colors)

#### useMuiPieThemes

Get both base and extended themes.

```typescript
function useMuiPieThemes(): {
  baseTheme: Partial<PieThemeExtended>;
  extendedTheme: PieThemeExtended;
};
```

**Returns:** Object with both themes

## Color System (@pie-lib/render-ui)

The `color` object from `@pie-lib/render-ui` provides access to all PIE colors via CSS variables.

### Usage

```typescript
import { color } from '@pie-lib/render-ui';

const Component = styled('div')({
  color: color.text(),
  backgroundColor: color.background(),
  border: `1px solid ${color.border()}`,
});
```

### All Color Functions

See [Color System](./02-color-system.md) for complete reference of 45+ color functions.

## Type Reference

### PieTheme

Base theme interface (from `@pie-element/shared-types`):

```typescript
interface PieTheme {
  primary?: string;
  secondary?: string;
  accent?: string;
  neutral?: string;
  success?: string;
  error?: string;
  warning?: string;
  info?: string;
  'base-100'?: string;
  'base-200'?: string;
  'base-300'?: string;
  'base-content'?: string;
}
```

### Theme

MUI Theme object (from `@mui/material/styles`):

```typescript
interface Theme {
  palette: Palette;
  typography: Typography;
  spacing: Spacing;
  shape: Shape;
  // ... other MUI theme properties
}
```

## Version Compatibility

- **@pie-element/theming**: 1.0.0+
- **@pie-element/theming-daisyui**: 1.0.0+
- **@pie-element/theming-mui**: 1.0.0+
- **DaisyUI**: 4.0.0+ (for oklch support)
- **Material-UI**: 7.0.0+
- **React**: 18.0.0+

## Migration Guide

### From Manual Theme Extraction

**Before:**
```typescript
// Manual extraction (60+ lines)
const tempDiv = document.createElement('div');
// ... manual extraction logic
```

**After:**
```typescript
import { extractDaisyUiTheme, daisyUiToPieTheme } from '@pie-element/theming-daisyui';

const theme = extractDaisyUiTheme();
const extendedTheme = daisyUiToPieTheme(theme);
```

### From Hardcoded Colors

**Before:**
```typescript
const Button = styled('button')({
  backgroundColor: '#3F51B5',
  color: '#FFFFFF',
});
```

**After:**
```typescript
import { color } from '@pie-lib/render-ui';

const Button = styled('button')({
  backgroundColor: color.primary(),
  color: color.white(),
});
```

## Further Reading

- [Overview](./01-overview.md) - Architecture and concepts
- [Color System](./02-color-system.md) - Complete color reference
- [Using Themes](./03-using-themes.md) - Integration guide
- [Creating Elements](./06-creating-elements.md) - Element development guide
