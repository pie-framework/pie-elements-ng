import { mathjs, TRAILING_ZEROS_RULE, type ExpressionNode } from '../mathjs.js';

const SIMPLIFY_RULES = Object.freeze([
  { l: 'n1^(1/n2)', r: 'nthRoot(n1, n2)' },
  { l: 'sqrt(n1)', r: 'nthRoot(n1, 2)' },
  { l: 'nthRoot(-1, 2)', r: 'i' },
  { l: '(v1-v2)/n', r: 'v1/n-v2/n' },
  { l: '(v1-n)/n', r: 'v1/n-1' },
  { l: 'n/n1-c1', r: '(n-c1*n1)/n1' },
  { l: 'i^2', r: '-1' },
  { l: 'pi', r: '3.141592653589793' },
  { l: 'n/(n*n1)', r: '1/n1' },
  { l: 'c1/(c2*(n3))', r: '(c1/c2)*(1/n3)' },
  { l: 'n1/(n(n+1)+1(n+1))', r: 'n1/((n+1)^2)' },

  // perfect square formula
  { l: '(n1 + n2) ^ 2', r: '(n1 ^ 2) + 2*n1*n2 + (n2 ^ 2)' },

  TRAILING_ZEROS_RULE,
  { l: 'n1/(-n2)', r: '-(n1/n2)' },
  { l: 'sin(n*pi)', r: '0' },

  // logarithm rules
  { l: 'log(n1*n2, n3)', r: 'log(n1, n3)+log(n2,n3)' },
  { l: 'log(n1/n2, n3)', r: 'log(n1, n3)-log(n2,n3)' },
  { l: 'log(n1^n2, n3)', r: 'n2*log(n1,n3)' },

  // trigonometry: defining relations for tangent, cotangent, secant, and cosecant in terms of sine and cosine
  { l: 'sin(n)/cos(n)', r: 'tan(n)' },
  { l: 'csc(n)', r: '1/sin(n)' },
  { l: 'sec(n)', r: '1/cos(n)' },
  { l: 'cot(n)', r: '1/tan(n)', r1: 'cos(n)/sin(n)' },
  { l: '1/tan(n)', r: 'cos(n)/sin(n)' },

  // TO DO: the Pythagorean formula for sines and cosines.

  // inverse trigonometric functions relations
  { l: 'n1 == asin(n)', r: 'n == sin(n1)' },
  { l: 'n1 == acos(n)', r: 'n == cos(n1)' },
  { l: 'n1 == atan(n)', r: 'n == tan(n1)' },
  { l: 'n1 == acot(n)', r: 'n == cot(n1)' },
  { l: 'n1 == asec(n)', r: 'n == sec(n1)' },
  { l: 'n1 == acsc(n)', r: 'n == csc(n1)' },

  // relationships between trigonometric functions and inverse trigonometric functions
  { l: 'sin(asin(n))', r: 'n' },
  { l: 'cos(acos(n))', r: 'n' },
  { l: 'tan(atan(n))', r: 'n' },
  { l: 'sin(acsc(n))', r: '1/n' },
  { l: 'cos(asec(n))', r: '1/n' },
  { l: 'tan(acot(n))', r: '1/n' },
]);

// The default rules of mathjs 9.5.2. Later releases fold constants before collecting like terms,
// so n/6 - 5/6 no longer becomes (n - 5)/6, and some of their new rules loop on powers of sums.
const MATHJS_9_RULES = Object.freeze([
  mathjs.simplifyCore,
  { l: 'log(e)', r: '1' },
  { l: 'n-n1', r: 'n+-n1' },
  { l: '-(c*v)', r: '(-c) * v' },
  { l: '-v', r: '(-1) * v' },
  { l: 'n/n1^n2', r: 'n*n1^-n2' },
  { l: 'n/n1', r: 'n*n1^-1' },
  { l: '(n ^ n1) ^ n2', r: 'n ^ (n1 * n2)' },
  { l: 'n*n', r: 'n^2' },
  { l: 'n * n^n1', r: 'n^(n1+1)' },
  { l: 'n^n1 * n^n2', r: 'n^(n1+n2)' },
  { l: 'n+n', r: '2*n' },
  { l: 'n+-n', r: '0' },
  { l: 'n1*n2 + n2', r: '(n1+1)*n2' },
  { l: 'n1*n3 + n2*n3', r: '(n1+n2)*n3' },
  { l: 'n1 + -1 * (n2 + n3)', r: 'n1 + -1 * n2 + -1 * n3' },
  mathjs.simplifyConstant,
  { l: '(-n)*n1', r: '-(n*n1)' },
  { l: 'c+v', r: 'v+c', context: { add: { commutative: false } } },
  { l: 'v*c', r: 'c*v', context: { multiply: { commutative: false } } },
  { l: 'n+-n1', r: 'n-n1' },
  { l: 'n*(n1^-1)', r: 'n/n1' },
  { l: 'n*n1^-n2', r: 'n/n1^n2' },
  { l: 'n1^-1', r: '1/n1' },
  { l: 'n*(n1/n2)', r: '(n*n1)/n2' },
  { l: 'n-(n1+n2)', r: 'n-n1-n2' },
  { l: '1*n', r: 'n' },
  { l: 'n1/(n2/n3)', r: '(n1*n3)/n2' },
]);

// mathjs copies the rules it is given, so the combined list is built once.
const RULES = [...SIMPLIFY_RULES, ...MATHJS_9_RULES];

export const simplify = (v: ExpressionNode | string): ExpressionNode =>
  mathjs.simplify(v, RULES as never);
