import { describe, expect, it } from 'vitest';
import { validate } from '../src/controller/index.js';
import type { GraphingModel } from '../src/types.js';

const points = (count: number) => Array.from({ length: count }, (_, x) => ({ type: 'point' as const, x, y: 0 }));
const errorsFor = (markLimits: GraphingModel['markLimits'], correct = 2, alternate = 2) =>
  validate({
    toolbarTools: ['point'],
    markLimits,
    answers: {
      correctAnswer: { name: 'Correct Answer', marks: points(correct) },
      alternate1: { name: 'Alternate 1', marks: points(alternate) },
    },
  }).correctAnswerErrors;

describe('validate against mark limits', () => {
  it('flags an answer holding more marks of a tool than its limit', () => {
    expect(errorsFor({ point: 2 }, 3, 2)).toEqual({
      correctAnswer: 'This answer has more point marks than the limit of 2.',
    });
    expect(errorsFor({ point: 2 }, 2, 3)).toEqual({
      alternate1: 'This answer has more point marks than the limit of 2.',
    });
  });

  it('accepts answers within the limit, and treats 0 as no limit', () => {
    expect(errorsFor({ point: 2 })).toBeUndefined();
    expect(errorsFor({ point: 0 }, 5, 5)).toBeUndefined();
    expect(errorsFor(undefined, 5, 5)).toBeUndefined();
  });
});
