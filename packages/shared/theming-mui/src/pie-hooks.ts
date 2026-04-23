import { useContext, useMemo } from 'react';
import type { Theme } from '@mui/material/styles';
import type { PieThemeExtended } from '@pie-element/shared-theming';
import { cssVariablesToReactStyle } from '@pie-element/shared-theming';
import { PieThemeContext } from './provider.js';
import type { ThemeContextValue } from './types.js';

/**
 * Hook to access the PIE theme context.
 */
export function usePieTheme(): ThemeContextValue {
  const context = useContext(PieThemeContext);
  if (!context) {
    throw new Error('usePieTheme must be used within a PieThemeProvider');
  }
  return context;
}

export function usePieThemeVariables(): Record<string, string> {
  const { cssVariables } = usePieTheme();
  return cssVariables;
}

export function usePieThemeStyle(): React.CSSProperties {
  const cssVariables = usePieThemeVariables();
  return useMemo(() => cssVariablesToReactStyle(cssVariables), [cssVariables]);
}

export function usePieThemeColors(): Partial<PieThemeExtended> {
  const { theme } = usePieTheme();
  return theme;
}

export function usePieMuiTheme(): Theme {
  const { muiTheme } = usePieTheme();
  return muiTheme;
}

export function useSetPieTheme(): (theme: Partial<PieThemeExtended>) => void {
  const { setTheme } = usePieTheme();
  return setTheme;
}
