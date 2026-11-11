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

const arithmetic = new LatexToAst({ exactNumbers: true });

// Wider powers are left to the mode, so `10^{10^{9}}` can't stall a comparison.
const MAX_POWER_DIGITS = 10000;

const add = (a?: Rational, b?: Rational): Rational | undefined =>
  a && b && rational(a.n * b.d + b.n * a.d, a.d * b.d);

const multiply = (a?: Rational, b?: Rational): Rational | undefined =>
  a && b && rational(a.n * b.n, a.d * b.d);

/** `x` to the power `k` by squaring. Not `x ** k`, which es2015 lowers to `Math.pow` (PIE-1513). */
const raise = (x: bigint, k: bigint): bigint => {
  let result = 1n;
  let base = x;
  for (let e = k; e > 0n; e /= 2n) {
    if (e % 2n === 1n) {
      result *= base;
    }
    if (e > 1n) {
      base *= base;
    }
  }
  return result;
};

/** Digits of the longer of numerator and denominator: a power `k` has at most `k` times as many. */
const digitCount = (r: Rational): number =>
  Math.max((r.n < 0n ? -r.n : r.n).toString().length, r.d.toString().length);

/** An integer power; undefined for any other exponent, `0` to a negative power, or a result too large. */
const power = (base?: Rational, exponent?: Rational): Rational | undefined => {
  if (!base || !exponent || exponent.d !== 1n || (base.n === 0n && exponent.n < 0n)) {
    return undefined;
  }
  const k = exponent.n < 0n ? -exponent.n : exponent.n;
  if (BigInt(digitCount(base)) * k > BigInt(MAX_POWER_DIGITS)) {
    return undefined;
  }
  const [n, d] = [raise(base.n, k), raise(base.d, k)];
  return exponent.n < 0n ? rational(d, n) : rational(n, d);
};

/** The exact value of a tree made only of numbers, `+`, `-`, `*`, `/` and integer powers. */
const exactValue = (node: unknown): Rational | undefined => {
  if (isNode(node, 'decimal', 1)) {
    return decimal(node);
  }
  if (!Array.isArray(node) || node.length < 2) {
    return undefined;
  }
  const [operator, ...operands] = node as unknown[];
  if (
    operator !== '+' &&
    operator !== '-' &&
    operator !== '*' &&
    operator !== '/' &&
    operator !== '^'
  ) {
    return undefined;
  }
  const values: Rational[] = [];
  for (const operand of operands) {
    const value = exactValue(operand);
    if (!value) {
      return undefined;
    }
    values.push(value);
  }
  const [x, y] = values;
  switch (operator) {
    case '+':
      return values.slice(1).reduce<Rational | undefined>((sum, v) => add(sum, v), x);
    case '*':
      return values.slice(1).reduce<Rational | undefined>((product, v) => multiply(product, v), x);
    case '-':
      return values.length === 1 ? negate(x) : values.length === 2 ? add(x, negate(y)) : undefined;
    case '/':
      return values.length === 2 ? divide(x, y) : undefined;
    default:
      return values.length === 2 ? power(x, y) : undefined;
  }
};

const arithmeticValue = (latex: Latex): Rational | undefined => {
  if (typeof latex !== 'string' || !latex.trim()) {
    return undefined;
  }
  let tree: unknown;
  try {
    tree = arithmetic.convert(latex);
  } catch (e) {
    return undefined;
  }
  // Outside the try: a failure in the arithmetic itself, such as `**` lowered to `Math.pow` on a
  // BigInt (PIE-1513), must surface, not fall back to the tolerant mode unnoticed.
  return exactValue(tree);
};

/**
 * Compares exactly when both sides are made only of numbers and arithmetic, such as
 * `123456789.00001`, `2\times10^6` or `\frac{1}{3}+\frac{1}{6}`. As floats, numbers of 16 or more
 * digits round, and the tolerance the symbolic mode keeps for pi and trigonometric functions
 * matches numbers that differ in their 14th digit (PIE-905, PIE-1418). Undefined when either side
 * has anything else, a variable, function, constant, angle, unit or percentage included, which
 * leaves the comparison to the mode.
 */
export const compareArithmetic = (a: Latex, b: Latex): boolean | undefined => {
  const x = arithmeticValue(a);
  const y = x && arithmeticValue(b);
  return x && y ? x.n === y.n && x.d === y.d : undefined;
};
