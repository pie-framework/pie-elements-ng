import { AstToMathJs } from '../conversion/ast-to-mathjs.js';
import { LatexToAst } from '../conversion/latex-to-ast.js';
import {
  denominatorFactors,
  expansionTerms,
  hasVariableDenominator,
  hasVariableExponentOfSum,
  haveSameDenominatorZeros,
  isTooLargeToExpand,
  multipliedSums,
  multipliedTerms,
} from '../symbolic/expansion.js';
import { getVariables } from '../symbolic/utils.js';

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
    // a variable exponent can simplify to a constant, so a sum under one can't be bounded
    ['(x+1)^{y}', Number.POSITIVE_INFINITY],
    ['(x+1)^{8+0x}', Number.POSITIVE_INFINITY],
    ['2^{x+1}', 0],
    ['x^{y}', 0],
  ])('%s multiplies %s sums', (latex, count) => {
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
    ['(x+1)^{4}+(x+2)^{4}', 32],
    ['(x+1)^{y}', Number.POSITIVE_INFINITY],
  ])('%s has %s terms multiplied out', (latex, terms) => {
    expect(expansionTerms(node(latex))).toBe(terms);
  });
});

describe('multipliedTerms', () => {
  it.each([
    ['x+1', 0],
    ['x^{1000}+x', 0],
    ['(x+1)^{4}', 16],
    ['3(x+1)^{4}', 16],
    // a lone term beside an expansion is only collected
    ['(x+1)^{4}+1', 16],
    ['(x+1)^{4}+\\sqrt{x}', 16],
    ['(x+1)^{4}+(x+2)^{4}', 32],
    ['-(x+1)^{4}-(x+2)^{4}', 32],
  ])('%s multiplies out to %s terms', (latex, terms) => {
    expect(multipliedTerms(node(latex))).toBe(terms);
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
    '(x+1)^{y}',
    '(x+1)^{8+0x}',
    // each part is small, but rationalize collects their sum slowly
    '(x+1)^{4}+(x+2)^{4}',
    '(x+1)(x+2)(x+3)(x+4)+(x+5)(x+6)(x+7)(x+8)',
    // as many terms as (x+1)^{4}, but over 8 variables
    '(a+b)(c+d)(f+g)(h+k)',
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
    '2^{x+1}',
    'x^{y}',
    '(x+1)^{4}+1',
    '(x+1000)^{4}+1',
    '(x+1)^{4}+\\sqrt{x}',
  ])('%s is not', (latex) => {
    expect(isTooLargeToExpand(node(latex))).toBe(false);
  });
});

describe('hasVariableExponentOfSum', () => {
  it.each(['(x+1)^{y}', '(x+1)^{-y}', '3(x+y)^{n}+1'])('%s has one', (latex) => {
    expect(hasVariableExponentOfSum(node(latex))).toBe(true);
  });

  it.each(['2^{x}', 'x^{y}', '(x+1)^{8}', '\\left|x+1\\right|^{y}'])('%s has none', (latex) => {
    expect(hasVariableExponentOfSum(node(latex))).toBe(false);
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

describe('denominatorFactors', () => {
  it.each([
    ['\\frac{1}{x}', ['x']],
    ['\\frac{(x+1)^{5}}{x(x+2)}', ['x', 'x+2']],
    ['\\frac{1}{x^{2}}+\\frac{1}{x}', ['x']],
    ['(x+1)^{5}x^{-1}(x+2)^{-1}', ['x', 'x+2']],
    ['-\\frac{1}{-x}', ['x']],
    ['\\frac{x}{2}', []],
    ['(x+1)^{8}', []],
  ])('%s has %j', (latex, factors) => {
    expect(denominatorFactors(node(latex)).map(String)).toEqual(
      factors.map((factor) => node(factor).toString())
    );
  });
});

describe('haveSameDenominatorZeros', () => {
  const same = (a: string, b: string) => {
    const [first, second] = [node(a), node(b)];
    const variables = [...new Set([...getVariables(first), ...getVariables(second)])];
    return haveSameDenominatorZeros(first, second, variables);
  };

  it.each([
    ['\\frac{(x+1)^{5}}{x}', '(x+1)^{5}x^{-1}'],
    ['\\frac{(x+1)^{5}}{x(x+2)}', '\\frac{(x+1)^{5}}{x^{2}+2x}'],
    ['\\frac{1}{x}', '\\frac{1}{2x^{3}}'],
    ['(x+1)^{8}', '(1+x)^{8}'],
  ])('%s and %s are undefined at the same places', (a, b) => {
    expect(same(a, b)).toBe(true);
  });

  it.each([
    // a removable hole
    ['\\frac{x^{6}-1}{x-1}', 'x^{5}+x^{4}+x^{3}+x^{2}+x+1'],
    ['\\frac{(x+1)^{5}}{x}', '\\frac{(x+1)^{5}}{x+1}'],
    ['\\frac{1}{x(x+2)}', '\\frac{1}{x(x-2)}'],
  ])('%s and %s are not', (a, b) => {
    expect(same(a, b)).toBe(false);
  });

  // a factor written out, repeated or spread over several fractions is zero at the same values (PIE-1540)
  it.each([
    ['\\frac{(x+1)^{5}}{x^{2}(x+2)}', '\\frac{(x+1)^{5}}{x^{3}+2x^{2}}'],
    ['(x+1)^{5}(x-1)^{-2}', '\\frac{(x+1)^{5}}{x^{2}-2x+1}'],
    ['\\frac{x+2}{x^{2}-1}', '\\frac{1}{x-1}+\\frac{1}{x^{2}-1}'],
    ['\\frac{1}{0.5x+1}', '\\frac{1}{x+2}'],
    ['\\frac{1}{x^{2}y}', '\\frac{1}{xy\\cdot x}'],
    ['\\frac{1}{x^{3}y+2x^{2}y}', '\\frac{1}{x^{2}y(x+2)}'],
    ['\\frac{1}{x^{2}+2xy+y^{2}}', '\\frac{1}{(x+y)^{2}}'],
    // the other factors still match
    ['\\frac{1}{(x^{3}+2x^{2})\\sqrt{x}}', '\\frac{1}{x^{2}(x+2)\\sqrt{x}}'],
    // 1/x and x cancel as factors, so a fraction inside a denominator hides a hole, as in 1.4.3
    ['\\frac{(x+1)^{8}}{\\frac{1}{x}}', 'x(x+1)^{8}'],
  ])('%s and %s are zero at the same values', (a, b) => {
    expect(same(a, b)).toBe(true);
    expect(same(b, a)).toBe(true);
  });

  it.each([
    // a hole at x = -2, at x = -1, and where x = -2 for any y
    ['\\frac{1}{x^{3}+2x^{2}}', '\\frac{1}{x^{2}}'],
    ['\\frac{1}{x^{3}-x}', '\\frac{1}{x(x-1)}'],
    ['\\frac{1}{x^{3}y+2x^{2}y}', '\\frac{1}{x^{2}y}'],
    // zeros are compared over the complex numbers, where x^2+2 has two
    ['\\frac{1}{x^{2}+1}', '\\frac{1}{(x^{2}+1)(x^{2}+2)}'],
    // the other factors differ
    ['\\frac{1}{(x^{3}+2x^{2})\\sqrt{x}}', '\\frac{1}{x^{2}(x+2)\\left|x\\right|}'],
    // the same zeros, but undecided, so kept apart: past the degree limit, and past the safe integers
    ['\\frac{1}{x^{25}+x^{24}}', '\\frac{1}{x(x+1)}'],
    ['\\frac{1}{x^{3}+10^{16}x^{2}}', '\\frac{1}{x^{2}(x+10^{16})}'],
  ])('%s and %s are not zero at the same values', (a, b) => {
    expect(same(a, b)).toBe(false);
    expect(same(b, a)).toBe(false);
  });
});
