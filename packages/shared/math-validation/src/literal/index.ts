import { mathjs, TRAILING_ZEROS_RULE } from '../mathjs.js';
import type { MathNode } from 'mathjs';
import { sort } from '../node-sort.js';
import type { LiteralOpts } from '../options.js';

const { simplify } = mathjs;

// ignoreOrder only reorders terms and factors: a product of several fractions keeps them, and each sum
// and product is sorted after what is inside it, so that a fraction written in another order still
// matches (PIE-1541)
const REORDER = Object.freeze({ keepQuotients: true, innermostFirst: true });

export const isMathEqual = (a: MathNode, b: MathNode, opts?: LiteralOpts) => {
  if (opts && opts.allowTrailingZeros) {
    a = simplify(a, [TRAILING_ZEROS_RULE]);
    b = simplify(b, [TRAILING_ZEROS_RULE]);
  }

  if (opts && opts.ignoreOrder) {
    a = sort(a, REORDER);

    b = sort(b, REORDER);
  }

  return a.equals(b);
};
