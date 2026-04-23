import type { Theme } from '@mui/material/styles';
import type { PieThemeExtended, CssVariableMapping } from '@pie-element/shared-theming';

/**
 * MUI theme integration options
 */
export interface MuiThemeOptions {
  useThemePalette?: boolean; // Override MUI palette colors
  injectCssVariables?: boolean; // Use CSS vars in MUI components
  preserveMuiDefaults?: boolean; // Keep existing button styles
}

/**
 * Theme configuration for PieThemeProvider
 */
export interface ThemeConfig {
  theme: Partial<PieThemeExtended>;
  muiOptions?: MuiThemeOptions;
  injectGlobally?: boolean; // Inject CSS variables to document.documentElement
  prefix?: string; // CSS variable prefix (default: 'pie')
  mappings?: CssVariableMapping[]; // Custom mappings
}

/**
 * Theme context value
 */
export interface ThemeContextValue {
  theme: Partial<PieThemeExtended>;
  cssVariables: Record<string, string>;
  muiTheme: Theme;
  setTheme: (theme: Partial<PieThemeExtended>) => void;
}

/**
 * PieThemeProvider props
 */
export interface PieThemeProviderProps {
  children: React.ReactNode;
  config: ThemeConfig;
}
