/**
 * Math Rendering Utilities
 *
 * Provides utilities for rendering LaTeX and MathML in PIE elements using MathJax.
 * Ported from @pie-lib/math-rendering.
 */

export type { UnwrapResult } from './normalization';
export { BracketTypes, unWrapMath, wrapMath } from './normalization';
export type { MathRenderOptions } from './render-math';
export { default as renderMath, fixMathElement, fixMathElements } from './render-math';

export interface MathConfig {
  /**
   * Whether to enable inline math rendering
   */
  inline?: boolean;

  /**
   * Delimiters for LaTeX math
   */
  delimiters?: {
    inline: [string, string];
    display: [string, string];
  };

  /**
   * Whether to allow single dollar signs for inline math
   */
  useSingleDollar?: boolean;
}

/**
 * Default math configuration
 */
export const defaultMathConfig: MathConfig = {
  inline: true,
  delimiters: {
    inline: ['\\(', '\\)'],
    display: ['\\[', '\\]'],
  },
  useSingleDollar: false,
};

/**
 * Check if a string contains LaTeX math
 */
export function containsMath(html: string): boolean {
  const inlinePattern = /\\\(.*?\\\)/;
  const displayPattern = /\\\[.*?\\\]/;
  const dollarPattern = /\$\$?[^$]+\$\$?/;
  return inlinePattern.test(html) || displayPattern.test(html) || dollarPattern.test(html);
}

/**
 * Extract math expressions from HTML
 */
export function extractMathExpressions(html: string): string[] {
  const expressions: string[] = [];
  const patterns = [/\\\((.*?)\\\)/g, /\\\[(.*?)\\\]/g, /\$\$(.*?)\$\$/g, /\$([^$]+)\$/g];

  for (const pattern of patterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      expressions.push(match[1]);
    }
  }

  return expressions;
}
