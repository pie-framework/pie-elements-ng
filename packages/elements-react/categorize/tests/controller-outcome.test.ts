import { describe, expect, it } from 'vitest';
import { outcome } from '../src/controller/index.js';

const question = {
  categories: [{ id: 'c1', label: 'Fruit' }],
  choices: [{ id: 'ch1', content: 'Apple' }],
  correctResponse: [{ category: 'c1', choices: ['ch1'] }],
};

describe('categorize outcome', () => {
  it('scores an untouched session, which has no answers, as empty', async () => {
    const result = await outcome(question, { id: '1', element: 'categorize-element' }, { mode: 'evaluate' });

    expect(result).toMatchObject({ score: 0, empty: true });
  });
});
