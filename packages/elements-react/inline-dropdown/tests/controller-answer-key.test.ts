// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

const question = {
  markup: '<p>The {{0}} jumped.</p>',
  lockChoiceOrder: true,
  choices: { 0: [{ label: 'cow', value: 'a', correct: true }, { label: 'dog', value: 'b' }] },
};

const correctFlags = (out: any) => out.choices[0].map((choice: any) => choice.correct);

describe('answer key in the view model', () => {
  it('leaves the correct flags out for a student gathering', async () => {
    const out = await model(question as any, { id: '1' } as any, { mode: 'gather', role: 'student' });
    expect(out.choices[0].map((choice: any) => choice.value)).toEqual(['a', 'b']);
    expect(correctFlags(out)).toEqual([undefined, undefined]);
  });

  it('includes them when evaluating or for an instructor', async () => {
    for (const env of [{ mode: 'evaluate', role: 'student' }, { mode: 'gather', role: 'instructor' }]) {
      const out = await model(question as any, { id: '1' } as any, env as any);
      expect(correctFlags(out), env.mode).toEqual([true, undefined]);
    }
  });
});
