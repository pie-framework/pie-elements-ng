/**
 * Math Typesetting
 *
 * Pluggable math rendering system for PIE elements
 *
 * @example
 * ```typescript
 * import { createKatexRenderer } from '@pie-element/math-typesetting';
 *
 * // Create renderer with default options
 * const renderer = createKatexRenderer();
 *
 * // Render math in an element
 * await renderer(document.body);
 * ```
 *
 * @example
 * ```typescript
 * import { createMathMLRenderer } from '@pie-element/math-typesetting';
 *
 * // Use native MathML (modern browsers only)
 * const renderer = createMathMLRenderer();
 * renderer(document.body);
 * ```
 */

// Core types
export type { MathRenderer, TypesetConfig, KatexOptions, BracketType } from './types';
export { BracketTypes } from './types';

// Default adapter (KaTeX)
export { createKatexRenderer, getKatexCssUrls } from './adapters/katex';

// Alternative adapters
export { createMathMLRenderer, getMathMLCssUrls } from './adapters/mathml';

// Utilities
export { wrapMath, unWrapMath, fixMathElement, fixMathElements } from './utils/normalization';
export { mmlToLatex } from './utils/mml-to-latex';
export { loadCss, isCssLoaded } from './utils/css-loader';
