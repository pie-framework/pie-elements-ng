import { describe, it, expect, vi } from 'vitest';
import Matrix from '../index';

// The element renders math through MathJax, which happy-dom cannot load.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

customElements.define('matrix-session-test', Matrix);

const ROWS = 21;

// Every row answered in column 0, keyed `row-column` with 0-based indices as the delivery view does.
const answeredSession = () => ({
  value: Object.fromEntries(Array.from({ length: ROWS }, (_, row) => [`${row}-0`, 0])),
});

const answer = (session: { value: Record<string, number> }, matrixKey: string) => {
  const el = document.createElement('matrix-session-test') as Matrix;
  // no model: the element keeps the session without rendering
  el.session = session;
  el.sessionChanged({ matrixKey, matrixValue: 1 });
  return el.session.value;
};

describe('Matrix session', () => {
  it('keeps rows 11 to 20 when row 2 is answered', () => {
    const value = answer(answeredSession(), '1-1');

    for (let row = 10; row < 20; row++) {
      expect(value).toHaveProperty(`${row}-0`, 0);
    }
  });

  it.each(Array.from({ length: ROWS }, (_, row) => row))(
    'replaces only the previous answer of row index %i',
    (row) => {
      const value = answer(answeredSession(), `${row}-1`);

      const expected = { ...answeredSession().value, [`${row}-1`]: 1 };
      delete expected[`${row}-0`];
      expect(value).toEqual(expected);
    },
  );
});
