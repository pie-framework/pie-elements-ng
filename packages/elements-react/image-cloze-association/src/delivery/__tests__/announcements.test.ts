/// <reference types="vite/client" />
import { beforeAll, describe, expect, it } from 'vitest';
import { loadLocale } from '@pie-element/shared-i18n';

import { catalogs } from '../../i18n/index.js';
import {
  type Choice,
  type Config,
  describeAvailable,
  describeChoiceTile,
  describeDeselection,
  describeFocusTarget,
  describeIntro,
  describePlacementResult,
  areaLabel,
  describeSelection,
  hasRichContent,
  plainText,
} from '../announcements.js';

beforeAll(() => loadLocale('en_US'));

const i18n = catalogs.forLocale('en-US');
const choice = (value: string, containerIndex?: number): Choice => ({ value, containerIndex });

const config = (overrides: Partial<Config> = {}): Config => ({
  alt: 'a beach',
  containers: [{ index: 0, ariaLabel: 'a box for flamingos' }],
  possibleResponses: ['flamingo'],
  maxResponsePerZone: 7,
  duplicateResponses: true,
  ...overrides,
});

describe('plainText', () => {
  it('reads the words, else the image alt', () => {
    expect(plainText('<p>Mars&nbsp;&amp; Venus</p>')).toBe('Mars & Venus');
    expect(plainText('<img alt="Saturn" src="s.png"/>')).toBe('Saturn');
    expect(plainText('<img alt="" src="s.png"/>')).toBe('');
    expect(plainText('caf&#233; &#x41; &lt;b&gt;')).toBe('café A <b>');
    expect(plainText('<p>one</p><p>two</p>')).toBe('one two');
    expect(plainText('3 < 5')).toBe('3 < 5');
  });
});

describe('describeIntro (rows 1 to 4)', () => {
  it('one area holding several choices, reusable choices', () => {
    const [structure, help, area, available] = describeIntro(
      i18n,
      config(),
      [choice('flamingo', 0), choice('flamingo', 0)],
      [{ value: 'flamingo' }],
    );

    expect(structure).toBe(
      'The image shows a beach. It has 1 drop area, which can hold up to 7 answer choices. There is 1 answer choice, which can be reused.',
    );
    expect(help).toContain('Use TAB to move between answer choices and drop areas');
    expect(area).toBe(
      'Drop area a box for flamingos contains the following: answer choice flamingo answer choice flamingo End of answer choices in drop area.',
    );
    expect(available).toBe('1 available answer choice. flamingo Use TAB to move to answer choice.');
  });

  it('several areas holding one choice each', () => {
    const labels = ['a box for 8', 'a box for 9', 'a box for 12'];
    const cfg = config({
      alt: 'Number line labeled 8, 9, 12',
      containers: labels.map((ariaLabel, index) => ({ index, ariaLabel })),
      possibleResponses: ['star'],
      maxResponsePerZone: 1,
      duplicateResponses: false,
    });
    const [structure, , a, b, c] = describeIntro(i18n, cfg, [choice('star', 2)], []);

    expect(structure).toBe(
      'The image shows Number line labeled 8, 9, 12. It has 3 drop areas, which can each hold 1 answer choice. There is 1 answer choice, which cannot be reused.',
    );
    expect([a, b, c]).toEqual([
      'Drop area a box for 8 is empty.',
      'Drop area a box for 9 is empty.',
      'Drop area a box for 12 contains answer choice star.',
    ]);
  });

  it('several areas holding several choices; no image alt', () => {
    const [structure] = describeIntro(
      i18n,
      config({ alt: '', containers: [{ index: 0 }, { index: 1 }], possibleResponses: ['a', 'b', 'c', 'd'], maxResponsePerZone: 4, duplicateResponses: false }),
      [],
      [],
    );

    expect(structure).toBe(
      'The image. It has 2 drop areas, which can each hold up to 4 answer choices. There are 4 answer choices, which cannot be reused.',
    );
  });
});

describe('describeAvailable (row 4)', () => {
  it('lists several choices', () => {
    expect(describeAvailable(i18n, config(), [{ value: '1' }, { value: '10' }, { value: '0' }])).toBe(
      '3 available answer choices. Answer choice: 1 Answer choice: 10 Answer choice: 0 End of available answer choices. Use TAB to move to an answer choice.',
    );
  });

  it('says only the count when none is left', () => {
    expect(describeAvailable(i18n, config(), [])).toBe('0 available answer choices.');
  });
});

describe('tiles and focus (rows 5 to 11)', () => {
  const multi = config({ containers: [{ index: 0, ariaLabel: 'a box for 8' }, { index: 1, ariaLabel: 'a box for 9' }], maxResponsePerZone: 1 });
  const single = config({ maxResponsePerZone: 1 });

  it('names a tile in the pool and in an area', () => {
    expect(describeChoiceTile(i18n, single, choice('flamingo'))).toBe('Answer choice: flamingo');
    expect(describeChoiceTile(i18n, single, choice('flamingo', 0))).toBe(
      'Answer choice: flamingo in drop area a box for flamingos',
    );
  });

  it('reads the selection', () => {
    expect(describeSelection(i18n, single, choice('flamingo'))).toBe(
      'Selected answer choice flamingo. Use TAB to move to drop area.',
    );
    expect(describeSelection(i18n, multi, choice('star'))).toBe(
      'Selected answer choice star. Use TAB to move to a drop area.',
    );
    expect(describeDeselection(i18n, multi, choice('star'))).toBe(
      'Answer choice star is no longer selected. Use TAB to move to an answer choice.',
    );
  });

  it('reads the focused target by the number of areas', () => {
    expect(describeFocusTarget(i18n, single, choice('flamingo'), 0)).toBe(
      'Selected drop area a box for flamingos. Press ENTER to move selected answer choice flamingo here or ESC to cancel.',
    );
    expect(describeFocusTarget(i18n, multi, choice('star'), 0)).toBe(
      'Selected drop area a box for 8. Press ENTER to move selected answer choice star here or TAB to move to a different drop area.',
    );
    expect(describeFocusTarget(i18n, single, choice('flamingo', 0), undefined)).toBe(
      'Press ENTER to remove selected answer choice flamingo from a box for flamingos drop area or ESC to cancel.',
    );
    expect(describeFocusTarget(i18n, multi, choice('star', 1), undefined)).toBe(
      'Press ENTER to remove selected answer choice star from a box for 9 drop area or TAB to move to a drop area.',
    );
    expect(describeFocusTarget(i18n, multi, choice('star'), undefined)).toBe(
      'Press ENTER to leave selected answer choice star unplaced or TAB to move to a drop area.',
    );
    expect(describeFocusTarget(i18n, single, choice('flamingo'), undefined)).toBe(
      'Press ENTER to leave selected answer choice flamingo unplaced or TAB to move to drop area.',
    );
  });
});

describe('describePlacementResult (rows 12 to 15)', () => {
  const cfg = config({
    containers: [{ index: 0, ariaLabel: 'a box for 10' }, { index: 1, ariaLabel: 'a box for 12' }],
    maxResponsePerZone: 1,
  });

  it('placed from the pool', () => {
    expect(describePlacementResult(i18n, cfg, [], choice('star'), 0)).toBe(
      'Placed answer choice star in a box for 10 drop area.',
    );
  });

  it('says what was removed to make room', () => {
    expect(describePlacementResult(i18n, cfg, [choice('11', 0)], choice('0'), 0)).toBe(
      'Placed answer choice 0 in a box for 10 drop area. To make room for it, answer choice 11 was removed.',
    );
  });

  it('moved between areas', () => {
    expect(describePlacementResult(i18n, cfg, [choice('star', 1)], choice('star', 1), 0)).toBe(
      'Moved answer choice star from a box for 12 drop area to a box for 10 drop area.',
    );
  });

  it('removed to the pool', () => {
    expect(describePlacementResult(i18n, cfg, [choice('star', 1)], choice('star', 1), undefined)).toBe(
      'Removed answer choice star from a box for 12 drop area.',
    );
  });

  it('a drop back where it was only ends the selection', () => {
    expect(describePlacementResult(i18n, cfg, [], choice('star'), undefined)).toBe(
      'Answer choice star is no longer selected. Use TAB to move to an answer choice.',
    );
    expect(describePlacementResult(i18n, cfg, [choice('star', 1)], choice('star', 1), 1)).toBe(
      'Answer choice star is no longer selected. Use TAB to move to an answer choice.',
    );
  });
});

describe('rich content', () => {
  it('is not read as stripped text', () => {
    expect(hasRichContent('<span data-latex="">\\(\\frac{1}{2}\\)</span>')).toBe(true);
    expect(hasRichContent('<math><mn>1</mn></math>')).toBe(true);
    expect(hasRichContent('<p>Mars</p>')).toBe(false);
    expect(describeChoiceTile(i18n, config({ possibleResponses: ['<math><mn>1</mn></math>'] }), choice('<math><mn>1</mn></math>'))).toBe(
      'Answer choice: number 1',
    );
  });
});

describe('areaLabel', () => {
  it('names a container with no index of its own by its place in the list', () => {
    const containers = [{}, {}, {}];

    expect(areaLabel(i18n, containers, 0)).toBe('Response area 1 of 3');
    expect(areaLabel(i18n, containers, 2)).toBe('Response area 3 of 3');
    // an index that names none stays within the list
    expect(areaLabel(i18n, containers, 9)).toBe('Response area 3 of 3');
    expect(areaLabel(i18n, containers, undefined)).toBe('Response area 1 of 3');
  });
});

// The spec's own examples, word for word, so a change to the wording shows up here first.
describe('spec examples', () => {
  const areas = (labels: string[]) => labels.map((ariaLabel, index) => ({ index, ariaLabel }));

  describe('row 1: structure', () => {
    const structure = (cfg: Config) => describeIntro(i18n, cfg, [], [])[0];

    it('example 1: one area, up to 7 choices, one reusable choice', () => {
      expect(structure(config())).toBe(
        'The image shows a beach. It has 1 drop area, which can hold up to 7 answer choices. There is 1 answer choice, which can be reused.',
      );
    });

    it('example 2: five areas holding one each, one choice that is not reusable', () => {
      expect(
        structure(
          config({
            alt: 'Number line labeled 8, 9, 10, 11, 12',
            containers: areas(['a box for 8', 'a box for 9', 'a box for 10', 'a box for 11', 'a box for 12']),
            maxResponsePerZone: 1,
            duplicateResponses: false,
          }),
        ),
      ).toBe(
        'The image shows Number line labeled 8, 9, 10, 11, 12. It has 5 drop areas, which can each hold 1 answer choice. There is 1 answer choice, which cannot be reused.',
      );
    });

    it('example 3: two areas, four choices that are not reusable', () => {
      expect(
        structure(
          config({
            alt: 'Number line labeled blank, blank, 12, 13',
            containers: areas(['the first blank', 'the second blank']),
            possibleResponses: ['10', '11', '12', '13'],
            maxResponsePerZone: 1,
            duplicateResponses: false,
          }),
        ),
      ).toBe(
        'The image shows Number line labeled blank, blank, 12, 13. It has 2 drop areas, which can each hold 1 answer choice. There are 4 answer choices, which cannot be reused.',
      );
    });

    it('example 4: three areas holding up to four each', () => {
      expect(
        structure(
          config({
            alt: 'VENN DIAGRAM labeled Zebras, both, Horses',
            containers: areas(['zebras only', 'both zebras and horses', 'horses only']),
            possibleResponses: ['grass', 'wild', 'pets', 'stripes'],
            maxResponsePerZone: 4,
            duplicateResponses: false,
          }),
        ),
      ).toBe(
        'The image shows VENN DIAGRAM labeled Zebras, both, Horses. It has 3 drop areas, which can each hold up to 4 answer choices. There are 4 answer choices, which cannot be reused.',
      );
    });

    it('one area holding one choice has neither "each" nor "up to"', () => {
      expect(structure(config({ maxResponsePerZone: 1 }))).toContain('It has 1 drop area, which can hold 1 answer choice.');
    });

    it('drops a trailing full stop from the alt text so the sentence has one', () => {
      expect(structure(config({ alt: 'a beach.' }))).toMatch(/^The image shows a beach\. It has/);
    });
  });

  describe('row 3: drop areas', () => {
    const venn = config({
      containers: areas(['zebras only', 'both zebras and horses', 'horses only']),
      possibleResponses: ['grass', 'wild', 'pets', 'stripes'],
      maxResponsePerZone: 4,
      duplicateResponses: false,
    });

    it('reads empty, two-choice and one-choice areas that hold several choices', () => {
      const [, , zebras, both, horses] = describeIntro(i18n, venn, [choice('grass', 1), choice('wild', 1), choice('pets', 2)], [
        { value: 'stripes' },
      ]);

      expect(zebras).toBe('Drop area zebras only is empty.');
      expect(both).toBe(
        'Drop area both zebras and horses contains the following: answer choice grass answer choice wild End of answer choices in drop area.',
      );
      expect(horses).toBe('Drop area horses only contains the following: answer choice pets End of answer choices in drop area.');
    });

    it('reads areas that hold one choice, in the order of the areas', () => {
      const cfg = config({
        containers: areas(['the first blank', 'the second blank']),
        possibleResponses: ['10', '11'],
        maxResponsePerZone: 1,
      });
      const [, , first, second] = describeIntro(i18n, cfg, [choice('11', 1)], [{ value: '10' }]);

      expect(first).toBe('Drop area the first blank is empty.');
      expect(second).toBe('Drop area the second blank contains answer choice 11.');
    });

    it('reads one paragraph per area, then the pool last', () => {
      expect(describeIntro(i18n, venn, [], [{ value: 'grass' }])).toHaveLength(2 + 3 + 1);
    });
  });

  describe('row 4: the pool', () => {
    it('one available choice has no list and no "an"', () => {
      expect(describeAvailable(i18n, config(), [{ value: 'star' }])).toBe(
        '1 available answer choice. star Use TAB to move to answer choice.',
      );
    });

    it('two available choices', () => {
      expect(describeAvailable(i18n, config(), [{ value: 'pets' }, { value: 'stripes' }])).toBe(
        '2 available answer choices. Answer choice: pets Answer choice: stripes End of available answer choices. Use TAB to move to an answer choice.',
      );
    });

    it('a choice with no text is named by its place among the model choices', () => {
      const cfg = config({ possibleResponses: ['<img src="a.png"/>', '<img src="b.png" alt=""/>'] });

      expect(describeAvailable(i18n, cfg, [{ value: '<img src="b.png" alt=""/>' }])).toBe(
        '1 available answer choice. number 2 Use TAB to move to answer choice.',
      );
    });
  });

  describe('row 12: placed, and what it displaced', () => {
    const one = config({ containers: areas(['a box for flamingos', 'box for the second blank']), maxResponsePerZone: 1 });

    it('placed with nothing displaced', () => {
      expect(describePlacementResult(i18n, one, [], choice('flamingo'), 0)).toBe(
        'Placed answer choice flamingo in a box for flamingos drop area.',
      );
    });

    it('a move onto an occupied single-choice area also says what was removed', () => {
      expect(describePlacementResult(i18n, one, [choice('flamingo', 0), choice('11', 1)], choice('flamingo', 0), 1)).toBe(
        'Moved answer choice flamingo from a box for flamingos drop area to box for the second blank drop area. To make room for it, answer choice 11 was removed.',
      );
    });

    it('a multi-choice area never reports a removal (it refuses instead)', () => {
      const many = config({ containers: areas(['both']), maxResponsePerZone: 2 });

      expect(describePlacementResult(i18n, many, [choice('a', 0)], choice('b'), 0)).toBe(
        'Placed answer choice b in both drop area.',
      );
    });
  });

  describe('rows 5, 6 and 9 to 11 with several areas and a single area', () => {
    it('row 9 on an area with the author label, one area: ESC; several: TAB', () => {
      const cfg = config({ containers: areas(['box for the second blank', 'x']), maxResponsePerZone: 1 });

      expect(describeFocusTarget(i18n, cfg, choice('11'), 0)).toBe(
        'Selected drop area box for the second blank. Press ENTER to move selected answer choice 11 here or TAB to move to a different drop area.',
      );
    });

    it('row 6 falls back to the position when the area has no label', () => {
      const cfg = config({ containers: [{ index: 0 }, { index: 1 }] });

      expect(describeChoiceTile(i18n, cfg, choice('flamingo', 1))).toBe(
        'Answer choice: flamingo in drop area Response area 2 of 2',
      );
    });
  });
});

// A locale that lacks a key falls back to English; a screen reader user hears a mixed-language sentence.
describe('every locale carries every announcement string', () => {
  const locales = ['ar', 'cy', 'en-AU', 'en-GB', 'es', 'fr', 'ja', 'ko', 'nl-NL', 'pt', 'ro', 'sv', 'th-TH', 'zh'];
  const keys = (o: Record<string, unknown>, prefix = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) =>
      v && typeof v === 'object' && !('one' in v || 'other' in v) ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
    );
  const catalogFiles = import.meta.glob<{ default: Record<string, unknown> }>('../../i18n/*.ts');
  const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

  it.each(locales)('%s', async (locale) => {
    const [{ default: source }, { default: translated }] = await Promise.all([
      catalogFiles['../../i18n/en-US.ts'](),
      catalogFiles[`../../i18n/${locale}.ts`](),
    ]);
    const missing = keys(source).filter((k) => !keys(translated).includes(k));

    expect(missing).toEqual([]);

    // Every {placeholder} the English sentence fills in must survive translation.
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      if (typeof value === 'string') {
        expect(placeholders(String((translated as Record<string, unknown>)[key]))).toEqual(placeholders(value));
      }
    }
  });
});
