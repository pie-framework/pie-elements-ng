// Controllers also run server-side, so these run without a DOM.
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { outcome } from '../src/controller/index.js';
import { DIGIT_ZEROS, inSystem, systemName } from '@workspace/packages/shared/controller-utils/tests/digit-systems.js';

const EVALUATE = { mode: 'evaluate' } as const;
const question = (answer: string) =>
  ({ responses: { '0': { answer, validation: 'symbolic', alternates: {} } } }) as any;
const session = (value: string) => ({ id: '1', answers: { r0: { value } } }) as any;

describe('response normalization', () => {
  it('scores digits and separators typed in Arabic-Indic against an ASCII answer', async () => {
    expect((await outcome(question('12'), session('١٢'), EVALUATE as any)).score).toBe(1);
    expect((await outcome(question('3.5'), session('٣٫٥'), EVALUATE as any)).score).toBe(1);
    expect((await outcome(question('12'), session('١٣'), EVALUATE as any)).score).toBe(0);
  });
});

describe('every Unicode digit system', () => {
  it('scores whole and decimal numbers against their ASCII answer', async () => {
    const score = async (answer: string, value: string) =>
      (await outcome(question(answer), session(value), EVALUATE as any)).score;
    for (const zero of DIGIT_ZEROS) {
      const name = systemName(zero);
      expect(await score('2024', inSystem(zero, '2024')), name).toBe(1);
      expect(await score('3.5', inSystem(zero, '3٫5')), name).toBe(1);
      expect(await score('2024', inSystem(zero, '2025')), name).toBe(0);
    }
  });
});
