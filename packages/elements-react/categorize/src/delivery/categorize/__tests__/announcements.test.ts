/// <reference types="vite/client" />
import { beforeAll, describe, expect, it } from 'vitest';
import { loadLocale } from '@pie-element/shared-i18n';

import { catalogs } from '../../../i18n/index.js';
import {
  type Answer,
  buildConfig,
  describeAvailable,
  describeCategory,
  describeChoiceTile,
  describeDeselection,
  describeFocusTarget,
  describeIntro,
  describePlacementResult,
  describeSelection,
  hasRichContent,
  plainText,
} from '../announcements.js';

beforeAll(() => loadLocale('en_US'));

const i18n = catalogs.forLocale('en-US');

const textChoices = ['lists specifics', 'explains ideas', 'tells about events'].map((content, i) => ({
  id: String(i),
  content,
  categoryCount: 1,
}));

const list = (extra: object = {}) =>
  buildConfig({
    categories: [
      { id: 'yes', label: 'Structure of Say Yes' },
      { id: 'no', label: '<p>Structure of Say No</p>' },
    ],
    categoriesPerRow: 2,
    rowLabels: [''],
    maxChoicesPerCategory: 2,
    choices: textChoices,
    ...extra,
  });

const matrix = (extra: object = {}) =>
  buildConfig({
    categories: ['Volume', 'Pitch', 'Volume', 'Pitch', 'Volume', 'Pitch'].map((label, i) => ({ id: `c${i}`, label })),
    categoriesPerRow: 2,
    rowLabels: ['Range', 'Unit of Measure', 'What is Measured'],
    maxChoicesPerCategory: 1,
    choices: ['soft to loud', 'low to high', 'decibel', 'hertz', 'amplitude', 'frequency'].map((content, i) => ({
      id: String(i),
      content,
      categoryCount: 1,
    })),
    ...extra,
  });

const pool = (config: ReturnType<typeof list>, ids: string[]) =>
  config.choices.filter((c) => ids.includes(c.id));

describe('plainText', () => {
  it('reads words, else the image alt, and flags math', () => {
    expect(plainText('<p>Mars&nbsp;&amp; Venus</p>')).toBe('Mars & Venus');
    expect(plainText('<img alt="Saturn" src="s.png"/>')).toBe('Saturn');
    expect(hasRichContent('\\(6+3=9\\)')).toBe(true);
    // MathML is read as speech; LaTeX can't be, so it is named by position.
    expect(hasRichContent('<math><mn>1</mn></math>')).toBe(false);
    expect(hasRichContent('plain')).toBe(false);
  });
});

describe('math', () => {
  const frac = (n: number, d: number) =>
    `<math> <mrow> <mfrac> <mn>${n}</mn> <mn>${d}</mn> </mfrac> </mrow> </math>`;

  it('reads a MathML fraction as "over", in a label and in a choice', () => {
    const config = list({
      categories: [{ id: 'less', label: `Less than ${frac(1, 2)}` }],
      choices: [{ id: '0', content: frac(5, 3) }],
    });

    expect(plainText(`Less than ${frac(1, 2)}`, i18n)).toBe('Less than 1 over 2');
    expect(describeCategory(i18n, config, 'less')).toBe('category Less than 1 over 2');
    expect(describeChoiceTile(i18n, config, { id: '0', value: frac(5, 3) })).toBe('Answer choice: 5 over 3');
  });

  it('prefers the alttext, and reads other MathML by its tokens', () => {
    expect(plainText('<math alttext="one half"><mn>1</mn></math>', i18n)).toBe('one half');
    expect(plainText('<math><mi>x</mi><mo>+</mo><mn>2</mn></math>', i18n)).toBe('x + 2');
  });
});

describe('buildConfig', () => {
  it('is a matrix only when a row label has text', () => {
    expect(list().matrix).toBe(false);
    expect(list({ rowLabels: ['<div></div>'] }).matrix).toBe(false);
    expect(matrix().matrix).toBe(true);
  });
});

describe('row 1: the intro, categories in a list', () => {
  const intro = (config = list(), answers: Answer[] = []) =>
    describeIntro(i18n, config, answers, config.choices);

  it('says "each" and "up to" for several categories holding several choices', () => {
    expect(intro()[0]).toBe(
      'The question has 2 categories, which can each hold up to 2 answer choices. There are 3 answer choices, which cannot be reused.',
    );
  });

  it('drops "each" for one category and "up to" for one choice', () => {
    expect(intro(list({ categories: [{ id: 'a', label: 'A' }], maxChoicesPerCategory: 3 }))[0]).toMatch(
      /^The question has 1 category, which can hold up to 3 answer choices\./,
    );
    expect(intro(list({ maxChoicesPerCategory: 1 }))[0]).toMatch(
      /^The question has 2 categories, which can each hold 1 answer choice\./,
    );
  });

  it('has a line for a category with no limit', () => {
    expect(intro(list({ maxChoicesPerCategory: 0 }))[0]).toMatch(/which can each hold any number of answer choices\./);
  });

  it('says whether choices can be reused', () => {
    const reusable = list({ choices: textChoices.map((c) => ({ ...c, categoryCount: 0 })) });

    expect(intro(reusable)[0]).toMatch(/There are 3 answer choices, which can be reused\.$/);
    expect(intro(list({ choices: [textChoices[0]] }))[0]).toMatch(/There is 1 answer choice, which cannot be reused\.$/);
  });
});

describe('a matrix with one labelled column', () => {
  const column = buildConfig({
    categories: [{ id: 'a', label: 'Purpose' }, { id: 'b', label: '' }, { id: 'c', label: '' }],
    categoriesPerRow: 1,
    rowLabels: ['1', '2', '3'],
    maxChoicesPerCategory: 1,
    choices: [],
  });

  it('names every cell by the column heading, not by its own empty label', () => {
    expect(describeCategory(i18n, column, 'a')).toBe('category in row 1 and column Purpose');
    expect(describeCategory(i18n, column, 'c')).toBe('category in row 3 and column Purpose');
    expect(describeIntro(i18n, column, [], [])[0]).toBe(
      'The question has 3 categories, arranged in a 1 by 3 matrix. Each category can hold 1 answer choice.',
    );
  });
});

describe('row 1: the intro, categories in a matrix', () => {
  it('describes the matrix, then its column and row labels', () => {
    const [structure, columns, rows, choices] = describeIntro(i18n, matrix(), [], matrix().choices);

    expect(structure).toBe(
      'The question has 6 categories, arranged in a 2 by 3 matrix. Each category can hold 1 answer choice.',
    );
    expect(columns).toBe('The column labels are: Column 1: Volume Column 2: Pitch');
    expect(rows).toBe('The row labels are: Row 1: Range Row 2: Unit of Measure Row 3: What is Measured');
    expect(choices).toBe('There are 6 answer choices, which cannot be reused.');
  });

  it('says "an" before eight, and "up to" for a cell holding several', () => {
    const wide = matrix({
      categoriesPerRow: 8,
      categories: Array.from({ length: 8 }, (_, i) => ({ id: `w${i}`, label: `L${i}` })),
      rowLabels: ['R'],
      maxChoicesPerCategory: 3,
    });

    expect(describeIntro(i18n, wide, [], [])[0]).toBe(
      'The question has 8 categories, arranged in an 8 by 1 matrix. Each category can hold up to 3 answer choices.',
    );
  });
});

describe('rows 2 to 4', () => {
  it('row 2: the keys', () => {
    const paragraphs = describeIntro(i18n, list(), [], []);

    expect(paragraphs[1]).toBe(
      'Use TAB to move between answer choices and categories, ENTER to select/drop, and ESC to cancel.',
    );
  });

  it('row 3: a category that holds several lists them, ending after more than one', () => {
    const answers = [{ category: 'yes', choices: ['0', '1'] }, { category: 'no', choices: ['2'] }];
    const paragraphs = describeIntro(i18n, list(), answers, []);

    expect(paragraphs[2]).toBe(
      'Category 1 Structure of Say Yes contains 2 answer choices. answer choice lists specifics answer choice explains ideas End of answer choices.',
    );
    expect(paragraphs[3]).toBe('Category 2 Structure of Say No contains 1 answer choice. answer choice tells about events');
    expect(describeIntro(i18n, list(), [], [])[3]).toBe('Category 2 Structure of Say No contains 0 answer choices.');
  });

  it('row 3: a category that holds one is empty or contains the choice', () => {
    const one = list({ maxChoicesPerCategory: 1 });

    expect(describeIntro(i18n, one, [{ category: 'yes', choices: ['0'] }], [])[2]).toBe(
      'Category Structure of Say Yes contains answer choice lists specifics.',
    );
    expect(describeIntro(i18n, one, [], [])[2]).toBe('Category Structure of Say Yes is empty.');
  });

  it('row 3: a matrix cell is named by its row and column', () => {
    const paragraphs = describeIntro(i18n, matrix(), [{ category: 'c0', choices: ['0'] }], []);

    expect(paragraphs[5]).toBe('The category in row Range and column Volume contains answer choice soft to loud.');
    expect(paragraphs[6]).toBe('The category in row Range and column Pitch is empty.');
  });

  it('row 3: a matrix cell that holds one reads the count and the text alone', () => {
    const several = matrix({ maxChoicesPerCategory: 2 });

    expect(describeIntro(i18n, several, [{ category: 'c0', choices: ['0'] }], [])[5]).toBe(
      'The category in row Range and column Volume contains 1 answer choice. soft to loud',
    );
  });

  it('row 3: a matrix cell that holds several says how many', () => {
    const several = matrix({ maxChoicesPerCategory: 2 });

    expect(describeIntro(i18n, several, [{ category: 'c0', choices: ['0', '1'] }], [])[5]).toBe(
      'The category in row Range and column Volume contains 2 answer choices. answer choice soft to loud answer choice low to high End of answer choices.',
    );
  });

  it('row 4: the pool', () => {
    expect(describeAvailable(i18n, list(), pool(list(), ['0', '1']))).toBe(
      '2 available answer choices. Answer choice: lists specifics Answer choice: explains ideas End of available answer choices. Use TAB to move to an answer choice.',
    );
    expect(describeAvailable(i18n, list(), [])).toBe('0 available answer choices.');
  });

  it('names a choice with no text, or with math, by its position', () => {
    const config = list({ choices: [{ id: 'a', content: '<img src="x.png">' }, { id: 'b', content: '\\(1+1\\)' }] });

    expect(describeChoiceTile(i18n, config, { id: 'b', value: '\\(1+1\\)' })).toBe('Answer choice: number 2');
  });
});

describe('rows 5 to 11', () => {
  const config = list();
  const matrixConfig = matrix();

  it('rows 5 and 6: a tile in the pool, and in a category', () => {
    expect(describeChoiceTile(i18n, config, { id: '0', value: 'lists specifics' })).toBe(
      'Answer choice: lists specifics',
    );
    expect(describeChoiceTile(i18n, config, { id: '0', value: 'lists specifics', categoryId: 'yes' })).toBe(
      'Answer choice: lists specifics in category Structure of Say Yes',
    );
    expect(describeChoiceTile(i18n, matrixConfig, { id: '0', value: 'soft to loud', categoryId: 'c0' })).toBe(
      'Answer choice: soft to loud in category in row Range and column Volume',
    );
  });

  it('rows 7 and 8', () => {
    const selected = { id: '0', value: 'lists specifics' };

    expect(describeSelection(i18n, config, selected)).toBe(
      'Selected answer choice lists specifics. Use TAB to move to a drop area.',
    );
    expect(describeDeselection(i18n, config, selected)).toBe(
      'Answer choice lists specifics is no longer selected. Use TAB to move to an answer choice.',
    );
  });

  it('rows 9 to 11: where the focus is while a choice is selected', () => {
    const fromPool = { id: '0', value: 'lists specifics' };
    const placed = { ...fromPool, categoryId: 'yes' };

    expect(describeFocusTarget(i18n, config, fromPool, 'no')).toBe(
      'Selected drop area for category Structure of Say No. Press ENTER to move selected answer choice lists specifics here or TAB to move to a different drop area.',
    );
    expect(describeFocusTarget(i18n, config, placed, undefined)).toBe(
      'Press ENTER to remove selected answer choice lists specifics from drop area for category Structure of Say Yes or TAB to move to a category drop area.',
    );
    expect(describeFocusTarget(i18n, config, fromPool, undefined)).toBe(
      'Press ENTER to leave selected answer choice lists specifics unplaced or TAB to move to a category drop area.',
    );
  });
});

describe('rows 12 to 15: the result of a drop', () => {
  const one = matrix();
  const soft = { id: '0', value: 'soft to loud' };
  const low = { id: '1', value: 'low to high' };

  it('row 12: placed, and what it displaced', () => {
    expect(describePlacementResult(i18n, one, [], soft, 'c0')).toBe(
      'Placed answer choice soft to loud in drop area for category in row Range and column Volume.',
    );
    expect(describePlacementResult(i18n, one, [{ category: 'c1', choices: ['0'] }], low, 'c1')).toBe(
      'Placed answer choice low to high in drop area for category in row Range and column Pitch. To make room for it, answer choice soft to loud was removed.',
    );
  });

  it('row 12: a list says "To make room for it" too', () => {
    const one = list({ maxChoicesPerCategory: 1 });

    expect(
      describePlacementResult(i18n, one, [{ category: 'yes', choices: ['1'] }], { id: '0', value: 'lists specifics' }, 'yes'),
    ).toBe(
      'Placed answer choice lists specifics in drop area for category Structure of Say Yes. To make room for it, answer choice explains ideas was removed.',
    );
  });

  it('row 12: a category holding several displaces nothing', () => {
    const several = list();

    expect(
      describePlacementResult(i18n, several, [{ category: 'yes', choices: ['1'] }], { id: '0', value: 'lists specifics' }, 'yes'),
    ).toBe('Placed answer choice lists specifics in drop area for category Structure of Say Yes.');
  });

  it('row 13: moved', () => {
    expect(describePlacementResult(i18n, one, [], { ...low, categoryId: 'c0' }, 'c1')).toBe(
      'Moved answer choice low to high from drop area for category in row Range and column Volume to drop area for category in row Range and column Pitch.',
    );
  });

  it('row 14: removed', () => {
    expect(describePlacementResult(i18n, one, [], { ...low, categoryId: 'c1' }, undefined)).toBe(
      'Removed answer choice low to high from drop area for category in row Range and column Pitch.',
    );
  });

  it('row 15: nothing moved is a deselection', () => {
    expect(describePlacementResult(i18n, one, [], low, undefined)).toBe(
      'Answer choice low to high is no longer selected. Use TAB to move to an answer choice.',
    );
    expect(describePlacementResult(i18n, one, [], { ...low, categoryId: 'c1' }, 'c1')).toBe(
      'Answer choice low to high is no longer selected. Use TAB to move to an answer choice.',
    );
  });

  it('names a category with no label by its position', () => {
    const bare = list({ categories: [{ id: 'x' }, { id: 'y' }] });

    expect(describeCategory(i18n, bare, 'y')).toBe('category number 2');
  });
});
