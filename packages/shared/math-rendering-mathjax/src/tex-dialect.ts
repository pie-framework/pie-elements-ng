/**
 * The TeX dialect authored content is written in: the legacy renderer's macros and delimiters.
 * Both the adapter and `texToMathml` read it, so this module imports nothing.
 */

export type MathJaxMacro = string | [string, number];

/** The macros the legacy renderer defines, which authored content relies on. */
export const LEGACY_MACROS: Record<string, MathJaxMacro> = {
  parallelogram: '\\lower.2em{\\Huge\\unicode{x25B1}}',
  overarc: '\\overparen',
  napprox: '\\not\\approx',
  longdiv: '\\enclose{longdiv}',
  abs: ['\\left|#1\\right|', 1],
  perpendicular: '\\perp',
  divide: '\\div',
};

/**
 * Text MathJax's TeX input typesets with the default delimiters: \(…\), \[…\], $$…$$, \$ escapes,
 * environments and references, plus $…$ when single dollars are on.
 */
export const TEX_MARKERS = /\\\(|\\\[|\$\$|\\\$|\\begin\{|\\(?:eq)?ref\{/;
export const TEX_MARKERS_WITH_SINGLE_DOLLAR = /\\\(|\\\[|\$|\\begin\{|\\(?:eq)?ref\{/;

export const NEWLINE_BLOCK = /\\embed\{newLine\}\[\]/g;

const LEGACY_DELIMITERS: [string, string][] = [
  ['$$', '$$'],
  ['$', '$'],
  ['\\[', '\\]'],
  ['\\(', '\\)'],
];

/** `latex` without the pair of legacy delimiters around all of it, if it has one. */
export function stripLegacyDelimiters(latex: string): string {
  for (const [open, close] of LEGACY_DELIMITERS) {
    if (latex.startsWith(open) && latex.endsWith(close)) {
      return latex.substring(open.length, latex.length - close.length);
    }
  }
  return latex;
}

/** The text of a `[data-latex]` element as inline math, as the legacy renderer rewrites it. */
export function dataLatexAsInlineMath(content: string): string {
  const latex = content.includes('\\displaystyle')
    ? content.replace('\\displaystyle', '').trim()
    : content;
  return `\\(${stripLegacyDelimiters(latex)}\\)`.replace(NEWLINE_BLOCK, '\\newline ');
}

/** MathJax's default `ignoreHtmlClass` and `processHtmlClass`, which the adapter keeps. */
export const IGNORE_CLASS = 'mathjax_ignore';
export const PROCESS_CLASS = 'mathjax_process';
