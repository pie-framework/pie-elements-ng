/**
 * MathML to LaTeX conversion
 *
 * Simple wrapper around the internal mathml-to-latex package
 */

import { convertMathMLToLaTeX } from '@pie-elements-ng/shared-mathml-to-latex';

/**
 * Convert MathML to LaTeX
 */
export function mmlToLatex(mathml: string): string {
  return convertMathMLToLaTeX(mathml);
}
