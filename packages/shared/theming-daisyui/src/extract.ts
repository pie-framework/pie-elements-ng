import type { PieTheme } from '@pie-element/shared-types';

/**
 * Options for extracting DaisyUI theme
 */
export interface ExtractDaisyUiThemeOptions {
  /**
   * Optional data-theme attribute value to read
   * If not specified, reads from current document.documentElement
   */
  dataTheme?: string;

  /**
   * Optional element to extract theme from
   * Defaults to document.documentElement
   */
  element?: HTMLElement;
}

/**
 * Extract DaisyUI theme from DOM
 * Uses computed styles and temporary elements to extract all DaisyUI color values
 *
 * @param options - Extraction options
 * @returns PieTheme with 12 DaisyUI colors, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * // Extract current theme
 * const theme = extractDaisyUiTheme();
 *
 * // Extract from specific element
 * const theme = extractDaisyUiTheme({ element: myElement });
 * ```
 */
export function extractDaisyUiTheme(options?: ExtractDaisyUiThemeOptions): PieTheme | undefined {
  // Check if we're in a browser environment
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    console.warn('extractDaisyUiTheme: Not in browser environment');
    return undefined;
  }

  try {
    const element = options?.element || document.documentElement;

    // Get base colors from root element
    const rootStyles = getComputedStyle(element);
    const baseContent = rootStyles.color;
    const baseBackground = rootStyles.backgroundColor;

    // Create temporary element for extracting utility class colors
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
    document.body.appendChild(tempDiv);

    /**
     * Helper to extract color from a DaisyUI utility class
     * @param className - DaisyUI utility class (e.g., 'text-primary')
     * @param prop - CSS property to read (default: 'color')
     */
    const extract = (className: string, prop: 'color' | 'backgroundColor' = 'color'): string => {
      tempDiv.className = className;
      const computed = getComputedStyle(tempDiv);
      return computed[prop];
    };

    // Extract all DaisyUI colors using utility classes
    const theme: PieTheme = {
      // Text and backgrounds
      'base-content': baseContent,
      'base-100': baseBackground,
      'base-200': extract('bg-base-200', 'backgroundColor'),
      'base-300': extract('bg-base-300', 'backgroundColor'),

      // Semantic colors
      primary: extract('text-primary'),
      secondary: extract('text-secondary'),
      accent: extract('text-accent'),
      neutral: extract('text-neutral'),

      // Feedback colors
      success: extract('text-success'),
      error: extract('text-error'),
      warning: extract('text-warning'),
      info: extract('text-info'),
    };

    // Clean up temporary element
    document.body.removeChild(tempDiv);

    return theme;
  } catch (error) {
    console.error('extractDaisyUiTheme: Failed to extract theme', error);
    return undefined;
  }
}

/**
 * Watch for DaisyUI theme changes
 * Observes changes to the data-theme attribute and calls callback with new theme
 *
 * @param callback - Function to call when theme changes
 * @param options - Watch options
 * @returns Cleanup function to stop watching
 *
 * @example
 * ```typescript
 * const unwatch = watchDaisyUiTheme((newTheme) => {
 *   console.log('Theme changed:', newTheme);
 *   updateMyAppTheme(newTheme);
 * });
 *
 * // Later: stop watching
 * unwatch();
 * ```
 */
export function watchDaisyUiTheme(
  callback: (theme: PieTheme | undefined) => void,
  options?: { element?: HTMLElement }
): () => void {
  // Check if we're in a browser environment
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    console.warn('watchDaisyUiTheme: Not in browser environment');
    return () => {};
  }

  const element = options?.element || document.documentElement;

  // Create mutation observer to watch for data-theme changes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        // Extract new theme and call callback
        const newTheme = extractDaisyUiTheme({ element });
        callback(newTheme);
        break; // Only call once per mutation batch
      }
    }
  });

  // Start observing
  observer.observe(element, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  // Return cleanup function
  return () => {
    observer.disconnect();
  };
}

/**
 * Get current DaisyUI theme name
 * Reads the data-theme attribute value
 *
 * @param element - Element to read from (default: document.documentElement)
 * @returns Theme name or undefined
 *
 * @example
 * ```typescript
 * const themeName = getDaisyUiThemeName(); // 'light', 'dark', 'cupcake', etc.
 * ```
 */
export function getDaisyUiThemeName(element?: HTMLElement): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const target = element || document.documentElement;
  return target.getAttribute('data-theme') || undefined;
}

/**
 * Set DaisyUI theme by name
 * Sets the data-theme attribute
 *
 * @param themeName - DaisyUI theme name
 * @param element - Element to set attribute on (default: document.documentElement)
 *
 * @example
 * ```typescript
 * setDaisyUiTheme('dark');
 * setDaisyUiTheme('cupcake');
 * ```
 */
export function setDaisyUiTheme(themeName: string, element?: HTMLElement): void {
  if (typeof document === 'undefined') {
    return;
  }

  const target = element || document.documentElement;
  target.setAttribute('data-theme', themeName);
}
