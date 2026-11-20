import { describe, expect, it } from 'vitest';
import { alignSampleAnswers } from '../sample-answers';

describe('alignSampleAnswers', () => {
  const three = ['zero', 'one', 'two'];

  it.each([
    ['drops leading slots of a longer list', [null, 'S0', 'S1', 'S2'], ['S0', 'S1', 'S2']],
    ['keeps a list of the right length', ['S0', null, 'S2'], ['S0', null, 'S2']],
    ['pads a shorter list at the top score', ['S0'], ['S0', null, null]],
    ['sizes a missing list to the scores', undefined, [null, null, null]],
    ['sizes a null list to the scores', null, [null, null, null]],
  ])('%s', (_name, sampleAnswers, expected) => {
    expect(alignSampleAnswers(three, sampleAnswers as (string | null)[] | undefined)).toEqual(expected);
  });

  it('returns no slots for no points', () => {
    expect(alignSampleAnswers(undefined, [null, 'S0'])).toEqual([]);
  });

  it('does not change the stored list', () => {
    const stored = [null, 'S0', 'S1', 'S2'];
    alignSampleAnswers(three, stored);

    expect(stored).toEqual([null, 'S0', 'S1', 'S2']);
  });
});
