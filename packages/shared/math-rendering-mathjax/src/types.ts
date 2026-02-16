/**
 * Options for MathJax renderer
 */
export interface MathjaxOptions {
  /**
   * Use single dollar signs as delimiters
   * @default false
   */
  useSingleDollar?: boolean;

  /**
   * Enable accessibility features (speech, aria-labels)
   * @default true
   */
  accessibility?: boolean;

  /**
   * Load MathJax fonts automatically
   * @default true
   */
  loadFonts?: boolean;

  /**
   * Override the MathJax script URL.
   */
  srcUrl?: string;
}
