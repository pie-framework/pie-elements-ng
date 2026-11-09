import { mathjs } from '../mathjs';
import type { MathNode } from 'mathjs';
import { sort } from '../node-sort';
import type { LiteralOpts } from '../options';

export type { LiteralOpts };

const { simplify } = mathjs;

const simplifyRule = { l: 'tzn(n1, n2)', r: 'n1' };

export const isMathEqual = (a: MathNode, b: MathNode, opts?: LiteralOpts) => {
  if (opts && opts.allowTrailingZeros) {
    a = simplify(a, [simplifyRule]);
    b = simplify(b, [simplifyRule]);
  }

  if (opts && opts.ignoreOrder) {
    a = sort(a);

    b = sort(b);
  }

  return a.equals(b);
};
