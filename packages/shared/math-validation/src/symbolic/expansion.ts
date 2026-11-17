import type { MathNode } from 'mathjs';
import { numeric } from '../mathjs.js';
import { getVariables } from './utils.js';

// mathjs rationalize multiplies out powers and products of sums with simplify rules, and its time grows
// steeply with the number of sums it multiplies and the terms that produces: (x+1)^7 takes 2.4 s,
// (x+1)^8 19 s, (x+y)^5 3 s and (a+b+c+d)^3 8 s (PIE-1532). Past these limits nothing is multiplied out.
const MAX_MULTIPLIED_SUMS = 4;
// terms times variables, since collecting each term costs more with more variables:
// (a+b+c+d)(f+g+h+k) is slower than (x+1)^4, which has as many terms
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

const powerOf = (
  count: number,
  exponent: MathNode | undefined,
  raise: (count: number, n: number) => number
) => {
  const value = exponent ? constantExponent(exponent) : undefined;
  // a variable exponent is never multiplied out: rationalize rejects it at once
  return value === undefined ? count : raise(count, Math.ceil(Math.abs(value)));
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
        return powerOf(counts[0] ?? 0, node.args[1], (count, n) => count * n);
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
        return powerOf(terms[0] ?? 1, node.args[1], (t, n) => t ** n);
      default:
        return Math.max(1, ...terms);
    }
  }

  return Math.max(1, ...children(node).map(expansionTerms));
};

// whether rationalize would take too long to multiply the expression out; a single sum multiplies nothing
export const isTooLargeToExpand = (node: MathNode): boolean => {
  const sums = multipliedSums(node);

  return !(
    sums <= MAX_MULTIPLIED_SUMS &&
    (sums < 2 || expansionTerms(node) * Math.max(1, getVariables(node).length) <= MAX_TERM_COST)
  );
};

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
