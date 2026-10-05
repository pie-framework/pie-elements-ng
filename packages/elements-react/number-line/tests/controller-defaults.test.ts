import { describe, expect, it } from 'vitest';
import defaults from '../src/controller/defaults.js';
import { createDefaultModel, model } from '../src/controller/index.js';

const PRISTINE = structuredClone(defaults);

const point = (domainPosition: number) => ({ type: 'point', pointType: 'full', domainPosition });

const question = (extra = {}) => ({
  graph: { domain: { min: 0, max: 5 }, width: 500, ticks: { minor: 0.5, major: 1 } },
  correctResponse: [point(1), point(2)],
  ...extra,
});

const FEEDBACK = {
  correct: { type: 'custom', custom: 'Spot on' },
  incorrect: { type: 'custom', custom: 'Try again' },
  partial: { type: 'custom', custom: 'Almost' },
};

const EVALUATE = { mode: 'evaluate', role: 'student' };
const GATHER = { mode: 'gather', role: 'student' };

describe('number-line controller defaults', () => {
  it.each([
    ['correct', [point(1), point(2)]],
    ['partial', [point(1), point(3)]],
    ['incorrect', [point(3), point(4)]],
  ] as const)(
    'keeps custom %s feedback out of a later item without feedback',
    async (type, answer) => {
      const custom = await model(question({ feedback: FEEDBACK }), { answer }, EVALUATE);
      const plain = await model(question(), { answer }, EVALUATE);

      expect(custom.feedback).toEqual({ type, message: FEEDBACK[type].custom });
      // The defaults set every feedback level to type 'none', which shows no message.
      expect(plain.feedback).toBeUndefined();
    }
  );

  it.each([
    ['an item without a graph', async () => ({})],
    ['a default model', () => createDefaultModel()],
  ])('leaves the defaults unchanged after rendering %s', async (_name, item) => {
    await model(await item(), {}, GATHER);

    expect(defaults).toEqual(PRISTINE);
  });
});
