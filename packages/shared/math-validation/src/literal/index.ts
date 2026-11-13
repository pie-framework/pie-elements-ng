import { mathjs, TRAILING_ZEROS_RULE } from '../mathjs.js';
import type { MathNode } from 'mathjs';
import { sort } from '../node-sort.js';
import type { LiteralOpts } from '../options.js';

const { simplify } = mathjs;

export const isMathEqual = (a: MathNode, b: MathNode, opts?: LiteralOpts) => {
  if (opts && opts.allowTrailingZeros) {
    a = simplify(a, [TRAILING_ZEROS_RULE]);
    b = simplify(b, [TRAILING_ZEROS_RULE]);
  }

  if (opts && opts.ignoreOrder) {
    a = sort(a);

    b = sort(b);
  }

  return a.equals(b);
};
