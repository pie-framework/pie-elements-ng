/**
 * @pie-element/math-rendering-mathjax
 *
 * MathJax adapter for PIE math rendering (~2.7MB)
 * Full-featured LaTeX and MathML rendering with accessibility support.
 *
 * This adapter wraps the upstream @pie-lib/math-rendering package,
 * which must be loaded separately (e.g., via a script tag or bundled).
 *
 * @example
 * ```typescript
 * import { createMathjaxRenderer } from '@pie-element/shared-math-rendering-mathjax';
 *
 * const renderer = createMathjaxRenderer();
 * renderer(document.body);
 * ```
 */

export { createMathjaxRenderer, getMathjaxCssUrls } from './adapter';
export type { MathjaxOptions } from './types';

// Legacy @pie-lib/math-rendering API for backward compatibility
export { renderMath, wrapMath, unWrapMath, mmlToLatex } from './render-math';
