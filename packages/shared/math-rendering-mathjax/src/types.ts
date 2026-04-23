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

/**
 * Shared renderer contract used by players.
 */
export type MathRenderer = (element: HTMLElement) => void | Promise<void>;

export interface MathRenderingAPI {
  renderMath: MathRenderer;
  wrapMath?: (latex: string) => string;
  unWrapMath?: (wrapped: string) => string;
  mmlToLatex?: (mathml: string) => string;
}
