import { describe, expect, it } from 'vitest';
import { fractionToNumber } from '../src/fraction-to-number.js';

describe('fractionToNumber', () => {
  it('returns numeric values unchanged', () => {
    expect(fractionToNumber(1.25)).toBe(1.25);
  });

  it('parses simple fraction strings', () => {
    expect(fractionToNumber('1/2')).toBe(0.5);
    expect(fractionToNumber(' 3 / 4 ')).toBe(0.75);
  });

  it('parses decimal strings', () => {
    expect(fractionToNumber('1.25')).toBe(1.25);
  });

  it('converts mathjs-style fraction objects', () => {
    expect(fractionToNumber({ s: -1, n: 1, d: 2 })).toBe(-0.5);
  });
});
