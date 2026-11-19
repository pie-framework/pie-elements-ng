// The options `latexEqual` takes. Kept free of mathjs imports so the published declarations don't need mathjs types.

export type Latex = string;

export type Mode = 'symbolic' | 'literal';

export type LiteralOpts = {
  allowTrailingZeros?: boolean;
  ignoreOrder?: boolean;
  /** A single number matches only a single number of equal value, so `4/6` matches `2/3` and `3+3` doesn't match `6`. */
  compareNumbersByValue?: boolean;
};

/** Symbolic mode takes no options. */
export type Opts = {
  mode?: Mode;
  literal?: LiteralOpts;
};
