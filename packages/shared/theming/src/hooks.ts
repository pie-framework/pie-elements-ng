import { useContext, useMemo } from 'react';
import type { Theme } from '@mui/material/styles';
import { PieThemeContext } from './provider.js';
import type { PieThemeExtended, ThemeContextValue } from './types.js';
import { cssVariablesToReactStyle } from './css-variables.js';

/**
 * Hook to access the PIE theme context
 * Provides theme state, CSS variables, MUI theme, and update function
 *
 * @returns Theme context value
 * @throws Error if used outside PieThemeProvider
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { theme, cssVariables, muiTheme, setTheme } = usePieTheme();
 *
 *   const handleThemeChange = () => {
 *     setTheme({ ...theme, primary: '#FF0000' });
 *   };
 *
 *   return <div style={cssVariablesToReactStyle(cssVariables)}>...</div>;
 * }
 * ```
 */
export function usePieTheme(): ThemeContextValue {
  const context = useContext(PieThemeContext);
  if (!context) {
    throw new Error('usePieTheme must be used within a PieThemeProvider');
  }
  return context;
}

/**
 * Hook to get CSS variables from current theme
 * Returns a record of CSS variable names to values
 *
 * @returns CSS variables object
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const cssVars = usePieThemeVariables();
 *   // { '--pie-text': 'black', '--pie-primary': '#3F51B5', ... }
 *
 *   return <div style={cssVariablesToReactStyle(cssVars)}>...</div>;
 * }
 * ```
 */
export function usePieThemeVariables(): Record<string, string> {
  const { cssVariables } = usePieTheme();
  return cssVariables;
}

/**
 * Hook to get CSS variables as a React style object
 * Ready for use in inline styles
 *
 * @returns React CSSProperties object with CSS variables
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const style = usePieThemeStyle();
 *   return <div style={style}>...</div>;
 * }
 * ```
 */
export function usePieThemeStyle(): React.CSSProperties {
  const cssVariables = usePieThemeVariables();
  return useMemo(() => cssVariablesToReactStyle(cssVariables), [cssVariables]);
}

/**
 * Hook to get the current PIE theme colors
 * Returns the theme object without CSS variables or MUI theme
 *
 * @returns Current PIE theme
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const theme = usePieThemeColors();
 *   return <div>Primary: {theme.primary}</div>;
 * }
 * ```
 */
export function usePieThemeColors(): Partial<PieThemeExtended> {
  const { theme } = usePieTheme();
  return theme;
}

/**
 * Hook to get the MUI theme
 * Returns the Material-UI theme object
 *
 * @returns MUI Theme
 *
 * @example
 * ```typescript
 * import { styled } from '@mui/material/styles';
 *
 * function MyComponent() {
 *   const muiTheme = usePieMuiTheme();
 *   const spacing = muiTheme.spacing(2); // 16px
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePieMuiTheme(): Theme {
  const { muiTheme } = usePieTheme();
  return muiTheme;
}

/**
 * Hook to update the current theme
 * Returns a function to update the theme
 *
 * @returns Theme update function
 *
 * @example
 * ```typescript
 * function ThemeSwitcher() {
 *   const updateTheme = useSetPieTheme();
 *
 *   const switchToDark = () => {
 *     updateTheme({ 'base-content': '#fff', 'base-100': '#000' });
 *   };
 *
 *   return <button onClick={switchToDark}>Dark Mode</button>;
 * }
 * ```
 */
export function useSetPieTheme(): (theme: Partial<PieThemeExtended>) => void {
  const { setTheme } = usePieTheme();
  return setTheme;
}
