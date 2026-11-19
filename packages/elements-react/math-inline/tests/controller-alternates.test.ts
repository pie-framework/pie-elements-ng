// Controllers also run server-side, so these run without a DOM.
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { outcome, validate } from '../src/controller/index.js';

const EVALUATE = { mode: 'evaluate' } as const;
const question = (answer: string, alternates: Record<string, unknown>) =>
  ({ responseType: 'Simple', responses: [{ id: '1', answer, validation: 'literal', alternates }] }) as any;
const score = async (q: any, response: string) => (await outcome(q, { id: '1', response } as any, EVALUATE as any)).score;

// Production item 5499805 stores its alternate as `{ answer, id }`.
const stored = question('n+9', { '20257845': { answer: '9+n', id: 20257845 } });

describe('alternates stored as { answer, id }', () => {
  it('scores the stored alternate', async () => {
    expect(await score(stored, '9+n')).toBe(1);
    expect(await score(stored, 'n+9')).toBe(1);
    expect(await score(stored, 'n+8')).toBe(0);
  });

  it('scores string and stored alternates side by side', async () => {
    const mixed = question('n+9', { '1': '9+n', '2': { answer: '3+n+6', id: 2 } });

    expect(await score(mixed, '9+n')).toBe(1);
    expect(await score(mixed, '3+n+6')).toBe(1);
  });

  it('skips a stored alternate without an answer', async () => {
    const empty = question('n+9', { '3': { id: 3 } });

    expect(await score(empty, 'n+9')).toBe(1);
    expect(await score(empty, '9+n')).toBe(0);
  });

  it('counts stored alternates in the trace log', async () => {
    const { logTrace } = await outcome(stored, { id: '1', response: '9+n' } as any, EVALUATE as any);

    expect(logTrace).toContain('Accepted answers: 2 (including alternates).');
  });

  it('validates a stored alternate by its answer', () => {
    const errors = validate({
      responseType: 'Simple',
      responses: [{ id: '1', answer: 'n+9', alternates: { a: { answer: 'n+9', id: 1 }, b: { answer: '', id: 2 } } }],
    } as any);

    expect(errors.responsesErrors?.[0]).toEqual({ a: 'Content should be unique.', b: 'Content should not be empty.' });
  });
});
