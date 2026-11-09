import { LatexToAst } from "./conversion/latex-to-ast";

export type Latex = string;

/** A rational in lowest terms with a positive denominator, so equal values have equal parts. */
type Rational = { n: number; d: number };

const lta = new LatexToAst({ keepMixedNumbers: true });

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

const rational = (n: number, d: number): Rational | undefined => {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) {
    return undefined;
  }
  const g = gcd(n, d) || 1;
  const sign = d < 0 ? -1 : 1;
  return { n: (sign * n) / g, d: (sign * d) / g };
};

const negate = (r?: Rational): Rational | undefined => r && { n: -r.n, d: r.d };

const divide = (a?: Rational, b?: Rational): Rational | undefined =>
  a && b && b.n !== 0 ? rational(a.n * b.d, a.d * b.n) : undefined;

const isNode = (node: unknown, operator: string, arity: number): node is any[] =>
  Array.isArray(node) && node[0] === operator && node.length === arity + 1;

/** An unsigned number, read from its shortest decimal form so `0.1` is exactly 1/10. */
const decimal = (node: unknown): Rational | undefined => {
  const x = isNode(node, "tzn", 2) ? node[1] : node;
  if (typeof x !== "number" || !Number.isFinite(x) || x < 0) {
    return undefined;
  }
  const m = /^(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/.exec(String(x));
  if (!m) {
    return undefined;
  }
  const [, whole, decimals = "", exponent = "0"] = m;
  const digits = Number(whole + decimals);
  const shift = Number(exponent) - decimals.length;
  return shift >= 0 ? rational(digits * 10 ** shift, 1) : rational(digits, 10 ** -shift);
};

const integer = (node: unknown): Rational | undefined =>
  typeof node === "number" && Number.isInteger(node) ? decimal(node) : undefined;

/** A fraction's numerator or denominator: a decimal with at most one minus sign. */
const part = (node: unknown): Rational | undefined =>
  isNode(node, "-", 1) ? negate(decimal(node[1])) : decimal(node);

const unsigned = (node: unknown): Rational | undefined => {
  if (isNode(node, "/", 2)) {
    return divide(part(node[1]), part(node[2]));
  }
  if (isNode(node, "mixed", 2) && isNode(node[2], "/", 2)) {
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
  if (typeof latex !== "string" || !latex.trim()) {
    return undefined;
  }
  let tree: unknown;
  try {
    tree = lta.convert(latex);
  } catch (e) {
    return undefined;
  }
  return isNode(tree, "-", 1) ? negate(unsigned(tree[1])) : unsigned(tree);
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
