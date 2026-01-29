import React, { createContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { PieThemeExtended, ThemeContextValue, PieThemeProviderProps } from './types';
import { generateCssVariables, injectCssVariables } from './css-variables';
import { createPieMuiTheme } from './mui-integration';

/**
 * PIE Theme Context
 * Provides theme state and update functions to child components
 */
export const PieThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * PIE Theme Provider
 * Manages theme state and generates CSS variables + MUI theme
 *
 * @example
 * ```typescript
 * function App() {
 *   const config: ThemeConfig = {
 *     theme: { primary: '#3F51B5', 'base-content': '#000' },
 *     injectGlobally: true,
 *     muiOptions: { preserveMuiDefaults: true }
 *   };
 *
 *   return (
 *     <PieThemeProvider config={config}>
 *       <YourApp />
 *     </PieThemeProvider>
 *   );
 * }
 * ```
 */
export function PieThemeProvider({ children, config }: PieThemeProviderProps): JSX.Element {
  const [theme, setTheme] = useState<Partial<PieThemeExtended>>(config.theme);
  const [cssVariables, setCssVariables] = useState<Record<string, string>>(() =>
    generateCssVariables(config.theme, { prefix: config.prefix, mappings: config.mappings })
  );
  const [muiTheme, setMuiTheme] = useState<Theme>(() =>
    createPieMuiTheme(config.theme, config.muiOptions)
  );

  // Update CSS variables and MUI theme when theme changes
  useEffect(() => {
    const vars = generateCssVariables(theme, {
      prefix: config.prefix,
      mappings: config.mappings,
    });
    setCssVariables(vars);
    setMuiTheme(createPieMuiTheme(theme, config.muiOptions));

    // Optionally inject globally to document root
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
