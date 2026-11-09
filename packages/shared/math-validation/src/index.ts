import { latexEqual as le } from './latex-equal.js';
import type { Latex, Opts } from './options.js';

export type { Latex, LiteralOpts, Mode, Opts, SymbolicOpts } from './options.js';

export const latexEqual = (a: Latex, b: Latex, opts: Opts): boolean => {
  return le(a, b, opts);
};
