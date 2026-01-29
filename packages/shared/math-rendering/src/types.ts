/**
 * Math typesetting types
 *
 * Pluggable architecture for rendering mathematical content
 */

/**
 * Math renderer function signature
 *
 * Takes an HTML element and renders math within it.
 * Can be synchronous or asynchronous.
 *
 * @example
 * ```typescript
 * const renderer: MathRenderer = async (element) => {
 *   const mathElements = element.querySelectorAll('[data-latex]');
 *   mathElements.forEach(el => {
 *     // Render math...
 *   });
 * };
 * ```
 */
export type MathRenderer = (element: HTMLElement) => void | Promise<void>;

/**
 * Configuration for math typesetting
 */
export interface TypesetConfig {
  /**
   * Math renderer function
   * If not provided, typesetting is a no-op
   */
  renderer?: MathRenderer;

  /**
   * CSS URLs required by the renderer
   * Will be automatically loaded once
   */
  cssUrls?: string[];

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Bracket types for LaTeX wrapping
 */
export const BracketTypes = {
  ROUND_BRACKETS: 'round_brackets',
  SQUARE_BRACKETS: 'square_brackets',
  DOLLAR: 'dollar',
  DOUBLE_DOLLAR: 'double_dollar',
} as const;

export type BracketType = (typeof BracketTypes)[keyof typeof BracketTypes];
