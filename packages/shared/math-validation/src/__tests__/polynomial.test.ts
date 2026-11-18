import { AstToMathJs } from '../conversion/ast-to-mathjs.js';
import { LatexToAst } from '../conversion/latex-to-ast.js';
import { numeric } from '../mathjs.js';
import { haveSameZeros, type Polynomial, toPolynomial } from '../symbolic/polynomial.js';
import { getVariables } from '../symbolic/utils.js';

const lta = new LatexToAst();
const atm = new AstToMathJs();

const node = (latex: string) => atm.convert(lta.convert(latex));

const variablesOf = (latex: string[]) =>
  [...new Set(latex.flatMap((l) => getVariables(node(l))))].sort();

const sameZeros = (first: string[], second: string[]) => {
  const variables = variablesOf([...first, ...second]);
  const polynomials = (latex: string[]) =>
    latex.map((l) => toPolynomial(node(l), variables) as Polynomial);
  return haveSameZeros(polynomials(first), polynomials(second), variables);
};

describe('toPolynomial', () => {
  it.each([
    'x^{3}+2x^{2}',
    '(x+1)^{24}',
    'x^{2}y-3xy+\\frac{y}{2}',
    '\\frac{x}{3}+2^{-1}',
    '0.1x+0.25',
    '0.0001x+1',
    '(a+b+c+d)^{3}',
  ])('%s is a polynomial', (latex) => {
    const n = node(latex);
    expect(toPolynomial(n, getVariables(n))).toBeDefined();
  });

  it.each([
    '\\sqrt{x}',
    '\\left|x\\right|',
    '\\frac{1}{x}',
    'x^{-1}',
    'x^{0.5}',
    'x^{y}',
    '2^{x}',
    '\\sin x',
    // past the degree and term limits
    'x^{25}',
    '(x+1)^{30}',
    '(a+b+c+d+e+f)^{4}',
    // past the safe integers
    '10^{16}x',
    '2^{100}x+1',
  ])('%s is not', (latex) => {
    const n = node(latex);
    expect(toPolynomial(n, getVariables(n))).toBeUndefined();
  });

  it('reads decimals as the decimals they are written as', () => {
    expect(sameZeros(['0.1x+0.2'], ['x+2'])).toBe(true);
    expect(sameZeros(['0.1x+0.2'], ['x+2.000001'])).toBe(false);
  });

  it('reads plain numbers too', () => {
    const [first, second] = [numeric.parse('1e-7 * x + 2'), numeric.parse('x + 20000000')];
    expect(
      haveSameZeros(
        [toPolynomial(first, ['x']) as Polynomial],
        [toPolynomial(second, ['x']) as Polynomial],
        ['x']
      )
    ).toBe(true);
  });
});

describe('haveSameZeros', () => {
  it.each([
    [['x', 'x+2'], ['x^{3}+2x^{2}']],
    [['x-1'], ['x^{2}-2x+1']],
    [['x^{2}-1'], ['x-1', 'x^{2}-1']],
    [['x^{24}-1'], ['x^{12}-1', 'x^{12}+1']],
    [['(x+1)^{24}'], ['x+1']],
    [['x^{2}y'], ['x', 'y']],
    [['x^{3}y+2x^{2}y'], ['x', 'y', 'x+2']],
    [['x^{2}+2xy+y^{2}'], ['x+y']],
    [
      Array.from({ length: 30 }, (_, i) => `x+${i + 1}`),
      Array.from({ length: 30 }, (_, i) => `${i + 1}+x`),
    ],
    [[], []],
  ])('%j and %j are zero at the same values', (first, second) => {
    expect(sameZeros(first, second)).toBe(true);
    expect(sameZeros(second, first)).toBe(true);
  });

  it.each([
    [['x-1'], []],
    [['x'], ['x+1']],
    [['x(x+2)'], ['x(x-2)']],
    [['x^{3}+2x^{2}'], ['x^{2}']],
    [['x^{3}y+2x^{2}y'], ['x^{2}y']],
    // zeros are compared over the complex numbers, where x^2+2 has two
    [['x^{2}+1'], ['x^{2}+1', 'x^{2}+2']],
  ])('%j and %j are not', (first, second) => {
    expect(sameZeros(first, second)).toBe(false);
    expect(sameZeros(second, first)).toBe(false);
  });

  it.each([
    [['(x+2y)^{12}+3x'], ['(x-y)^{12}+y']],
    [['(x+y+z)^{12}+x'], ['(x-y+z)^{12}+y']],
    [
      ['(a+b+c+d)^{4}+1', '(a-b)^{3}+c'],
      ['(a+b+c-d)^{4}+2', '(a+b)^{3}-c'],
    ],
  ])('gives up quickly on %j and %j', (first, second) => {
    const start = performance.now();
    expect(sameZeros(first, second)).toBeUndefined();
    expect(performance.now() - start).toBeLessThan(1000);
  });
});
