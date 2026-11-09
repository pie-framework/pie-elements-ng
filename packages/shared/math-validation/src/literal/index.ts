import { mathjs, TRAILING_ZEROS_RULE, type ExpressionNode } from '../mathjs.js';
import { sort } from '../node-sort.js';
import type { LiteralOpts } from '../options.js';

const { simplify } = mathjs;

export const isMathEqual = (a: ExpressionNode, b: ExpressionNode, opts?: LiteralOpts) => {
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
