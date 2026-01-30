import { useState, useEffect } from 'react';
import type { PieTheme } from '@pie-element/shared-types';
import type { PieThemeExtended } from '@pie-element/shared-theming';
import { extractDaisyUiTheme, watchDaisyUiTheme } from './extract';
import { daisyUiToPieTheme } from './convert';

/**
 * Hook to extract and watch DaisyUI theme from DOM
 * Automatically updates when data-theme attribute changes
 *
 * @param options - Optional element to watch
 * @returns Current DaisyUI theme (12 colors) or undefined
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const daisyTheme = useDaisyUiTheme();
 *
 *   if (!daisyTheme) {
 *     return <div>Loading theme...</div>;
 *   }
 *
 *   return <div>Primary color: {daisyTheme.primary}</div>;
 * }
 * ```
 */
export function useDaisyUiTheme(options?: { element?: HTMLElement }): PieTheme | undefined {
  const [theme, setTheme] = useState<PieTheme | undefined>(() => extractDaisyUiTheme(options));

  useEffect(() => {
    // Extract theme on mount in case it changed since initial state
    setTheme(extractDaisyUiTheme(options));

    // Watch for theme changes
    const unwatch = watchDaisyUiTheme((newTheme) => {
      setTheme(newTheme);
    }, options);

    return unwatch;
  }, [options]);

  return theme;
}

/**
 * Hook to get extended PIE theme from DaisyUI
 * Combines extraction and conversion in one step
 * Automatically updates when data-theme attribute changes
 *
 * @param options - Optional element to watch
 * @returns Extended PIE theme (45+ colors) or undefined
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const pieTheme = useDaisyUiPieTheme();
 *
 *   if (!pieTheme) {
 *     return <div>Loading theme...</div>;
 *   }
 *
 *   // Has all derived colors
 *   return (
 *     <div>
 *       Primary: {pieTheme.primary}
 *       Primary Light: {pieTheme['primary-light']}
 *       Primary Dark: {pieTheme['primary-dark']}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDaisyUiPieTheme(options?: {
  element?: HTMLElement;
}): PieThemeExtended | undefined {
  const daisyTheme = useDaisyUiTheme(options);
  const [pieTheme, setPieTheme] = useState<PieThemeExtended | undefined>(() =>
    daisyTheme ? daisyUiToPieTheme(daisyTheme) : undefined
  );

  useEffect(() => {
    if (daisyTheme) {
      setPieTheme(daisyUiToPieTheme(daisyTheme));
    } else {
      setPieTheme(undefined);
    }
  }, [daisyTheme]);

  return pieTheme;
}

/**
 * Hook to get both DaisyUI and extended PIE themes
 * Returns both the base 12-color theme and the extended 45+ color theme
 *
 * @param options - Optional element to watch
 * @returns Object with both themes
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { daisyTheme, pieTheme } = useDaisyUiThemes();
 *
 *   return (
 *     <div>
 *       <h3>Base Colors (12)</h3>
 *       <div>Primary: {daisyTheme?.primary}</div>
 *
 *       <h3>Extended Colors (45+)</h3>
 *       <div>Primary Light: {pieTheme?.['primary-light']}</div>
 *       <div>Primary Dark: {pieTheme?.['primary-dark']}</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDaisyUiThemes(options?: { element?: HTMLElement }): {
  daisyTheme: PieTheme | undefined;
  pieTheme: PieThemeExtended | undefined;
} {
  const daisyTheme = useDaisyUiTheme(options);
  const pieTheme = useDaisyUiPieTheme(options);

  return { daisyTheme, pieTheme };
}
