// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

const question = () => ({ markup: '<p>{{0}}</p>', choices: { 0: [{ label: 'Paris', value: '0' }] } });
const session = { id: '1', value: { 0: 'Paris' } };

describe('answer key in the view model', () => {
  it('leaves the accepted answers out for a student gathering, keeping the input width', async () => {
    const out = await model(question() as any, session as any, { mode: 'gather', role: 'student' });
    expect(out.choices).toEqual({});
    expect(out.maxLengthPerChoice[0]).toBeGreaterThan(0);
  });

  it('includes them when evaluating or for an instructor', async () => {
    for (const env of [{ mode: 'evaluate', role: 'student' }, { mode: 'gather', role: 'instructor' }]) {
      const out = await model(question() as any, session as any, env as any);
      expect(out.choices[0][0].label, env.mode).toBe('Paris');
    }
  });
});
