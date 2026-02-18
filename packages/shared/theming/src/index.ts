// Types
export type {
  PieThemeExtended,
  CssVariableMapping,
  MuiThemeOptions,
  ThemeConfig,
  ThemeContextValue,
  PieThemeProviderProps,
} from './types.js';

// Constants
export { PIE_COLOR_DEFAULTS, DEFAULT_CSS_MAPPINGS } from './constants.js';

// PIE Default Themes
export {
  PIE_ORANGE,
  PIE_LIGHT_THEME,
  PIE_DARK_THEME,
  getPieTheme,
  PIE_THEME_NAMES,
  type PieThemeName,
} from './pie-themes.js';

// CSS Variable utilities
export {
  generateCssVariables,
  cssVariablesToStyleString,
  cssVariablesToReactStyle,
  injectCssVariables,
  removeCssVariables,
} from './css-variables.js';

// MUI Integration
export { createPieMuiTheme, updateMuiThemeFromPie } from './mui-integration.js';

// React Provider and Context
export { PieThemeProvider, PieThemeContext } from './provider.js';

// React Hooks
export {
  usePieTheme,
  usePieThemeVariables,
  usePieThemeStyle,
  usePieThemeColors,
  usePieMuiTheme,
  useSetPieTheme,
} from './hooks.js';
