/**
 * Options for MathJax renderer
 */
export interface MathjaxOptions {
  /**
   * Treat `$...$` as inline math. The renderer behind `renderMath` enables it when the page sets
   * the legacy opt-in, `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`.
   * @default false
   */
  useSingleDollar?: boolean;

  /**
   * Add hidden MathML for screen readers and the MathJax context menu
   * @default true
   */
  accessibility?: boolean;

  /**
   * Load MathJax fonts automatically
   * @default true
   */
  loadFonts?: boolean;

  /**
   * Override the MathJax script URL. Defaults to MathJax 4.1.3 `tex-mml-chtml.js` on jsDelivr.
   * The browser ESM build bundles its MathJax and ignores it.
   */
  srcUrl?: string;
}

/**
 * Shared renderer contract used by players.
 */
export type MathRenderer = (element: HTMLElement) => void | Promise<void>;

export interface MathRenderingAPI {
  renderMath: MathRenderer;
  wrapMath?: (latex: string, wrapType?: string | null) => string;
  unWrapMath?: (wrapped: string) => string;
  mmlToLatex?: (mathml: string) => string;
}
