import { latexEqual } from '../index.js';
import { compareArithmetic, compareNumbers } from '../value.js';

describe('compareNumbers', () => {
  it.each([
    '6',
    '+6',
    '-6',
    '−6',
    '(6)',
    '(-6)',
    '6.0',
    '.5',
    '1,000',
    '1{,}000',
    '1\\,000',
    '12345678901234567890',
    '2/3',
    '\\dfrac{2}{3}',
    '\\frac{2}{3}',
    '-\\frac{2}{3}',
    '\\frac{-2}{3}',
    '\\frac{1.5}{3}',
    '2\\frac{1}{2}',
    '-2\\frac{1}{2}',
  ])('reads %s as a number', (latex) => {
    expect(compareNumbers(latex, latex)).toBe(true);
  });

  it.each([
    '',
    ' ',
    '3+3',
    '2\\cdot3',
    '--6',
    'x',
    '6x',
    '\\pi',
    '50\\%',
    '\\sqrt{4}',
    '6cm',
    '\\frac{1}{0}',
    '\\frac{\\frac{1}{2}}{3}',
    '2+\\frac{1}{2}',
    '2\\frac{-1}{2}',
    '1,5',
    '1E999999',
    'r=\\sqrt{\\frac{V}{7\\pi}}',
    'x+1',
  ])('leaves %s to the mode', (latex) => {
    expect(compareNumbers(latex, latex)).toBeUndefined();
    expect(compareNumbers(latex, '6')).toBe(false);
  });
});

describe('compareNumbers precision', () => {
  it.each([
    ['0.1', '0.10000000000000001'],
    ['12345678901234567', '12345678901234568'],
    ['9007199254740993', '9007199254740992'],
    ['\\frac{1}{3}', '0.3333333333333333'],
    ['2\\frac{1}{3}', '2.3333333333333335'],
  ])('tells %s from %s', (a, b) => {
    expect(compareNumbers(a, b)).toBe(false);
  });

  it.each([
    ['\\frac{1}{3}', '\\frac{3333333333333333}{9999999999999999}'],
    ['12345678901234567', '12,345,678,901,234,567.000'],
    ['1E30', '1000000000000000000000000000000'],
  ])('equates %s and %s', (a, b) => {
    expect(compareNumbers(a, b)).toBe(true);
  });
});

describe('compareArithmetic', () => {
  it.each([
    ['12345678901234567', '12345678901234568', false],
    ['123456789.00001', '123456789', false],
    ['123456789-0.00001', '123456788.99999', true],
    ['(2+3)\\cdot4', '20', true],
    ['2\\times10^{6}', '2000000', true],
    ['1+10^{-17}', '1.00000000000000001', true],
    ['2^{-2}', '\\frac{1}{4}', true],
    ['\\frac{1}{3}', '0.3333333333333333', false],
  ])('compares %s and %s exactly', (a, b, equal) => {
    expect(compareArithmetic(a, b)).toBe(equal);
  });

  it.each([
    ['\\sqrt{4}', '2'],
    ['2^{0.5}', '1'],
    ['0^{-1}', '1'],
    ['\\frac{1}{0}', '1'],
    ['10^{10^{9}}', '1'],
    ['30°', '1'],
    ['\\pi', '3'],
    ['\\infty', '1'],
    ['50\\%', '0.5'],
    ['3x', '3'],
    ['x=1', '1'],
    ['1E999999', '1'],
  ])('leaves %s and %s to the mode', (a, b) => {
    expect(compareArithmetic(a, b)).toBeUndefined();
    expect(compareArithmetic(b, a)).toBeUndefined();
  });
});

describe('compareNumbersByValue', () => {
  const byValue = { mode: 'literal' as const, literal: { compareNumbersByValue: true } };

  it('is off by default, so literal still tells number forms apart', () => {
    expect(latexEqual('4/6', '2/3', { mode: 'literal' })).toBe(false);
    expect(latexEqual('4/6', '2/3', byValue)).toBe(true);
  });

  it('applies to literal only', () => {
    expect(
      latexEqual('3+3', '6', { mode: 'symbolic', literal: { compareNumbersByValue: true } })
    ).toBe(true);
  });

  it('leaves symbolic and literal mixed numbers as sums', () => {
    expect(latexEqual('2\\frac{1}{2}', '2+\\frac{1}{2}', { mode: 'symbolic' })).toBe(true);
    expect(latexEqual('2\\frac{1}{2}', '2+\\frac{1}{2}', { mode: 'literal' })).toBe(true);
    expect(latexEqual('2\\frac{1}{2}', '2+\\frac{1}{2}', byValue)).toBe(false);
  });
});
