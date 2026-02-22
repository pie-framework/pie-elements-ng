import { createTheme, type Theme } from '@mui/material/styles';
import type { PieThemeExtended } from '@pie-element/shared-theming';
import type { MuiThemeOptions } from './types.js';

/**
 * Create MUI theme from PIE theme
 * Uses CSS variables in component overrides for compatibility
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
 * Update existing MUI theme with PIE colors.
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
