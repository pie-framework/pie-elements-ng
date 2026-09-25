import { describe, expect, it } from 'vitest';
import { model, outcome } from '../src/controller/index.js';

const question = { correctResponse: [{ id: 1, value: 5 }], partsPerModel: 5 };
const untouched = { id: '1', element: 'fraction-model-element' };

describe('fraction-model untouched session', () => {
  it('scores a session without answers as empty', async () => {
    const result = await outcome(question, untouched, { mode: 'evaluate' });

    expect(result).toEqual({ score: 0, empty: true });
  });

  it('reports a session without answers as unanswered in evaluate mode', async () => {
    const result = await model(question, untouched, { mode: 'evaluate' });

    expect(result.correctness).toEqual({ score: '0%', correctness: 'unanswered' });
  });
});
