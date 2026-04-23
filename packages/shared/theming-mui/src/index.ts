// Extraction
export { extractMuiTheme } from './extract.js';

// Conversion
export { muiToPieTheme } from './convert.js';

// Reverse conversion (PIE → MUI)
export { piePaletteToMui, createMuiThemeFromPie } from './reverse.js';

// React hooks
export { useMuiTheme, useMuiPieTheme, useMuiPieThemes } from './hooks.js';

// PIE + MUI integration
export { createPieMuiTheme, updateMuiThemeFromPie } from './mui-integration.js';
export { PieThemeProvider, PieThemeContext } from './provider.js';
export {
  usePieTheme,
  usePieThemeVariables,
  usePieThemeStyle,
  usePieThemeColors,
  usePieMuiTheme,
  useSetPieTheme,
} from './pie-hooks.js';
export type { MuiThemeOptions, ThemeConfig, ThemeContextValue, PieThemeProviderProps } from './types.js';
