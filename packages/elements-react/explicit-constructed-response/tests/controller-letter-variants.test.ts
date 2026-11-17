// Controllers also run server-side, so these run without a DOM.
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getLogTrace, getScore, model, outcome } from '../src/controller/index.js';

// The PRD's worked example: area 0 keyed مدرسة, area 1 keyed أحمد.
const ITEM = {
  id: '1',
  element: 'explicit-constructed-response',
  markup: '<p>الطالب في {{0}} اسمها {{1}}.</p>',
  choices: {
    0: [{ label: 'مدرسة', value: '0' }],
    1: [{ label: 'أحمد', value: '0' }],
  },
  language: 'ar',
};

const SESSION = { id: '1', value: { 0: 'مدرسه', 1: 'احمد' } };

const folding = (foldLetterVariantsPerChoice: unknown, foldLetterVariantsEnabled: unknown = true) =>
  ({ ...ITEM, foldLetterVariantsEnabled, foldLetterVariantsPerChoice }) as any;

describe('Arabic spelling variants', () => {
  it('folds only the response areas the author turned it on for', async () => {
    expect(getScore(folding([true, false]), SESSION)).toBe(0.5);
    expect(getScore(folding([true, true]), SESSION)).toBe(1);
    expect((await outcome(folding([true, false]), SESSION)).score).toBe(0.5);
    expect((await outcome(folding([true, true]), SESSION)).score).toBe(1);
  });

  it('keeps every area strict while the item switch is off, without erasing the entries', () => {
    expect(getScore(folding([true, true], false), SESSION)).toBe(0);
    expect(getLogTrace(folding([true, true], false), SESSION, {}).join(' ')).not.toContain('spelling variants');
    expect(getScore({ ...ITEM, foldLetterVariantsPerChoice: [true, true] } as any, SESSION)).toBe(0);
  });

  it('has no effect when the fields are absent or null', () => {
    expect(getScore(ITEM as any, SESSION)).toBe(0);
    expect(getScore(folding([true, true], null), SESSION)).toBe(0);
    expect(getScore(folding(null), SESSION)).toBe(0);
    expect(getScore(folding([null, null]), SESSION)).toBe(0);
    expect(getScore(folding([]), SESSION)).toBe(0);
  });

  it('folds every alternate of an area', () => {
    const item = folding([true]);
    item.markup = '<p>{{0}}</p>';
    item.choices = { 0: [{ label: 'مدرسة', value: '0' }, { label: 'المدرسة', value: '1' }] };

    expect(getScore(item, { id: '1', value: { 0: 'المدرسه' } })).toBe(1);
  });

  it('reports the same per-area result in evaluate mode, the score and the trace', async () => {
    const item = folding([true, false]);
    const evaluated = await model(item, SESSION, { mode: 'evaluate' });

    expect(evaluated.feedback).toEqual({ 0: 'correct', 1: 'incorrect' });
    expect(evaluated.responseCorrect).toBe(false);
    expect(getLogTrace(item, SESSION, {})).toEqual(
      expect.arrayContaining([
        'Response area 1: CORRECT.',
        'Response area 2: INCORRECT.',
        'Arabic spelling variants are accepted for response area(s) 1.',
        'Partial scoring: 1 correct out of 2 response areas.',
        'Score: 0.5.',
      ])
    );
    expect((await model(folding([true, true]), SESSION, { mode: 'evaluate' })).responseCorrect).toBe(true);
  });

  it('keeps the fields out of the delivery model', async () => {
    const delivered = await model(folding([true, false]), SESSION, { mode: 'gather' });

    expect(delivered).not.toHaveProperty('foldLetterVariantsEnabled');
    expect(delivered).not.toHaveProperty('foldLetterVariantsPerChoice');
  });
});
