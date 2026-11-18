import type { MathNode } from 'mathjs';
import { numeric } from '../mathjs.js';
import { sort } from '../node-sort.js';
import { haveSameZeros, type Polynomial, toPolynomial } from './polynomial.js';
import { getVariables, haveProportionalValues } from './utils.js';

// mathjs rationalize multiplies out powers and products of sums with simplify rules, and its time grows
// steeply with the number of sums it multiplies and the terms that produces: (x+1)^7 takes 2.4 s,
// (x+1)^8 19 s, (x+y)^5 3 s, (a+b+c+d)^3 8 s, and (x+1)^4+(x+2)^4+(x+3)^4+(x+4)^4 5 s although
// each part is small (PIE-1532). Past these limits nothing is multiplied out.
const MAX_MULTIPLIED_SUMS = 4;
const MAX_TERMS = 16;
// terms times variables, since collecting each term costs more with more variables:
// (a+b)(c+d)(f+g)(h+k) is slower than (x+1)^4, which has as many terms
const MAX_TERM_COST = 64;

const children = (node: MathNode): MathNode[] => {
  const result: MathNode[] = [];
  node.forEach((child) => {
    result.push(child);
  });
  return result;
};

// the value of an exponent without variables, such as 8, 2*4, 16/2 or 8.0; undefined when it has a variable.
// An exponent that can't be evaluated counts as infinite, so that it never lets an expansion through.
const constantExponent = (node: MathNode): number | undefined => {
  if (getVariables(node).length > 0) {
    return undefined;
  }

  try {
    // ast-to-mathjs writes 8.0 as tzn(8, 1)
    const value = numeric.evaluate(node.toString(), { tzn: (n: number) => n });
    return typeof value === 'number' && !Number.isNaN(value) ? value : Number.POSITIVE_INFINITY;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
};

// a power of a base that counts as `count`, where `empty` is the count of a base without a sum
const powerOf = (
  count: number,
  empty: number,
  exponent: MathNode | undefined,
  raise: (count: number, n: number) => number
) => {
  const value = exponent ? constantExponent(exponent) : undefined;

  if (value !== undefined) {
    return raise(count, Math.ceil(Math.abs(value)));
  }

  // a variable exponent leaves a single term alone, as in 2^x, but it can still simplify to a constant
  // before rationalize gets it, as 8+0x does, so a sum under one can't be bounded
  return count === empty ? count : Number.POSITIVE_INFINITY;
};

// how many sums are multiplied together when the expression is multiplied out: a product or a quotient adds
// its factors' counts, and a power multiplies its base's count by the exponent, so x^1000 multiplies none.
// rationalize leaves function arguments alone, so a function counts as a variable.
export const multipliedSums = (node: MathNode): number => {
  if (node.isParenthesisNode && node.content) {
    return multipliedSums(node.content);
  }

  if (node.isFunctionNode) {
    return 0;
  }

  if (node.isOperatorNode && node.args) {
    const counts = node.args.map(multipliedSums);

    switch (node.fn) {
      case 'add':
      case 'subtract':
        return Math.max(1, ...counts);
      case 'multiply':
      case 'divide':
        return counts.reduce((sum, count) => sum + count, 0);
      case 'pow':
        return powerOf(counts[0] ?? 0, 0, node.args[1], (count, n) => count * n);
      default:
        return Math.max(0, ...counts);
    }
  }

  return Math.max(0, ...children(node).map(multipliedSums));
};

// how many terms multiplying the expression out produces: a sum adds its parts' terms, a product or a quotient
// multiplies them, and a power raises them to the exponent
export const expansionTerms = (node: MathNode): number => {
  if (node.isParenthesisNode && node.content) {
    return expansionTerms(node.content);
  }

  if (node.isFunctionNode) {
    return 1;
  }

  if (node.isOperatorNode && node.args) {
    const terms = node.args.map(expansionTerms);

    switch (node.fn) {
      case 'add':
      case 'subtract':
        return terms.reduce((sum, t) => sum + t, 0);
      case 'multiply':
      case 'divide':
        return terms.reduce((product, t) => product * t, 1);
      case 'pow':
        return powerOf(terms[0] ?? 1, 1, node.args[1], (t, n) => t ** n);
      default:
        return Math.max(1, ...terms);
    }
  }

  return Math.max(1, ...children(node).map(expansionTerms));
};

// the terms that multiplying out produces in the products and powers of sums; a lone term beside them,
// such as the 1 or the \sqrt{x} in (x+1)^4+1 or (x+1)^4+\sqrt{x}, is only collected, which is cheap
export const multipliedTerms = (node: MathNode): number => {
  if (node.isParenthesisNode && node.content) {
    return multipliedTerms(node.content);
  }

  if (node.isFunctionNode) {
    return 0;
  }

  if (node.isOperatorNode && node.args) {
    switch (node.fn) {
      case 'add':
      case 'subtract':
      case 'unaryMinus':
      case 'unaryPlus':
        return node.args.reduce((sum, arg) => sum + multipliedTerms(arg), 0);
      case 'multiply':
      case 'divide':
      case 'pow':
        return multipliedSums(node) >= 2 ? expansionTerms(node) : 0;
      default:
        return Math.max(0, ...node.args.map(multipliedTerms));
    }
  }

  return Math.max(0, ...children(node).map(multipliedTerms));
};

// whether rationalize would take too long to multiply the expression out; a single sum multiplies nothing
export const isTooLargeToExpand = (node: MathNode): boolean => {
  const sums = multipliedSums(node);

  if (!(sums <= MAX_MULTIPLIED_SUMS)) {
    return true;
  }

  if (sums < 2) {
    return false;
  }

  const terms = multipliedTerms(node);

  return !(terms <= MAX_TERMS && terms * Math.max(1, getVariables(node).length) <= MAX_TERM_COST);
};

// a sum under a variable exponent, as in (x+1)^y. It is never multiplied out, since the exponent can
// simplify to a constant on the way, but it isn't sampled either: where the base is negative the power
// isn't real, so sample points can't tell (x+1)^y from |x+1|^y.
export const hasVariableExponentOfSum = (node: MathNode): boolean =>
  node.filter((n) => {
    if (!n.isOperatorNode || n.fn !== 'pow' || !n.args) {
      return false;
    }

    const [base, exponent] = n.args;

    return (
      !!base && !!exponent && multipliedSums(base) > 0 && constantExponent(exponent) === undefined
    );
  }).length > 0;

// a variable in a denominator, as in 1/x or (x+1)^(-2). Sample points can't see where it is zero, so they
// would match (x^6-1)/(x-1) with x^5+x^4+x^3+x^2+x+1, which is an open decision (PIE-1465), not a size question.
export const hasVariableDenominator = (node: MathNode): boolean =>
  node.filter((n) => {
    if (!n.isOperatorNode || !n.args) {
      return false;
    }

    const [first, second] = n.args;

    if (n.fn === 'divide') {
      return !!second && getVariables(second).length > 0;
    }

    if (n.fn === 'pow' && first && second && getVariables(first).length > 0) {
      const exponent = constantExponent(second);
      return exponent !== undefined && !(exponent >= 0);
    }

    return false;
  }).length > 0;

// the factors of a product, with each power's base standing for the power: x^2(x+2) gives x and x+2
const factorsOf = (node: MathNode): MathNode[] => {
  if (node.isParenthesisNode && node.content) {
    return factorsOf(node.content);
  }

  if (node.isOperatorNode && node.args) {
    const [first, second] = node.args;

    if (node.fn === 'multiply') {
      return node.args.flatMap(factorsOf);
    }

    if (node.fn === 'unaryMinus' && first) {
      return factorsOf(first);
    }

    if (node.fn === 'pow' && first && second) {
      const exponent = constantExponent(second);
      if (exponent !== undefined && exponent > 0) {
        return factorsOf(first);
      }
    }
  }

  return [node];
};

/**
 * The distinct factors with a variable in the denominators of an expression, as in 1/x, (x+1)^(-2)
 * or x^2(x+2) under a fraction bar, with each power's base standing for the power.
 */
export const denominatorFactors = (node: MathNode): MathNode[] => {
  const factors = new Map<string, MathNode>();

  node.traverse((n) => {
    if (!n.isOperatorNode || !n.args) {
      return;
    }

    const [first, second] = n.args;
    let denominator: MathNode | undefined;

    if (n.fn === 'divide') {
      denominator = second;
    } else if (n.fn === 'pow' && first && second) {
      const exponent = constantExponent(second);
      denominator = exponent !== undefined && exponent < 0 ? first : undefined;
    }

    for (const factor of denominator ? factorsOf(denominator) : []) {
      if (getVariables(factor).length > 0) {
        factors.set(sort(factor).toString(), factor);
      }
    }
  });

  return [...factors.values()];
};

const productOf = (factors: MathNode[]): MathNode =>
  numeric.parse(factors.map((factor) => `(${factor.toString()})`).join(' * ') || '1');

// the factors that are polynomials, and the others, such as \sqrt{x}, |x| or a fraction
const splitPolynomials = (factors: MathNode[], variables: string[]) => {
  const polynomials: Polynomial[] = [];
  const others: MathNode[] = [];

  for (const factor of factors) {
    const polynomial = toPolynomial(factor, variables);

    if (polynomial) {
      polynomials.push(polynomial);
    } else {
      others.push(factor);
    }
  }

  return { polynomials, others };
};

// whether the denominators of two expressions are zero at the same values. Values at sample points
// can't see a single point such as x = 1, so a removable hole, as in (x^6-1)/(x-1) against
// x^5+x^4+x^3+x^2+x+1, would match without this (PIE-1465).
export const haveSameDenominatorZeros = (
  a: MathNode,
  b: MathNode,
  variables: string[]
): boolean => {
  const first = denominatorFactors(a);
  const second = denominatorFactors(b);

  // the same factors, up to a constant. A fraction inside a denominator counts as a factor, so in
  // (x+1)^8/(1/x) the factors 1/x and x cancel, and it matches x(x+1)^8 as in 1.4.3.
  if (haveProportionalValues(productOf(first), productOf(second), variables)) {
    return true;
  }

  // a factor can also be written out, as x^3+2x^2 is x^2(x+2) and x^2-2x+1 is (x-1)^2 (PIE-1540).
  // Exact arithmetic then decides whether the polynomials are zero at the same values, and the other
  // factors must still match. When it can't decide, the two stay apart.
  const firstSplit = splitPolynomials(first, variables);
  const secondSplit = splitPolynomials(second, variables);
  const othersMatch =
    firstSplit.others.length + secondSplit.others.length === 0 ||
    haveProportionalValues(productOf(firstSplit.others), productOf(secondSplit.others), variables);

  return (
    othersMatch &&
    haveSameZeros(firstSplit.polynomials, secondSplit.polynomials, variables) === true
  );
};
