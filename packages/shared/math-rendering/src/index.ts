/**
 * @pie-elements-ng/shared-math-rendering
 *
 * Framework-agnostic math rendering using KaTeX.
 * Provides utilities for rendering LaTeX and MathML in the browser.
 */

export { renderMath, fixMathElement, fixMathElements } from './render-math';
export { wrapMath, unWrapMath, BracketTypes } from './normalization';
export { mmlToLatex } from './mml-to-latex';
export type { RenderMathOptions } from './types';
