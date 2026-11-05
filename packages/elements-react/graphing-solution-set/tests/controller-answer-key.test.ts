import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

const answers = {
  correctAnswer: {
    name: 'Correct Answer',
    marks: [{ type: 'line', building: false, from: { x: 1, y: 1 }, to: { x: 2, y: 2 }, fill: 'Solid' }],
  },
};

const render = (env: object) => model({ answers } as any, { answer: [] } as any, env as any);

describe('answer key in the view model', () => {
  it('leaves the answers out for a student gathering', async () => {
    const out = await render({ mode: 'gather', role: 'student' });
    expect(out).not.toHaveProperty('answers');
    expect(out.correctResponse).toBeUndefined();
  });

  it('includes them when evaluating or for an instructor', async () => {
    expect((await render({ mode: 'evaluate', role: 'student' })).answers).toEqual(answers);
    expect((await render({ mode: 'gather', role: 'instructor' })).answers).toEqual(answers);
  });
});
