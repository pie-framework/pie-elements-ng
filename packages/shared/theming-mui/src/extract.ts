import type { Theme } from '@mui/material/styles';
import type { PieThemeExtended } from '@pie-element/theming';

/**
 * Extract PIE theme from MUI Theme object
 * Maps MUI palette colors to PIE theme properties
 *
 * @param muiTheme - MUI Theme object
 * @returns PIE theme with extended colors from MUI
 *
 * @example
 * ```typescript
 * import { useTheme } from '@mui/material/styles';
 *
 * function MyComponent() {
 *   const muiTheme = useTheme();
 *   const pieTheme = extractMuiTheme(muiTheme);
 *   console.log(pieTheme.primary); // MUI primary color
 * }
 * ```
 */
export function extractMuiTheme(muiTheme: Theme): Partial<PieThemeExtended> {
  const { palette } = muiTheme;

  return {
    // Primary colors
    primary: palette.primary.main,
    'primary-light': palette.primary.light,
    'primary-dark': palette.primary.dark,

    // Secondary colors
    secondary: palette.secondary.main,
    'secondary-light': palette.secondary.light,
    'secondary-dark': palette.secondary.dark,

    // Semantic colors
    success: palette.success?.main,
    error: palette.error?.main,
    warning: palette.warning?.main,
    info: palette.info?.main,

    // Text and backgrounds
    'base-content': palette.text.primary,
    'base-100': palette.background.default,
    'base-200': palette.background.paper,

    // Grey scale (for neutral, borders, disabled)
    neutral: palette.grey[500],
    'base-300': palette.grey[100],

    // Accent (use secondary as fallback)
    accent: palette.secondary.main,
  };
}
