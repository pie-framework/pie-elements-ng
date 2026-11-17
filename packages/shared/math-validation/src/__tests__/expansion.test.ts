import { AstToMathJs } from '../conversion/ast-to-mathjs.js';
import { LatexToAst } from '../conversion/latex-to-ast.js';
import {
  expansionTerms,
  hasVariableDenominator,
  isTooLargeToExpand,
  multipliedSums,
} from '../symbolic/expansion.js';

const lta = new LatexToAst();
const atm = new AstToMathJs();

const node = (latex: string) => atm.convert(lta.convert(latex));

describe('multipliedSums', () => {
  it.each([
    ['x', 0],
    ['x+1', 1],
    ['x^{1000}', 0],
    ['(x+1)(x+2)', 2],
    ['(x+1)^{8}', 8],
    ['(x+1)^{2\\cdot4}', 8],
    ['(x+1)^{\\frac{16}{2}}', 8],
    ['(x+1)^{8.0}', 8],
    ['((x+1)^{2})^{4}', 8],
    ['(x+1)^{4}(x+2)^{4}', 8],
    ['\\frac{1}{(x+1)^{8}}', 8],
    ['(x+1)^{-8}', 8],
    ['\\sin(x)+(x+1)^{8}', 8],
    ['\\sin\\left((x+1)^{8}\\right)', 0],
    ['(x+1)^{y}', 1],
  ])('%s multiplies %i sums', (latex, count) => {
    expect(multipliedSums(node(latex))).toBe(count);
  });
});

describe('expansionTerms', () => {
  it.each([
    ['x', 1],
    ['a+b+c', 3],
    ['(a+b)(c+d)', 4],
    ['(x+1)^{8}', 256],
    ['(a+b+c+d)^{3}', 64],
    ['x^{1000}', 1],
    ['\\frac{x+1}{x+2}', 4],
  ])('%s has %i terms multiplied out', (latex, terms) => {
    expect(expansionTerms(node(latex))).toBe(terms);
  });
});

describe('isTooLargeToExpand', () => {
  it.each([
    '(x+1)^{5}',
    '(x+1)^{8.0}',
    '(x+y)^{5}',
    '(a+b+c+d)^{3}',
    '(a+b+c+d)(f+g+h+k)',
    '(x+1)^{2}(x+2)^{2}(x+3)^{2}',
    '\\sin(x)+(x+1)^{8}',
    '\\frac{1}{(x+1)^{8}}',
  ])('%s is too large', (latex) => {
    expect(isTooLargeToExpand(node(latex))).toBe(true);
  });

  it.each([
    '2x+3',
    '(x+1)^{4}',
    '(x+y)^{4}',
    '(a+b+c+d)^{2}',
    '(x+1)(x+2)(x+3)(x+4)',
    'x^{1000}',
    'a+b+c+d+f+g+h+k+m+n+p+q',
    '(x+1)^{y}',
  ])('%s is not', (latex) => {
    expect(isTooLargeToExpand(node(latex))).toBe(false);
  });
});

describe('hasVariableDenominator', () => {
  it.each(['\\frac{1}{x}', '\\frac{x^{6}-1}{x-1}', '(x+1)^{-2}', 'x^{-1}'])(
    '%s has one',
    (latex) => {
      expect(hasVariableDenominator(node(latex))).toBe(true);
    }
  );

  it.each(['\\frac{x}{2}', '(x+1)^{8}', 'x^{y}'])('%s has none', (latex) => {
    expect(hasVariableDenominator(node(latex))).toBe(false);
  });
});
