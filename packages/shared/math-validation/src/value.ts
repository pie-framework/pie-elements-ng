import { LatexToAst } from './conversion/latex-to-ast.js';
import type { Latex } from './options.js';

/** A rational in lowest terms with a positive denominator, so equal values have equal parts. */
type Rational = { n: bigint; d: bigint };

const lta = new LatexToAst({ keepMixedNumbers: true, exactNumbers: true });

// Wider exponents compare as literal, so `1E999999` can't stall a comparison.
const MAX_EXPONENT = 1000;

const gcd = (a: bigint, b: bigint): bigint => {
  let [x, y] = [a < 0n ? -a : a, b < 0n ? -b : b];
  while (y) {
    [x, y] = [y, x % y];
  }
  return x;
};

const rational = (n: bigint, d: bigint): Rational | undefined => {
  if (d === 0n) {
    return undefined;
  }
  const g = gcd(n, d);
  const sign = d < 0n ? -1n : 1n;
  return { n: (sign * n) / g, d: (sign * d) / g };
};

const negate = (r?: Rational): Rational | undefined => r && { n: -r.n, d: r.d };

const divide = (a?: Rational, b?: Rational): Rational | undefined =>
  a && b && b.n !== 0n ? rational(a.n * b.d, a.d * b.n) : undefined;

/**
 * 10 to the power `n`, built from its digits. Not `10n ** BigInt(n)`: the bundlers compile at
 * es2015, which lowers `**` to `Math.pow`, and `Math.pow` throws on a BigInt (PIE-1513).
 */
const powerOfTen = (n: number): bigint => BigInt(`1${'0'.repeat(n)}`);

const isNode = (node: unknown, operator: string, arity: number): node is any[] =>
  Array.isArray(node) && node[0] === operator && node.length === arity + 1;

/** An unsigned number, read from its digits as written, so `0.1` is exactly 1/10 and no digit is lost. */
const decimal = (node: unknown): Rational | undefined => {
  const m = isNode(node, 'decimal', 1) && /^(\d+)(?:\.(\d*))?(?:E([+-]?\d+))?$/.exec(node[1]);
  if (!m) {
    return undefined;
  }
  const [, whole, decimals = '', exponent = '0'] = m;
  const shift = Number(exponent) - decimals.length;
  if (Math.abs(shift) > MAX_EXPONENT) {
    return undefined;
  }
  const digits = BigInt(whole + decimals);
  return shift >= 0
    ? rational(digits * powerOfTen(shift), 1n)
    : rational(digits, powerOfTen(-shift));
};

const integer = (node: unknown): Rational | undefined =>
  isNode(node, 'decimal', 1) && /^\d+$/.test(node[1]) ? decimal(node) : undefined;

/** A fraction's numerator or denominator: a decimal with at most one minus sign. */
const part = (node: unknown): Rational | undefined =>
  isNode(node, '-', 1) ? negate(decimal(node[1])) : decimal(node);

const unsigned = (node: unknown): Rational | undefined => {
  if (isNode(node, '/', 2)) {
    return divide(part(node[1]), part(node[2]));
  }
  if (isNode(node, 'mixed', 2) && isNode(node[2], '/', 2)) {
    const whole = integer(node[1]);
    const fraction = divide(integer(node[2][1]), integer(node[2][2]));
    return whole && fraction && rational(whole.n * fraction.d + fraction.n, fraction.d);
  }
  return decimal(node);
};

/**
 * The value of LaTeX that is a single number: an integer, decimal, fraction (`\frac` or `/`)
 * or mixed number, with at most one sign, optionally in parentheses. Undefined for anything
 * else, an operation, constant, unit or percentage included.
 */
const parseValue = (latex: Latex): Rational | undefined => {
  if (typeof latex !== 'string' || !latex.trim()) {
    return undefined;
  }
  let tree: unknown;
  try {
    tree = lta.convert(latex);
  } catch (e) {
    return undefined;
  }
  return isNode(tree, '-', 1) ? negate(unsigned(tree[1])) : unsigned(tree);
};

/**
 * Compares by value when either side is a single number: equal when both are and their values are
 * equal, unequal when only one is. Undefined when neither is, which leaves the comparison to the mode.
 */
export const compareNumbers = (a: Latex, b: Latex): boolean | undefined => {
  const x = parseValue(a);
  const y = parseValue(b);
  if (!x && !y) {
    return undefined;
  }
  return !!x && !!y && x.n === y.n && x.d === y.d;
};
