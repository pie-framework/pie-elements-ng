// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

const question = (extra: object = {}) => ({
  markup: '<p>{{0}}</p>',
  choices: { 0: [{ label: 'Paris', value: '0' }, { label: 'Paree', value: '1' }] },
  ...extra,
});
const session = { id: '1', value: { 0: 'Paris' } };
const gathering = { mode: 'gather', role: 'student' };

describe('answer key in the view model', () => {
  it('leaves the accepted answers and their traces out for a student gathering', async () => {
    const out = await model(question({ maxLengthPerChoiceEnabled: false }) as any, session as any, gathering as any);
    expect(out.choices).toEqual({});
    expect(out.maxLengthPerChoice).toEqual([]);
    expect(out.showNote).toBe(false);
  });

  it('keeps the input cap, enabled by default, for a student gathering', async () => {
    const out = await model(question() as any, session as any, gathering as any);
    expect(out.maxLengthPerChoice[0]).toBeGreaterThan(0);
  });

  it('includes them when evaluating or for an instructor', async () => {
    for (const env of [{ mode: 'evaluate', role: 'student' }, { mode: 'gather', role: 'instructor' }]) {
      const out = await model(question({ maxLengthPerChoiceEnabled: false }) as any, session as any, env as any);
      expect(out.choices[0][0].label, env.mode).toBe('Paris');
      expect(out.maxLengthPerChoice[0], env.mode).toBeGreaterThan(0);
      expect(out.showNote, env.mode).toBe(true);
    }
  });
});
