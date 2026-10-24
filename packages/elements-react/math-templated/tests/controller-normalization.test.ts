// Controllers also run server-side, so these run without a DOM.
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { outcome } from '../src/controller/index.js';

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
