/**
 * Native MathML renderer adapter
 *
 * Uses browser's built-in MathML support (modern browsers only)
 */

import type { MathRenderer } from '../types';

/**
 * Create a native MathML renderer
 *
 * Uses browser's built-in MathML support. No dependencies or CSS required.
 * Works in modern browsers (Chrome 109+, Firefox, Safari).
 *
 * @returns Math renderer function
 *
 * @example
 * ```typescript
 * const renderer = createMathMLRenderer();
 * renderer(document.body); // Synchronous, no await needed
 * ```
 */
export function createMathMLRenderer(): MathRenderer {
  return (element: HTMLElement): void => {
    // Ensure proper MathML namespace
    const mathElements = element.querySelectorAll('math');
    mathElements.forEach((el) => {
      if (!el.hasAttribute('xmlns')) {
        el.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
      }
    });

    // Note: Converting data-latex to MathML would require a latex-to-mathml
    // converter, which is not included. This renderer only works with
    // existing MathML elements.
  };
}

/**
 * Get CSS URLs required by MathML renderer
 *
 * @returns Empty array (no CSS needed for native MathML)
 */
export function getMathMLCssUrls(): string[] {
  return []; // No CSS needed for native MathML
}

// Default export for convenience
export default createMathMLRenderer;
