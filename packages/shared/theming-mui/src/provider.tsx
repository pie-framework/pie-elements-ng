import React, { createContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { PieThemeExtended } from '@pie-element/shared-theming';
import { generateCssVariables, injectCssVariables } from '@pie-element/shared-theming';
import { createPieMuiTheme } from './mui-integration.js';
import type { ThemeContextValue, PieThemeProviderProps } from './types.js';

/**
 * PIE Theme Context
 * Provides theme state and update functions to child components
 */
export const PieThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * PIE Theme Provider
 * Manages theme state and generates CSS variables + MUI theme
 */
export function PieThemeProvider({ children, config }: PieThemeProviderProps): JSX.Element {
  const [theme, setTheme] = useState<Partial<PieThemeExtended>>(config.theme);
  const [cssVariables, setCssVariables] = useState<Record<string, string>>(() =>
    generateCssVariables(config.theme, { prefix: config.prefix, mappings: config.mappings })
  );
  const [muiTheme, setMuiTheme] = useState<Theme>(() =>
    createPieMuiTheme(config.theme, config.muiOptions)
  );

  useEffect(() => {
    const vars = generateCssVariables(theme, {
      prefix: config.prefix,
      mappings: config.mappings,
    });
    setCssVariables(vars);
    setMuiTheme(createPieMuiTheme(theme, config.muiOptions));

    if (config.injectGlobally) {
      injectCssVariables(vars);
    }
  }, [theme, config.prefix, config.mappings, config.muiOptions, config.injectGlobally]);

  const contextValue: ThemeContextValue = {
    theme,
    cssVariables,
    muiTheme,
    setTheme,
  };

  return (
    <PieThemeContext.Provider value={contextValue}>
      <StyledEngineProvider injectFirst>
        <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
      </StyledEngineProvider>
    </PieThemeContext.Provider>
  );
}
