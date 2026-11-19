import { latexEqual } from '../index.js';

const symbolic = { mode: 'symbolic' as const };

// [a, b, equal]: inequalities whose coefficients come from getCoefficients' simplify fallback.
const inequalities: [string, string, boolean][] = [
  ['\\frac{x-18}{5}<0', '0<\\frac{x-18}{5}', false],
  ['\\frac{x-18}{5}<0', '-\\left(\\frac{x-18}{5}\\right)<0', false],
  ['\\frac{x-18}{5}<0', '0<-\\left(\\frac{x-18}{5}\\right)', true],
  ['\\frac{5}{2}-\\frac{x-4}{2}<0', '0<-\\left(\\frac{5}{2}-\\frac{x-4}{2}\\right)', true],
];

describe('verdicts do not depend on earlier calls', () => {
  it('scores inequalities the same after an equation took the simplify fallback', () => {
    const score = () => inequalities.map(([a, b]) => latexEqual(a, b, symbolic));
    const expected = inequalities.map(([, , equal]) => equal);

    expect(score()).toEqual(expected);
    // Its coefficients need the fallback that drops a leading minus, which inequalities must not get.
    latexEqual('x^2+6x+5=0', '-x^2-6x-5=0', symbolic);
    expect(score()).toEqual(expected);
  });
});
