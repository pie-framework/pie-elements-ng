// Controllers also run server-side, so these run without a DOM.
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { outcome } from '../src/controller/index.js';

const EVALUATE = { mode: 'evaluate' } as const;
const question = (answer: string, validation: 'literal' | 'symbolic' = 'symbolic') =>
  ({ responseType: 'Simple', responses: [{ id: '1', answer, validation, alternates: {} }] }) as any;

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
