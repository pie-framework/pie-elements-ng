import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

// `model()` rewrites the graph's ticks in place, so each call gets its own question.
const question = () => ({
  prompt: '<p>Plot the number 0.5</p>',
  correctResponse: [],
  graph: {
    arrows: { left: true, right: true },
    availableTypes: { PF: true },
    domain: { min: -1, max: 1 },
    initialElements: [],
    initialType: 'PF',
    maxNumberOfPoints: 1,
    ticks: { minor: 0.125, major: 0.5, tickIntervalType: 'Decimal' },
    width: 500,
  },
});

const session = { answer: [{ type: 'point', pointType: 'full', domainPosition: 0.5 }] };

describe('number-line controller', () => {
  it.each(['student', 'instructor'])(
    'resolves the %s evaluate model without feedback when the item has no correct response',
    async (role) => {
      const result = await model(question(), session, { mode: 'evaluate', role });

      expect(result).toMatchObject({
        prompt: '<p>Plot the number 0.5</p>',
        graph: { domain: { min: -1, max: 1 } },
        corrected: { noCorrectResponse: true },
      });
      expect(result.feedback).toBeUndefined();
    }
  );
});
