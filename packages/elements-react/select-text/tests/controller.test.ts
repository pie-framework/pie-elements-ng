import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

describe('select-text controller', () => {
  it('resolves the evaluate model without feedback when no token is correct', async () => {
    const question = {
      text: 'The cat sat.',
      tokens: [{ text: 'The cat sat.', start: 0, end: 12 }],
      feedbackEnabled: true,
    };
    const session = { selectedTokens: [{ text: 'The cat sat.', start: 0, end: 12 }] };

    const { correctness, feedback } = (await model(question, session, {
      mode: 'evaluate',
      role: 'student',
    })) as Record<string, unknown>;

    expect(correctness).toBe('unknown');
    expect(feedback).toBeUndefined();
  });
});
