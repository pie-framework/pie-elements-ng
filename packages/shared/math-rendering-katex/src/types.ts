/**
 * Type definitions for math rendering
 */

/**
 * Options for rendering math (for future use)
 */
export interface RenderMathOptions {
  /** Display mode (block vs inline) */
  displayMode?: boolean;
  /** Throw errors on invalid LaTeX */
  throwOnError?: boolean;
  /** Trust user input (disable security checks) */
  trust?: boolean;
  /** Temporary rendering (skip accessibility features) */
  temporary?: boolean;
}

/**
 * Options for KaTeX renderer
 */
export interface KatexOptions {
  /**
   * Use single dollar signs as delimiters
   * @default true
   */
  useSingleDollar?: boolean;

  /**
   * Throw on rendering errors
   * @default false
   */
  throwOnError?: boolean;

  /**
   * Trust user LaTeX (allows \includegraphics, etc.)
   * @default true
   */
  trust?: boolean;

  /**
   * Load KaTeX CSS automatically
   * @default true
   */
  loadCss?: boolean;

  /**
   * Override the KaTeX CSS URL when auto-loading.
   */
  cssUrl?: string;

  /**
   * Optional integrity hash for the CSS URL.
   */
  cssIntegrity?: string;
}
