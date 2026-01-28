/**
 * TypeScript type definitions for MathQuill API
 *
 * These are minimal type definitions for the MathQuill interface.
 * For complete API documentation, see https://github.com/pie-framework/mathquill
 */

export interface MathQuillInterface {
  /**
   * Creates a static (non-editable) math field
   */
  StaticMath(el: HTMLElement): StaticMath;

  /**
   * Creates an editable math field
   */
  MathField(el: HTMLElement, config?: MathFieldConfig): MathField;

  /**
   * Register a handler for LaTeX commands
   */
  registerEmbed(name: string, fn: (data: any) => void): void;

  /**
   * Version information
   */
  MIN?: number;
  MAX?: number;
}

export interface MathField {
  /**
   * Get the LaTeX representation of the field's content
   */
  latex(): string;

  /**
   * Set the LaTeX content of the field
   */
  latex(latexStr: string): void;

  /**
   * Get the text content
   */
  text(): string;

  /**
   * Get the HTML content
   */
  html(): string;

  /**
   * Restore the original HTML element
   */
  revert(): HTMLElement;

  /**
   * Set focus on the field
   */
  focus(): MathField;

  /**
   * Remove focus from the field
   */
  blur(): MathField;

  /**
   * Write content at the cursor
   */
  write(latex: string): MathField;

  /**
   * Execute a command
   */
  cmd(latex: string): MathField;

  /**
   * Select all content
   */
  select(): MathField;

  /**
   * Clear selection
   */
  clearSelection(): MathField;

  /**
   * Move cursor to the start
   */
  moveToLeftEnd(): MathField;

  /**
   * Move cursor to the end
   */
  moveToRightEnd(): MathField;

  /**
   * Move cursor to the start of the previous block
   */
  moveToDirEnd(direction: number): MathField;

  /**
   * Get the text direction
   */
  keystroke(keys: string): MathField;

  /**
   * Type text
   */
  typedText(text: string): MathField;

  /**
   * Register a handler
   */
  config(options: MathFieldConfig): MathField;

  /**
   * Reflow the math field (recalculate layout)
   */
  reflow(): MathField;

  /**
   * Get the element
   */
  el(): HTMLElement;

  /**
   * Trigger reflow when text changes
   */
  __controller?: any;
}

export interface StaticMath {
  /**
   * Get the LaTeX representation
   */
  latex(): string;

  /**
   * Restore the original HTML element
   */
  revert(): HTMLElement;

  /**
   * Get the element
   */
  el(): HTMLElement;

  /**
   * Internal math field reference
   */
  mathField?: MathField;
}

export interface MathFieldConfig {
  /**
   * Space behaves like tab for navigation
   */
  spaceBehavesLikeTab?: boolean;

  /**
   * Left/Right arrow key behavior when entering/leaving a command
   */
  leftRightIntoCmdGoes?: 'up' | 'down';

  /**
   * Restrict to only math commands (no text mode)
   */
  restrictMismatchedBrackets?: boolean;

  /**
   * Sum typing behavior
   */
  sumStartsWithNEquals?: boolean;

  /**
   * Sup/sub behavior
   */
  supSubsRequireOperand?: boolean;

  /**
   * Character substitutions
   */
  charsThatBreakOutOfSupSub?: string;

  /**
   * Auto commands (automatically convert text to commands)
   */
  autoCommands?: string;

  /**
   * Auto operators (automatically convert text to operators)
   */
  autoOperatorNames?: string;

  /**
   * Substitutions for ASCII input
   */
  substituteTextarea?: () => HTMLElement;

  /**
   * Handler functions
   */
  handlers?: {
    /**
     * Called when field is edited
     */
    edit?: (mathField: MathField) => void;

    /**
     * Called when field receives focus
     */
    enter?: (mathField: MathField) => void;

    /**
     * Called when cursor moves up/down
     */
    upOutOf?: (mathField: MathField) => void;
    downOutOf?: (mathField: MathField) => void;

    /**
     * Called when cursor moves left/right out of field
     */
    moveOutOf?: (dir: number, mathField: MathField) => void;

    /**
     * Called when selection changes
     */
    selectOutOf?: (dir: number, mathField: MathField) => void;

    /**
     * Called when delete at edge of field
     */
    deleteOutOf?: (dir: number, mathField: MathField) => void;

    /**
     * Called when reflow is triggered
     */
    reflow?: () => void;
  };

  /**
   * Maximum depth for nested expressions
   */
  maxDepth?: number;

  /**
   * Ignore next mousedown event (for managing focus)
   */
  ignoreNextMousedown?: (mousedown: MouseEvent) => boolean;
}

/**
 * Global MathQuill object attached to window
 */
declare global {
  interface Window {
    MathQuill?: {
      getInterface: {
        (version: number): MathQuillInterface;
        MIN: number;
        MAX: number;
      };
      noConflict(): any;
    };
    jQuery?: any;
    $?: any;
  }
}
