import { latexEqual as le } from './latex-equal';
import type { Latex, Opts } from './options';

export type { Latex, LiteralOpts, Mode, Opts, SymbolicOpts } from './options';

export const latexEqual = (a: Latex, b: Latex, opts: Opts): boolean => {
  return le(a, b, opts);
};
