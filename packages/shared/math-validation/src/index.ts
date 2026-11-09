import { latexEqual as le } from "./latex-equal";
import { LiteralOpts } from "./literal";
export type Latex = string;

export type Opts = {
  mode?: "symbolic" | "literal";
  literal?: LiteralOpts;
};

export const latexEqual = (a: Latex, b: Latex, opts: Opts): boolean => {
  return le(a, b, opts);
};
