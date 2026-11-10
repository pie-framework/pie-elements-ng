// Controllers also run server-side, so these run without a DOM.
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { outcome, validate } from '../src/controller/index.js';
import { DIGIT_ZEROS, inSystem, systemName } from '@workspace/packages/shared/controller-utils/tests/digit-systems.js';

const EVALUATE = { mode: 'evaluate' } as const;
const question = (answer: string, validation: 'literal' | 'symbolic' = 'symbolic', options = {}) =>
  ({ responseType: 'Simple', responses: [{ id: '1', answer, validation, alternates: {}, ...options }] }) as any;

describe('response normalization', () => {
  it('scores digits typed in another system against an ASCII answer', async () => {
    for (const response of ['١٢', '۱۲', '१२']) {
      const result = await outcome(question('12'), { id: '1', response } as any, EVALUATE as any);
      expect(result.score, response).toBe(1);
    }
  });

  it('reads the Arabic decimal separator as a point, in symbolic and literal validation', async () => {
    for (const validation of ['symbolic', 'literal'] as const) {
      const result = await outcome(question('3.5', validation), { id: '1', response: '٣٫٥' } as any, EVALUATE as any);
      expect(result.score, validation).toBe(1);
    }
  });

  it('still scores a wrong number 0', async () => {
    const result = await outcome(question('12'), { id: '1', response: '١٣' } as any, EVALUATE as any);
    expect(result.score).toBe(0);
  });
});

describe('a decimal comma', () => {
  const score = async (answer: string, response: string, env: object, validation: 'literal' | 'symbolic' = 'symbolic', model = {}) =>
    (await outcome({ ...question(answer, validation), ...model }, { id: '1', response } as any, { ...EVALUATE, ...env } as any))
      .score;

  it('reads a comma between digits as the decimal point where the locale region writes one', async () => {
    for (const validation of ['symbolic', 'literal'] as const) {
      expect(await score('2.5', '2,5', { locale: 'es-ES' }, validation), validation).toBe(1);
      expect(await score('2.5', '2{,}5', { locale: 'de-DE' }, validation), validation).toBe(1);
      expect(await score('2.5', '2.5', { locale: 'es-ES' }, validation), validation).toBe(1);
    }
  });

  it("takes the model's language before the environment's locale", async () => {
    expect(await score('2.5', '2,5', { locale: 'en-US' }, 'symbolic', { language: 'fr-FR' })).toBe(1);
    expect(await score('2.5', '2,5', { locale: 'fr-FR' }, 'symbolic', { language: 'en-US' })).toBe(0);
  });

  it('keeps the point for an underscore code, which names no region', async () => {
    expect(await score('2.5', '2,5', { locale: 'en-US' }, 'symbolic', { language: 'es_ES' })).toBe(0);
    expect(await score('1000', '1,000', {}, 'literal', { language: 'es_ES' })).toBe(1);
  });

  it('reads a semicolon as the list separator there', async () => {
    expect(await score('(1;5)', '(1;5)', { locale: 'es-ES' })).toBe(1);
    expect(await score('(1;5)', '(1,5)', { locale: 'es-ES' })).toBe(0);
    expect(await score('(2;500)', '\\left(2; 500\\right)', { locale: 'de-DE' })).toBe(1);
  });

  it('does not read a list of two numbers as one number with a thousands comma', async () => {
    for (const validation of ['symbolic', 'literal'] as const) {
      expect(await score('2500', '(2;500)', { locale: 'de-DE' }, validation), validation).toBe(0);
      expect(await score('2500', '2;500', { locale: 'de-DE' }, validation), validation).toBe(0);
    }
  });

  it('reads a repeating decimal and leaves a number with two marks as typed', async () => {
    expect(await score('0.\\overline{3}', '0,\\overline{3}', { locale: 'es-ES' })).toBe(1);
    expect(await score('1000.5', '1.000,5', { locale: 'de-DE' })).toBe(0);
  });

  it('keeps the comma a list separator without a region or in a point-decimal region', async () => {
    for (const locale of ['es', 'es-US', 'en-US', undefined]) {
      expect(await score('2.5', '2,5', { locale }), locale).toBe(0);
      expect(await score('(1,5)', '(1,5)', { locale }), locale).toBe(1);
    }
  });
});

describe('every Unicode digit system', () => {
  it('scores whole and decimal numbers against their ASCII answer, in symbolic and literal validation', async () => {
    const score = async (answer: string, response: string, validation: 'literal' | 'symbolic') =>
      (await outcome(question(answer, validation), { id: '1', response } as any, EVALUATE as any)).score;
    for (const zero of DIGIT_ZEROS) {
      const name = systemName(zero);
      for (const validation of ['symbolic', 'literal'] as const) {
        expect(await score('2024', inSystem(zero, '2024'), validation), `${name} ${validation}`).toBe(1);
        expect(await score('3.5', inSystem(zero, '3٫5'), validation), `${name} ${validation}`).toBe(1);
        expect(await score('2024', inSystem(zero, '2025'), validation), `${name} ${validation}`).toBe(0);
      }
    }
  });
});

describe('literal validation that compares numbers by value', () => {
  const score = async (answer: string, response: string, compareNumbersByValue = true) =>
    (await outcome(question(answer, 'literal', { compareNumbersByValue }), { id: '1', response } as any, EVALUATE as any))
      .score;

  it('accepts a single number equal in value', async () => {
    expect(await score('6', '6.0')).toBe(1);
    expect(await score('\\frac{2}{3}', '4/6')).toBe(1);
    expect(await score('2/4', '1/2')).toBe(1);
    expect(await score('2/2', '1')).toBe(1);
    expect(await score('0.5', '\\frac{1}{2}')).toBe(1);
    expect(await score('-0.75', '−\\frac{3}{4}')).toBe(1);
    expect(await score('-3', '\\frac{-6}{2}')).toBe(1);
  });

  it('accepts mixed numbers, a sign, parentheses and thousands separators', async () => {
    expect(await score('2\\frac{1}{2}', '2.5')).toBe(1);
    expect(await score('-2\\frac{1}{2}', '-\\frac{5}{2}')).toBe(1);
    expect(await score('6', '+6')).toBe(1);
    expect(await score('6', '(6)')).toBe(1);
    expect(await score('1000', '1,000')).toBe(1);
  });

  it('rejects an expression with an operation or a different value', async () => {
    expect(await score('6', '3+3')).toBe(0);
    expect(await score('6', '2\\cdot3')).toBe(0);
    expect(await score('2\\frac{1}{2}', '2+\\frac{1}{2}')).toBe(0);
    expect(await score('6', '7')).toBe(0);
    expect(await score('1', '1/0')).toBe(0);
  });

  it('compares a key that is not a single number as literal', async () => {
    expect(await score('3+3', '3+3')).toBe(1);
    expect(await score('3+3', '6')).toBe(0);
  });

  it('is off unless the response sets it', async () => {
    expect(await score('\\frac{2}{3}', '4/6', false)).toBe(0);
  });
});
