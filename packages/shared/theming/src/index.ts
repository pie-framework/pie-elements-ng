// Types
export type {
  PieThemeExtended,
  CssVariableMapping,
  MuiThemeOptions,
  ThemeConfig,
  ThemeContextValue,
  PieThemeProviderProps,
} from './types';

// Constants
export { PIE_COLOR_DEFAULTS, DEFAULT_CSS_MAPPINGS } from './constants';

// PIE Default Themes
export {
  PIE_ORANGE,
  PIE_LIGHT_THEME,
  PIE_DARK_THEME,
  getPieTheme,
  PIE_THEME_NAMES,
  type PieThemeName,
} from './pie-themes';

// CSS Variable utilities
export {
  generateCssVariables,
  cssVariablesToStyleString,
  cssVariablesToReactStyle,
  injectCssVariables,
  removeCssVariables,
} from './css-variables';

// MUI Integration
export { createPieMuiTheme, updateMuiThemeFromPie } from './mui-integration';

// React Provider and Context
export { PieThemeProvider, PieThemeContext } from './provider';

// React Hooks
export {
  usePieTheme,
  usePieThemeVariables,
  usePieThemeStyle,
  usePieThemeColors,
  usePieMuiTheme,
  useSetPieTheme,
} from './hooks';
