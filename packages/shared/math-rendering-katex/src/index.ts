/**
 * @pie-element/math-rendering-katex
 *
 * KaTeX adapter for PIE math rendering (~100KB)
 * Fast, lightweight LaTeX and MathML rendering for browsers.
 *
 * @example
 * ```typescript
 * import { createKatexRenderer } from '@pie-element/math-rendering-katex';
 *
 * const renderer = createKatexRenderer();
 * await renderer(document.body);
 * ```
 */

// Main adapter export
export { createKatexRenderer, getKatexCssUrls } from './adapter';

// Legacy exports for backwards compatibility
export { renderMath, fixMathElement, fixMathElements, preprocessMathHtml } from './render-math';
export { wrapMath, unWrapMath, BracketTypes } from './normalization';
export { mmlToLatex } from './mml-to-latex';
export type { RenderMathOptions, KatexOptions } from './types';
