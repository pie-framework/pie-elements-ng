import { describe, expect, it } from 'vitest';
import {
  applyPlacement,
  describeBlank,
  describeChoiceTile,
  describeFocusTarget,
  describeIntro,
  describePlacementResult,
  translatorFor,
} from '../announcements';

const t = translatorFor('en-US');
const config = {
  markup: 'A {{0}} b {{1}} c {{2}}',
  duplicates: false,
  choices: [
    { id: 'a', value: 'In fact' },
    { id: 'b', value: '<p>key</p>' },
    { id: 'c', value: 'kings' },
    { id: 'd', value: '<img src="x.png">' },
  ],
};
const fromPool = (id: string) => ({ id, choice: config.choices.find((c) => c.id === id), fromChoice: true });
const fromBlank = (blank: string, id: string) => ({ id: blank, choice: config.choices.find((c) => c.id === id), fromChoice: false });

describe('drag-in-the-blank announcements', () => {
  it('reads the intro of row 1', () => {
    expect(describeIntro(t, config, { '1': 'b' })).toBe(
      'This question has 3 blanks and 4 answer choices. Answer choices cannot be reused. Each blank is a drop area that must be filled with a single answer choice. Use TAB to move between answer choices and blanks, ENTER to select/drop, and ESC to cancel. 1 of 3 blanks have an answer choice.',
    );
    expect(describeIntro(t, { ...config, duplicates: true }, {})).toContain('Answer choices can be reused.');
  });

  it('names each blank by its state, leaving rich content to speak for itself', () => {
    expect(describeBlank(t, '0')).toBe('Blank 1 is empty');
    expect(describeBlank(t, '1', config.choices[1])).toBe('Blank 2 contains the answer choice key end of answer choice');
    expect(describeBlank(t, '1', config.choices[3])).toBeUndefined();
  });

  it('names a tile in the pool and in a blank', () => {
    expect(describeChoiceTile(t, config.choices[0])).toBe('Answer choice: In fact');
    expect(describeChoiceTile(t, config.choices[0], '2')).toBe('Answer choice: In fact in blank 3');
    expect(describeChoiceTile(t, config.choices[3])).toBeUndefined();
  });

  it('places, moves and removes without touching the session it was given', () => {
    const value = { '0': 'a' };

    expect(applyPlacement(value, fromPool('b'), '1')).toEqual({ '0': 'a', '1': 'b' });
    expect(applyPlacement(value, fromBlank('0', 'a'), '2')).toEqual({ '2': 'a' });
    expect(applyPlacement(value, fromBlank('0', 'a'), undefined)).toEqual({});
    expect(value).toEqual({ '0': 'a' });
  });

  it('hands back the very same value when nothing changes', () => {
    const value = { '0': 'a' };

    expect(applyPlacement(value, fromBlank('0', 'a'), '0')).toBe(value);
    expect(applyPlacement(value, fromPool('a'), '0')).toBe(value);
    expect(applyPlacement(value, fromPool('b'), undefined)).toBe(value);
  });

  it('describes the outcome and what is left (rows 13 to 17)', () => {
    expect(describePlacementResult(t, config, { '0': 'a' }, fromPool('b'), '1')).toBe(
      'Placed answer choice key in blank 2. 2 of 3 blanks have an answer choice. 2 available answer choices. Use TAB to select an answer choice.',
    );
    expect(describePlacementResult(t, config, { '0': 'a', '1': 'b' }, fromPool('c'), '2')).toBe(
      'Placed answer choice kings in blank 3. Answer is complete. 3 of 3 blanks have an answer choice.',
    );
    expect(describePlacementResult(t, config, { '0': 'a' }, fromBlank('0', 'a'), '2')).toBe(
      'Moved answer choice In fact from blank 1 to blank 3. 1 of 3 blanks have an answer choice. 3 available answer choices. Use TAB to select an answer choice.',
    );
    expect(describePlacementResult(t, config, { '0': 'a' }, fromBlank('0', 'a'), undefined)).toBe(
      'Removed answer choice In fact from blank 1. 0 of 3 blanks have an answer choice. 4 available answer choices. Use TAB to select an answer choice.',
    );
  });

  it('says the selection ended when nothing moved (row 18)', () => {
    expect(describePlacementResult(t, config, { '0': 'a' }, fromBlank('0', 'a'), '0')).toBe(
      'Answer choice In fact is no longer selected. Use TAB to select an answer choice.',
    );
  });

  it('says what ENTER does on the blank or the pool in focus (rows 10 to 12)', () => {
    expect(describeFocusTarget(t, config, fromPool('a'), { id: '1' })).toContain('Selected blank 2. Press ENTER to move selected answer choice In fact here');
    expect(describeFocusTarget(t, config, fromBlank('1', 'b'), { toChoiceBoard: true })).toContain('remove selected answer choice from blank 2');
    expect(describeFocusTarget(t, config, fromPool('a'), { toChoiceBoard: true })).toContain('leave selected answer choice unplaced');
  });

  it('reads a choice as text: entities decoded, blocks apart, an image by position', () => {
    const rich = {
      ...config,
      choices: [
        { id: 'x', value: '<p>Tom &amp; Jerry</p><p>5&nbsp;cm</p>' },
        { id: 'y', value: '<img src="a.png">' },
      ],
    };

    expect(describeChoiceTile(t, rich.choices[0])).toBe('Answer choice: Tom & Jerry 5 cm');
    expect(describePlacementResult(t, rich, {}, { id: 'y', choice: rich.choices[1], fromChoice: true }, '0')).toContain(
      'Placed answer choice Answer 2 in blank 1',
    );
  });

  it('counts the pool as the pool shows it, even with a stale entry for a removed blank', () => {
    expect(describeIntro(t, config, { '9': 'a' })).toContain('0 of 3 blanks');
    expect(describePlacementResult(t, config, { '9': 'a' }, fromPool('b'), '0')).toContain('2 available answer choices');
  });
});
