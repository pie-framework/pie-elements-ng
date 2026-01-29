import { createTheme, type Theme } from '@mui/material/styles';
import type { PieThemeExtended, MuiThemeOptions } from './types';

/**
 * Create MUI theme from PIE theme
 * Uses CSS variables in component overrides for compatibility
 *
 * This function creates a Material-UI theme that works alongside PIE's CSS variable system.
 * By default, it preserves MUI's existing styles and optionally injects CSS variables.
 *
 * @param pieTheme - PIE theme with color values
 * @param options - MUI theme configuration options
 * @returns MUI Theme object
 *
 * @example
 * ```typescript
 * const pieTheme = { primary: '#3F51B5', 'base-content': '#000' };
 * const muiTheme = createPieMuiTheme(pieTheme, {
 *   useThemePalette: true,
 *   injectCssVariables: true,
 *   preserveMuiDefaults: false
 * });
 * ```
 */
export function createPieMuiTheme(
  pieTheme: Partial<PieThemeExtended>,
  options: MuiThemeOptions = {}
): Theme {
  const {
    useThemePalette = false,
    injectCssVariables = true,
    preserveMuiDefaults = true,
  } = options;

  const themeOptions: any = {
    typography: {
      fontFamily: 'inherit',
    },
    palette: preserveMuiDefaults
      ? {
          action: {
            disabled: 'rgba(0, 0, 0, 0.54)',
          },
        }
      : {},
  };

  // Optional: Override MUI palette with PIE colors
  if (useThemePalette) {
    themeOptions.palette = {
      ...themeOptions.palette,
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
    };
  }

  // Inject CSS variables into MUI component overrides
  if (injectCssVariables) {
    themeOptions.components = {
      MuiTypography: {
        styleOverrides: {
          root: {
            fontFamily: 'inherit',
            color: preserveMuiDefaults ? 'inherit' : 'var(--pie-text, inherit)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          contained: preserveMuiDefaults
            ? {
                backgroundColor: '#e0e0e0',
                color: '#000000',
                '&:hover': {
                  backgroundColor: '#bdbdbd',
                },
              }
            : {
                backgroundColor: 'var(--pie-primary)',
                color: 'var(--pie-text)',
                '&:hover': {
                  backgroundColor: 'var(--pie-primary-dark)',
                },
              },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-root': {
              color: injectCssVariables && !preserveMuiDefaults ? 'var(--pie-text)' : undefined,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            color: injectCssVariables && !preserveMuiDefaults ? 'var(--pie-text)' : undefined,
          },
        },
      },
    };
  }

  return createTheme(themeOptions);
}

/**
 * Update existing MUI theme with PIE colors
 * Useful for dynamically updating a theme without recreating it
 *
 * @param existingTheme - Existing MUI theme
 * @param pieTheme - New PIE theme colors
 * @returns Updated MUI theme
 *
 * @example
 * ```typescript
 * const updated = updateMuiThemeFromPie(currentTheme, newPieTheme);
 * ```
 */
export function updateMuiThemeFromPie(
  existingTheme: Theme,
  pieTheme: Partial<PieThemeExtended>
): Theme {
  return createTheme({
    ...existingTheme,
    palette: {
      ...existingTheme.palette,
      primary: {
        ...existingTheme.palette.primary,
        main: pieTheme.primary || existingTheme.palette.primary.main,
        light: pieTheme['primary-light'] || existingTheme.palette.primary.light,
        dark: pieTheme['primary-dark'] || existingTheme.palette.primary.dark,
      },
      secondary: {
        ...existingTheme.palette.secondary,
        main: pieTheme.secondary || existingTheme.palette.secondary.main,
        light: pieTheme['secondary-light'] || existingTheme.palette.secondary.light,
        dark: pieTheme['secondary-dark'] || existingTheme.palette.secondary.dark,
      },
      text: {
        ...existingTheme.palette.text,
        primary: pieTheme['base-content'] || existingTheme.palette.text.primary,
      },
      background: {
        ...existingTheme.palette.background,
        default: pieTheme['base-100'] || existingTheme.palette.background.default,
        paper: pieTheme['base-200'] || existingTheme.palette.background.paper,
      },
    },
  });
}
