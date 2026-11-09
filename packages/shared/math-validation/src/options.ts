// The options `latexEqual` takes. Kept free of mathjs imports so the published declarations don't need mathjs types.

export type Latex = string;

export type Mode = 'symbolic' | 'literal';

export type LiteralOpts = {
  allowTrailingZeros?: boolean;
  ignoreOrder?: boolean;
  /** A single number matches only a single number of equal value, so `4/6` matches `2/3` and `3+3` doesn't match `6`. */
  compareNumbersByValue?: boolean;

  /** For future implementation, per PD-304
   * If a response matches an "exception", it is incorrect, even if it also matches one of the correct answers
   */
  exception?: string[];
};

/** Symbolic mode takes no options yet. */
export type SymbolicOpts = Record<string, never>;

export type Opts = {
  mode?: Mode;
  literal?: LiteralOpts;
  symbolic?: SymbolicOpts;
};
