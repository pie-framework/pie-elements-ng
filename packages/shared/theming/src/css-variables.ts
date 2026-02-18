import type { PieThemeExtended, CssVariableMapping } from './types.js';
import { DEFAULT_CSS_MAPPINGS } from './constants.js';

/**
 * Generate CSS variables from a PIE theme
 * Maps theme properties to CSS variables with fallbacks
 *
 * @param theme - Partial PIE theme with color values
 * @param options - Optional configuration for variable generation
 * @returns Record of CSS variable names to values
 *
 * @example
 * ```typescript
 * const theme = { primary: '#3F51B5', 'base-content': '#000000' };
 * const vars = generateCssVariables(theme);
 * // { '--pie-primary': '#3F51B5', '--pie-text': '#000000', ... }
 * ```
 */
export function generateCssVariables(
  theme: Partial<PieThemeExtended>,
  options?: {
    prefix?: string;
    mappings?: readonly CssVariableMapping[];
  }
): Record<string, string> {
  const cssVars: Record<string, string> = {};
  const mappings = options?.mappings || DEFAULT_CSS_MAPPINGS;

  for (const mapping of mappings) {
    const value = theme[mapping.themeKey];
    cssVars[mapping.variableName] = value || mapping.fallback;
  }

  return cssVars;
}

/**
 * Convert CSS variables object to inline style string
 * Formats as "key: value; key: value" for use in style attributes
 *
 * @param cssVars - Record of CSS variable names to values
 * @returns Formatted CSS string
 *
 * @example
 * ```typescript
 * const vars = { '--pie-text': 'black', '--pie-primary': '#3F51B5' };
 * const styleString = cssVariablesToStyleString(vars);
 * // "--pie-text: black; --pie-primary: #3F51B5"
 * ```
 */
export function cssVariablesToStyleString(cssVars: Record<string, string>): string {
  return Object.entries(cssVars)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}

/**
 * Convert CSS variables object to React CSSProperties object
 * Useful for inline styles in React components
 *
 * @param cssVars - Record of CSS variable names to values
 * @returns React CSSProperties object
 *
 * @example
 * ```typescript
 * const vars = { '--pie-text': 'black' };
 * const style = cssVariablesToReactStyle(vars);
 * <div style={style}>...</div>
 * ```
 */
export function cssVariablesToReactStyle(cssVars: Record<string, string>): React.CSSProperties {
  return cssVars as React.CSSProperties;
}

/**
 * Inject CSS variables into a DOM element
 * Modifies the element's style property to set CSS custom properties
 *
 * @param cssVars - Record of CSS variable names to values
 * @param target - Target element (defaults to document.documentElement)
 *
 * @example
 * ```typescript
 * const vars = generateCssVariables(theme);
 * injectCssVariables(vars); // Injects to :root (document.documentElement)
 * // or
 * injectCssVariables(vars, myElement); // Injects to specific element
 * ```
 */
export function injectCssVariables(
  cssVars: Record<string, string>,
  target: HTMLElement = typeof document !== 'undefined' ? document.documentElement : (null as any)
): void {
  if (!target) {
    console.warn(
      'injectCssVariables: No target element available (running in non-browser environment)'
    );
    return;
  }

  Object.entries(cssVars).forEach(([key, value]) => {
    target.style.setProperty(key, value);
  });
}

/**
 * Remove CSS variables from a DOM element
 * Cleans up previously injected CSS variables
 *
 * @param cssVars - Record of CSS variable names (values ignored)
 * @param target - Target element (defaults to document.documentElement)
 *
 * @example
 * ```typescript
 * const vars = generateCssVariables(theme);
 * removeCssVariables(vars); // Removes from :root
 * ```
 */
export function removeCssVariables(
  cssVars: Record<string, string>,
  target: HTMLElement = typeof document !== 'undefined' ? document.documentElement : (null as any)
): void {
  if (!target) {
    return;
  }

  Object.keys(cssVars).forEach((key) => {
    target.style.removeProperty(key);
  });
}
