import { describe, expect, it } from 'vitest';
import { catalogs } from '../../i18n/index.js';
import {
  applyPlacement,
  availableAnswers,
  describeIntro,
  describePlacementResult,
  describeSelection,
  describeFocusTarget,
} from '../announcements.js';

const i18n = catalogs.forLocale('en-US');
const t = i18n.t.bind(i18n);

const config = {
  duplicates: false,
  prompts: [
    { id: 1, title: '<p>Cue <b>one</b></p>' },
    { id: 2, title: 'Cue two' },
    { id: 3, title: 'Cue three' },
  ],
  answers: [
    { id: 'a', title: '<span>Alpha</span>' },
    { id: 'b', title: 'Beta' },
    { id: 'c', title: 'Gamma' },
  ],
};

describe('applyPlacement', () => {
  const pool = { type: 'choices-pool' };
  const zone = (promptId: number) => ({ type: 'drop-zone', promptId });

  it('places a pool choice in an empty drop area without mutating the input', () => {
    const value = { 2: 'b' };
    const next = applyPlacement(value, { type: 'choice', id: 'a' }, zone(1), false);

    expect(next).toEqual({ 1: 'a', 2: 'b' });
    expect(value).toEqual({ 2: 'b' });
  });

  it('moves a placed answer to an empty drop area, vacating the source', () => {
    expect(applyPlacement({ 1: 'a' }, { type: 'target', id: 'a', promptId: 1 }, zone(3), false)).toEqual({ 3: 'a' });
  });

  it('swaps two placed answers when duplicates are off', () => {
    expect(
      applyPlacement({ 1: 'a', 2: 'b' }, { type: 'target', id: 'a', promptId: 1 }, zone(2), false),
    ).toEqual({ 1: 'b', 2: 'a' });
  });

  it('hands back the same object when nothing changes', () => {
    const value = { 1: 'a' };

    expect(applyPlacement(value, { type: 'choice', id: 'b' }, pool, false)).toBe(value);
    expect(applyPlacement(value, { type: 'target', id: 'a', promptId: 1 }, zone(1), false)).toBe(value);
    expect(applyPlacement(undefined, { type: 'choice', id: 'b' }, pool, false)).toBeUndefined();
  });

  it('removes a placed answer dropped on the pool', () => {
    expect(applyPlacement({ 1: 'a', 2: 'b' }, { type: 'target', id: 'a', promptId: 1 }, pool, false)).toEqual({
      2: 'b',
    });
  });

  it('leaves the value alone when a pool choice is dropped on the pool', () => {
    expect(applyPlacement({ 1: 'a' }, { type: 'choice', id: 'b' }, pool, false)).toEqual({ 1: 'a' });
  });
});

describe('describeIntro (spec rows 1 and 5)', () => {
  it('states the object count, reuse, key help and progress', () => {
    const text = describeIntro(t, config, { 1: 'a' });

    expect(text).toContain('This question has 3 objects that need a match.');
    expect(text).toContain('Each object has one drop area for one answer choice.');
    expect(text).toContain('Answer choices cannot be reused.');
    expect(text).toContain('Use TAB to move between answer choices and drop areas, ENTER to select/drop, and ESC to cancel.');
    expect(text).toContain('1 of 3 drop areas have an answer choice.');
  });

  it('says answer choices can be reused when duplicates are on', () => {
    expect(describeIntro(t, { ...config, duplicates: true }, {})).toContain('Answer choices can be reused.');
  });
});

describe('describeSelection (spec row 8)', () => {
  it('names the selected choice with HTML stripped', () => {
    expect(describeSelection(t, config, 'a')).toBe('Selected answer choice Alpha. Use TAB to choose a drop area.');
  });
});

describe('describeFocusTarget (spec rows 10 to 12)', () => {
  const selectedFromPool = { type: 'choice', id: 'a' };
  const selectedPlaced = { type: 'target', id: 'a', promptId: 1 };

  it('announces a drop area while a choice is selected (row 10)', () => {
    expect(describeFocusTarget(t, config, selectedFromPool, { type: 'drop-zone', promptId: 2 })).toBe(
      'Selected drop area for Object 2 Cue two. Press ENTER to move selected answer choice Alpha here or TAB to move to a different drop area.',
    );
  });

  it('announces the pool when the selection is placed (row 11)', () => {
    expect(describeFocusTarget(t, config, selectedPlaced, { type: 'choices-pool' })).toBe(
      'Press ENTER to remove selected answer choice from Object 1 drop area or TAB to move to a different drop area. Selected answer choice: Alpha. Object 1: Cue one',
    );
  });

  it('announces the pool when the selection is already in the pool (row 12)', () => {
    expect(describeFocusTarget(t, config, selectedFromPool, { type: 'choices-pool' })).toBe(
      'Press ENTER to leave selected answer choice unplaced or TAB to move to a drop area. Selected answer choice: Alpha',
    );
  });
});

describe('describePlacementResult (spec rows 13 to 18)', () => {
  const zone = (promptId: number) => ({ type: 'drop-zone', promptId });

  it('reports placement plus what remains (rows 13, 14)', () => {
    expect(describePlacementResult(t, config, {}, { type: 'choice', id: 'a' }, zone(1))).toBe(
      'Placed answer choice Alpha in drop area for Object 1: Cue one. 1 of 3 drop areas have an answer choice. 2 available answer choices. Use TAB to select an answer choice.',
    );
  });

  it('reports completion once every drop area is filled (rows 13, 15)', () => {
    expect(describePlacementResult(t, config, { 1: 'a', 2: 'b' }, { type: 'choice', id: 'c' }, zone(3))).toBe(
      'Placed answer choice Gamma in drop area for Object 3: Cue three. Answer is complete. 3 of 3 drop areas have an answer choice.',
    );
  });

  it('reports a move between drop areas (row 16)', () => {
    expect(
      describePlacementResult(t, config, { 1: 'a' }, { type: 'target', id: 'a', promptId: 1 }, zone(2)),
    ).toBe(
      'Moved answer choice Alpha from Object 1 drop area to Object 2 drop area. Cue two. 1 of 3 drop areas have an answer choice. 2 available answer choices. Use TAB to select an answer choice.',
    );
  });

  it('reports a removal to the pool (row 17)', () => {
    expect(
      describePlacementResult(t, config, { 1: 'a', 2: 'b' }, { type: 'target', id: 'a', promptId: 1 }, {
        type: 'choices-pool',
      }),
    ).toBe(
      'Removed answer choice Alpha from Object 1 drop area. 1 of 3 drop areas have an answer choice. 2 available answer choices. Use TAB to select an answer choice.',
    );
  });

  it('reports no longer selected when nothing moved (row 18)', () => {
    expect(describePlacementResult(t, config, {}, { type: 'choice', id: 'a' }, { type: 'choices-pool' })).toBe(
      'Answer choice Alpha is no longer selected. Use TAB to select an answer choice.',
    );
  });

  it('ignores session entries for prompts that no longer exist when counting what is left', () => {
    expect(describePlacementResult(t, config, { 99: 'b' }, { type: 'choice', id: 'a' }, zone(1))).toContain(
      '3 available answer choices.'.replace('3', '2'),
    );
  });

  it('leaves no stray punctuation when an object has no text', () => {
    const textless = { ...config, prompts: [{ id: 1, title: '' }, ...config.prompts.slice(1)] };

    expect(describePlacementResult(t, textless, {}, { type: 'choice', id: 'a' }, zone(1))).toMatch(
      /^Placed answer choice Alpha in drop area for Object 1\. 1 of 3/,
    );
    expect(describeFocusTarget(t, textless, { type: 'choice', id: 'a' }, zone(1))).toMatch(
      /^Selected drop area for Object 1\. Press ENTER/,
    );
  });

  it('reports no longer selected, not placed, when the choice is dropped where it already is', () => {
    const duplicates = { ...config, duplicates: true };

    expect(describePlacementResult(t, duplicates, { 1: 'a' }, { type: 'choice', id: 'a' }, zone(1))).toBe(
      'Answer choice Alpha is no longer selected. Use TAB to select an answer choice.',
    );
    expect(
      describePlacementResult(t, config, { 1: 'a' }, { type: 'target', id: 'a', promptId: 1 }, zone(1)),
    ).toBe('Answer choice Alpha is no longer selected. Use TAB to select an answer choice.');
  });

  it('leaves the author\'s own spacing and punctuation alone when an object has text', () => {
    const odd = { ...config, prompts: [{ id: 1, title: 'Compute 3 , 4 :' }, ...config.prompts.slice(1)] };

    expect(describeFocusTarget(t, odd, { type: 'choice', id: 'a' }, zone(1))).toContain('Object 1 Compute 3 , 4 :.');
  });

  it('closes the gap an empty object text leaves in full-width locales too', () => {
    const textless = { ...config, prompts: [{ id: 1, title: '' }, ...config.prompts.slice(1)] };
    const ja = catalogs.forLocale('ja');

    expect(describePlacementResult(ja.t.bind(ja), textless, {}, { type: 'choice', id: 'a' }, zone(1))).not.toMatch(
      /[：:]\s*(?:。|\s|$)/,
    );
  });

  it('counts every choice as available when duplicates are on', () => {
    expect(
      describePlacementResult(t, { ...config, duplicates: true }, {}, { type: 'choice', id: 'a' }, zone(1)),
    ).toContain('3 available answer choices.');
  });
});

describe('availableAnswers', () => {
  it('lists the choices not placed in a current prompt, ignoring entries for removed prompts', () => {
    expect(availableAnswers(config, { 1: 'a', 99: 'b' }).map((a) => a.id)).toEqual(['b', 'c']);
  });
});
