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
