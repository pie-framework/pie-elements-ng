import type { ThemeOptions } from '@mui/material/styles';
import type { PieThemeExtended } from '@pie-element/shared-theming';
import { createTheme } from '@mui/material/styles';

/**
 * Convert PIE theme to MUI ThemeOptions
 * Useful for creating MUI themes from PIE themes
 *
 * @param pieTheme - PIE theme with colors
 * @returns MUI ThemeOptions object
 *
 * @example
 * ```typescript
 * const pieTheme = { primary: '#3F51B5', 'base-content': '#000' };
 * const muiOptions = piePaletteToMui(pieTheme);
 * const muiTheme = createTheme(muiOptions);
 * ```
 */
export function piePaletteToMui(pieTheme: Partial<PieThemeExtended>): ThemeOptions {
  return {
    palette: {
      primary: {
        main: pieTheme.primary || '#3F51B5',
        light: pieTheme['primary-light'],
        dark: pieTheme['primary-dark'],
      },
      secondary: {
        main: pieTheme.secondary || '#F50057',
        light: pieTheme['secondary-light'],
        dark: pieTheme['secondary-dark'],
      },
      success: {
        main: pieTheme.success || '#4CAF50',
      },
      error: {
        main: pieTheme.error || '#FF9800',
      },
      warning: {
        main: pieTheme.warning || '#FFC107',
      },
      info: {
        main: pieTheme.info || '#2196F3',
      },
      text: {
        primary: pieTheme['base-content'] || 'rgba(0, 0, 0, 0.87)',
      },
      background: {
        default: pieTheme['base-100'] || '#fff',
        paper: pieTheme['base-200'] || '#fff',
      },
      grey: {
        500: pieTheme.neutral || '#9e9e9e',
      },
    },
  };
}

/**
 * Create full MUI theme from PIE theme
 * Includes typography and palette configuration
 *
 * @param pieTheme - PIE theme with colors
 * @returns Complete MUI Theme object
 *
 * @example
 * ```typescript
 * const pieTheme = daisyUiToPieTheme(extractDaisyUiTheme());
 * const muiTheme = createMuiThemeFromPie(pieTheme);
 * // Use with MUI ThemeProvider
 * ```
 */
export function createMuiThemeFromPie(pieTheme: Partial<PieThemeExtended>) {
  const themeOptions = piePaletteToMui(pieTheme);

  return createTheme({
    ...themeOptions,
    typography: {
      fontFamily: 'inherit',
    },
  });
}
