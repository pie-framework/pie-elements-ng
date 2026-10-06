import { describe, expect, it } from 'vitest';
import {
  type Correctness,
  type Feedback,
  getActualFeedbackForCorrectness,
  getFeedbackForCorrectness,
} from '../src/index.js';

// Controllers pass the correctness they compute and the feedback stored on the model, so the
// cases include values outside the typed contract.
const cases: [string, string | undefined, unknown, string | undefined][] = [
  ['gives the default message', 'correct', undefined, 'Correct'],
  [
    "gives the entry's default message",
    'incorrect',
    { incorrect: { type: 'default', default: 'Not quite', custom: '' } },
    'Not quite',
  ],
  [
    'gives the custom message',
    'correct',
    { correct: { type: 'custom', default: 'Correct', custom: 'Great job!' } },
    'Great job!',
  ],
  [
    'gives no message for type none',
    'correct',
    { correct: { type: 'none', default: 'Correct', custom: '' } },
    undefined,
  ],
  ['reads partially-correct as partial', 'partially-correct', {}, 'Nearly'],
  ['gives no message for unknown', 'unknown', {}, undefined],
  ['gives no message for an undefined correctness', undefined, {}, undefined],
  ['gives the default message for a null entry', 'correct', { correct: null }, 'Correct'],
  [
    'gives the default message for an untyped entry',
    'correct',
    { correct: { custom: 'Great job!' } },
    'Correct',
  ],
];

describe.each([
  ['getActualFeedbackForCorrectness', getActualFeedbackForCorrectness],
  ['getFeedbackForCorrectness', getFeedbackForCorrectness],
])('%s', (_name, resolve) => {
  it.each(cases)('%s', async (_case, correctness, feedback, expected) => {
    expect(await resolve(correctness as Correctness, feedback as Partial<Feedback>)).toBe(expected);
  });
});
