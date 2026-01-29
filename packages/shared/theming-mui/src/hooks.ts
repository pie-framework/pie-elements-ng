import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import type { PieThemeExtended } from '@pie-element/theming';
import { extractMuiTheme } from './extract';
import { muiToPieTheme } from './convert';

/**
 * Hook to extract PIE theme from current MUI theme context
 * Automatically extracts whenever MUI theme changes
 *
 * @returns Base PIE theme (12-16 colors)
 *
 * @example
 * ```typescript
 * import { ThemeProvider } from '@mui/material/styles';
 *
 * function MyComponent() {
 *   const pieTheme = useMuiTheme();
 *   // pieTheme has primary, secondary, success, error, etc.
 *   console.log('Primary color:', pieTheme.primary);
 * }
 * ```
 */
export function useMuiTheme(): Partial<PieThemeExtended> {
  const muiTheme = useTheme();

  return useMemo(() => extractMuiTheme(muiTheme), [muiTheme]);
}

/**
 * Hook to get extended PIE theme from MUI theme context
 * Extracts and derives all 45+ PIE colors from MUI theme
 *
 * @returns Extended PIE theme (45+ colors)
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const pieTheme = useMuiPieTheme();
 *   // Has all derived colors
 *   return (
 *     <div>
 *       <div>Primary: {pieTheme.primary}</div>
 *       <div>Primary Light: {pieTheme['primary-light']}</div>
 *       <div>Correct Icon: {pieTheme['correct-icon']}</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMuiPieTheme(): PieThemeExtended {
  const muiBasicTheme = useMuiTheme();

  return useMemo(() => muiToPieTheme(muiBasicTheme), [muiBasicTheme]);
}

/**
 * Hook to get both base and extended PIE themes from MUI
 * Returns both the base MUI-extracted theme and the extended derived theme
 *
 * @returns Object with both themes
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { baseTheme, extendedTheme } = useMuiPieThemes();
 *
 *   return (
 *     <div>
 *       <h3>Base MUI Colors</h3>
 *       <div>Primary: {baseTheme.primary}</div>
 *
 *       <h3>Derived PIE Colors</h3>
 *       <div>Primary Light: {extendedTheme['primary-light']}</div>
 *       <div>Focus Checked: {extendedTheme['focus-checked']}</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMuiPieThemes(): {
  baseTheme: Partial<PieThemeExtended>;
  extendedTheme: PieThemeExtended;
} {
  const baseTheme = useMuiTheme();
  const extendedTheme = useMuiPieTheme();

  return { baseTheme, extendedTheme };
}
