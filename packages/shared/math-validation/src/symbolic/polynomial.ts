import type { MathNode } from 'mathjs';

// Exact arithmetic on polynomials with rational coefficients, to decide whether two denominators are
// zero at the same points: no sample point lands on one. Every number stays a safe integer. A factor
// past the size limits is not a polynomial here, and a result that would not fit or a comparison past
// its budget leaves the question undecided, so the caller keeps its conservative answer (PIE-1540).

// a factor with a higher degree or more terms than this is not multiplied out
const MAX_DEGREE = 24;
const MAX_TERMS = 100;
// the term operations one comparison may take, which keeps it to milliseconds whatever it is given
const MAX_STEPS = 100000;

type Rational = [number, number];
type Term = { exponents: number[]; coefficient: Rational };
// keyed by the exponents of the variables, in the order of the variable list
export type Polynomial = Map<string, Term>;
type Budget = { steps: number };

class Undecided extends Error {}

const spend = (budget: Budget, steps: number) => {
  budget.steps -= steps;
  if (budget.steps < 0) {
    throw new Undecided();
  }
};

const safe = (n: number): number => {
  if (!Number.isSafeInteger(n)) {
    throw new Undecided();
  }
  return n;
};

const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const r = x % y;
    x = y;
    y = r;
  }
  return x;
};

const rational = (numerator: number, denominator: number): Rational => {
  if (denominator === 0) {
    throw new Undecided();
  }
  const divisor = gcd(numerator, denominator) * (denominator < 0 ? -1 : 1);
  return [safe(numerator / divisor), safe(denominator / divisor)];
};

const sum = ([a, b]: Rational, [c, d]: Rational): Rational => {
  const g = gcd(b, d);
  return rational(safe(safe(a * (d / g)) + safe(c * (b / g))), safe(b * (d / g)));
};

const product = ([a, b]: Rational, [c, d]: Rational): Rational => {
  const g = gcd(a, d) || 1;
  const h = gcd(c, b) || 1;
  return rational(safe((a / g) * (c / h)), safe((b / h) * (d / g)));
};

const reciprocal = ([a, b]: Rational): Rational => rational(b, a);

// a number as the decimal it is written as: the Fraction for 0.1 holds the nearest binary value, whose
// denominator is not a safe integer, but 0.1 prints as 0.1. Once simplified, a decimal is a quotient of
// integers that hold that binary value, read exactly when they fit.
const decimal = (value: number): Rational => {
  if (Number.isSafeInteger(value)) {
    return [value, 1];
  }

  const match = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/.exec(String(value));

  if (!match) {
    throw new Undecided();
  }

  const [, sign, whole, fraction = '', exponent = '0'] = match;
  const digits = safe(Number(`${sign}${whole}${fraction}`));
  const scale = fraction.length - Number(exponent);

  return scale > 0
    ? rational(digits, safe(Number(`1e${scale}`)))
    : [safe(digits * Number(`1e${-scale}`)), 1];
};

// the value of a ConstantNode: a number, or the Fraction that the Fraction config of mathjs makes
const rationalOf = (value: unknown): Rational => {
  if (typeof value === 'number') {
    return decimal(value);
  }

  if (value !== null && typeof value === 'object' && 's' in value && 'n' in value && 'd' in value) {
    const { s, n, d } = value as { s: number; n: number; d: number };
    return Number.isSafeInteger(n) && Number.isSafeInteger(d)
      ? rational(s * n, d)
      : decimal((s * n) / d);
  }

  throw new Undecided();
};

const keyOf = (exponents: number[]) => exponents.join(',');

const addTerm = (p: Polynomial, exponents: number[], coefficient: Rational) => {
  const key = keyOf(exponents);
  const existing = p.get(key);
  const total = existing ? sum(existing.coefficient, coefficient) : coefficient;

  if (total[0] === 0) {
    p.delete(key);
  } else {
    p.set(key, { exponents, coefficient: total });
  }
};

const constant = (value: Rational, size: number): Polynomial => {
  const p: Polynomial = new Map();
  addTerm(
    p,
    Array.from({ length: size }, () => 0),
    value
  );
  return p;
};

const plus = (p: Polynomial, q: Polynomial, budget: Budget): Polynomial => {
  const result: Polynomial = new Map(p);
  spend(budget, q.size);
  q.forEach(({ exponents, coefficient }) => {
    addTerm(result, exponents, coefficient);
  });
  return result;
};

const negated = (p: Polynomial): Polynomial => {
  const result: Polynomial = new Map();
  p.forEach(({ exponents, coefficient: [a, b] }) => {
    result.set(keyOf(exponents), { exponents, coefficient: [-a, b] });
  });
  return result;
};

const times = (p: Polynomial, q: Polynomial, budget: Budget): Polynomial => {
  const result: Polynomial = new Map();
  spend(budget, p.size * q.size);
  p.forEach((s) => {
    q.forEach((t) => {
      addTerm(
        result,
        s.exponents.map((e, i) => e + t.exponents[i]),
        product(s.coefficient, t.coefficient)
      );
    });
  });
  return result;
};

const degree = (p: Polynomial): number => {
  let result = 0;
  p.forEach(({ exponents }) => {
    result = Math.max(
      result,
      exponents.reduce((total, e) => total + e, 0)
    );
  });
  return result;
};

// the value of a polynomial without variables; undefined when it has some
const constantValue = (p: Polynomial): Rational | undefined => {
  if (p.size === 0) {
    return [0, 1];
  }

  if (degree(p) > 0) {
    return undefined;
  }

  let value: Rational = [0, 1];
  p.forEach(({ coefficient }) => {
    value = coefficient;
  });
  return value;
};

const power = (p: Polynomial, n: number, size: number, budget: Budget): Polynomial => {
  let result = constant([1, 1], size);
  let base = p;
  let k = n;

  while (k > 0) {
    if (k % 2 === 1) {
      result = times(result, base, budget);
    }
    k = Math.floor(k / 2);
    if (k > 0) {
      base = times(base, base, budget);
    }
  }

  return result;
};

const bounded = (p: Polynomial): Polynomial => {
  if (p.size > MAX_TERMS || degree(p) > MAX_DEGREE) {
    throw new Undecided();
  }
  return p;
};

const convert = (node: MathNode, variables: string[], budget: Budget): Polynomial => {
  const size = variables.length;
  const of = (n: MathNode) => convert(n, variables, budget);

  if (node.isParenthesisNode && node.content) {
    return of(node.content);
  }

  if (node.isConstantNode) {
    return constant(rationalOf(node.value), size);
  }

  if (node.isSymbolNode) {
    const index = variables.indexOf(node.name as string);

    if (index < 0) {
      throw new Undecided();
    }

    const p: Polynomial = new Map();
    addTerm(
      p,
      variables.map((_, i) => (i === index ? 1 : 0)),
      [1, 1]
    );
    return p;
  }

  if (!node.isOperatorNode || !node.args || node.args.length === 0) {
    throw new Undecided();
  }

  const [first, second] = node.args;

  switch (node.fn) {
    case 'add':
      return node.args.map(of).reduce((p, q) => bounded(plus(p, q, budget)));
    case 'subtract':
      return bounded(plus(of(first), negated(of(second)), budget));
    case 'unaryMinus':
      return negated(of(first));
    case 'unaryPlus':
      return of(first);
    case 'multiply':
      return node.args.map(of).reduce((p, q) => bounded(times(p, q, budget)));
    case 'divide': {
      // only a constant denominator keeps a polynomial; [0, 1] stands for anything else
      const [numerator, denominator] = constantValue(of(second)) || [0, 1];

      if (numerator === 0) {
        throw new Undecided();
      }

      return times(of(first), constant(rational(denominator, numerator), size), budget);
    }
    case 'pow': {
      // only a constant integer exponent keeps a polynomial; [0, 0] stands for anything else
      const [n, denominator] = constantValue(of(second)) || [0, 0];

      if (denominator !== 1) {
        throw new Undecided();
      }

      const base = of(first);

      // a constant may have a negative exponent, as 2^{-1} does
      if (n < 0 && constantValue(base)) {
        const raised = constantValue(power(base, -n, size, budget));
        return constant(reciprocal(raised as Rational), size);
      }

      if (n < 0 || degree(base) * n > MAX_DEGREE) {
        throw new Undecided();
      }

      return bounded(power(base, n, size, budget));
    }
    default:
      throw new Undecided();
  }
};

/**
 * A factor as a polynomial in the given variables, or undefined when it is not one (a function, a
 * variable under a fraction bar or in an exponent, a root) or is too large to multiply out.
 */
export const toPolynomial = (node: MathNode, variables: string[]): Polynomial | undefined => {
  try {
    const p = bounded(convert(node, variables, { steps: MAX_STEPS }));
    return p.size > 0 ? p : undefined;
  } catch {
    return undefined;
  }
};

const compareExponents = (a: number[], b: number[]): number => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return 0;
};

// the largest term in lexicographic order
const leadingTerm = (p: Polynomial): Term => {
  let lead: Term | undefined;

  for (const term of p.values()) {
    if (!lead || compareExponents(term.exponents, lead.exponents) > 0) {
      lead = term;
    }
  }

  if (!lead) {
    throw new Undecided();
  }

  return lead;
};

// what is left of p after taking away multiples of g: empty exactly when g divides p. A single
// polynomial is a Groebner basis of the multiples of it, so the result does not depend on the steps
// taken, and the remainder of a product is the remainder of the product of the remainders.
const remainder = (p: Polynomial, g: Polynomial, budget: Budget): Polynomial => {
  const lead = leadingTerm(g);
  const rest: Polynomial = new Map(p);
  const result: Polynomial = new Map();

  while (rest.size > 0) {
    spend(budget, rest.size + g.size);
    const top = leadingTerm(rest);
    const shift = top.exponents.map((e, i) => e - lead.exponents[i]);

    if (shift.some((e) => e < 0)) {
      rest.delete(keyOf(top.exponents));
      result.set(keyOf(top.exponents), top);
    } else {
      const factor = product(top.coefficient, reciprocal(lead.coefficient));
      g.forEach(({ exponents, coefficient: [a, b] }) => {
        addTerm(
          rest,
          exponents.map((e, i) => e + shift[i]),
          product([-a, b], factor)
        );
      });
    }
  }

  return result;
};

// whether g is zero wherever the product of `others` is zero: g then divides a power of that product
// (Hilbert's Nullstellensatz), and no power above g's degree is needed, since each factor of g appears
// in g at most that many times
const zerosLieIn = (g: Polynomial, others: Polynomial[], size: number, budget: Budget): boolean => {
  const n = degree(g);

  if (n === 0) {
    return true;
  }

  const remainders = others.map((other) => remainder(other, g, budget));

  // g divides one of them, so it is zero only where that one is
  if (remainders.some((r) => r.size === 0)) {
    return true;
  }

  const base = remainders.reduce(
    (acc, r) => remainder(times(acc, r, budget), g, budget),
    remainder(constant([1, 1], size), g, budget)
  );
  let raised = base;

  for (let k = 1; raised.size > 0; k++) {
    if (k >= n) {
      return false;
    }
    raised = remainder(times(raised, base, budget), g, budget);
  }

  return true;
};

/**
 * Whether two products of polynomials are zero at the same points, complex ones included: each factor
 * of one is zero only where the other product is. undefined when exact arithmetic can't decide it
 * cheaply.
 */
export const haveSameZeros = (
  first: Polynomial[],
  second: Polynomial[],
  variables: string[]
): boolean | undefined => {
  const budget: Budget = { steps: MAX_STEPS };
  const size = variables.length;

  try {
    return (
      first.every((g) => zerosLieIn(g, second, size, budget)) &&
      second.every((g) => zerosLieIn(g, first, size, budget))
    );
  } catch {
    return undefined;
  }
};
