import { describe, expect, it, vi } from 'vitest';
import {
  cancelledMessage,
  focusLabel,
  getCounts,
  movedMessage,
  readingInstructions,
  selectedMessage,
  sortedHeading,
  toPlainText,
  unsortedHeading,
} from '../announcements';
import { catalogs } from '../../i18n/index';

const i18n = catalogs.forLocale('en-US');

// Five sort positions; positions 1 and 5 (indexes 0 and 4) hold objects, the rest are empty.
const tile = (index: number, label?: string) => ({ type: 'target', index, label, empty: !label });
const pool = [1, 2, 3].map((n) => ({ type: 'choice', id: `c${n}`, label: `Choice ${n}` }));
const tiles = [...pool, tile(0, 'Alpha'), tile(1), tile(2), tile(3), tile(4, '<p>Omega</p>')];
const counts = getCounts(tiles);

describe('announcements', () => {
  it('reads labels as plain text', () => {
    expect(toPlainText('<p>Fish &amp; <b>chips</b></p>')).toBe('Fish & chips');
  });

  it('reads an image by its alternative text and math by its alttext', () => {
    expect(toPlainText('<p><img src="t.png" alt="triangle"> with <math alttext="x squared"><mi>x</mi></math></p>')).toBe(
      'triangle with x squared',
    );
    expect(toPlainText('<img src="t.png">')).toBe('');
  });

  it('reads math without an alttext by its own text', () => {
    expect(toPlainText('<math><mn>3</mn><mo>/</mo><mn>4</mn></math>')).toBe('3 / 4');
  });

  it('reads the tokens of math with no alttext apart, and not its annotation', () => {
    expect(toPlainText('<math><mfrac><mn>1</mn><mn>2</mn></mfrac></math>')).toBe('1 2');
    expect(toPlainText('<math><msup><mi>x</mi><mn>2</mn></msup></math>')).toBe('x 2');
    expect(
      toPlainText(
        '<math><semantics><mrow><mn>3</mn><mo>/</mo><mn>4</mn></mrow><annotation encoding="application/x-tex">\\frac{3}{4}</annotation></semantics></math>',
      ),
    ).toBe('3 / 4');
  });

  it('reads the tokens of math whose alttext is empty, and nothing of an image whose alt is', () => {
    expect(toPlainText('<math alttext=""><mn>3</mn></math>')).toBe('3');
    expect(toPlainText('<p>a <img src="d.png" alt=""> b</p>')).toBe('a b');
  });

  it('reads math and images the same way where there is no DOM parser', () => {
    vi.stubGlobal('DOMParser', undefined);

    try {
      expect(toPlainText('<math alttext="x squared"><mi>x</mi><mn>2</mn></math>')).toBe('x squared');
      expect(toPlainText('<p>a <img src="t.png" alt="triangle"> b</p>')).toBe('a triangle b');
      expect(toPlainText('<math><mn>3</mn><mo>/</mo><mn>4</mn></math>')).toBe('3 / 4');
      expect(toPlainText('<math alttext=""><mn>3</mn></math>')).toBe('3');
      expect(toPlainText('<p>a <img src="d.png" alt=""> b</p>')).toBe('a b');
      expect(
        toPlainText(
          '<math><semantics><mn>3</mn><annotation encoding="application/x-tex">\\frac{3}{4}</annotation></semantics></math>',
        ),
      ).toBe('3');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('counts the sorted and unsorted objects', () => {
    expect(counts).toEqual({ sorted: 2, unsorted: 3, total: 5 });
  });

  it('counts the objects in the unsorted column when a choice can be placed more than once', () => {
    // Three choices, two placed, and still all three in the column
    expect(getCounts([...pool, tile(0, 'Alpha'), tile(1, 'Beta'), tile(2)])).toEqual({ sorted: 2, unsorted: 3, total: 3 });
  });

  it('reads the instructions and count before the objects (row 1)', () => {
    expect(readingInstructions(i18n, counts)).toBe(
      'Build a sorted list by moving each object to the correct position. Use TAB to move between objects and drop areas, ENTER to select/drop, and ESC to cancel. 2 of 5 objects are on the sorted list.',
    );
  });

  it('reads the column headings with their counts (rows 2 and 5)', () => {
    expect(unsortedHeading(i18n, undefined, counts)).toBe('3 unsorted objects');
    expect(sortedHeading(i18n, '<p>Target</p>', counts)).toBe('Target 2 sorted objects');
  });

  describe('on focus', () => {
    it('names an unsorted and a sorted object (rows 8 and 9)', () => {
      expect(focusLabel(i18n, { type: 'choice', label: 'Alpha' }, null, counts)).toBe(
        'Unsorted object Alpha Press ENTER to select or TAB to move to a different object.',
      );
      expect(focusLabel(i18n, tile(0, 'Alpha'), null, counts)).toBe(
        'Sorted object Alpha In position 1 of 5. Press ENTER to select or TAB to move to a different object',
      );
    });

    it('names a sort position while an object is selected (rows 12 and 13)', () => {
      const selected = { type: 'choice', value: 'Beta' };

      expect(focusLabel(i18n, tile(1), selected, counts)).toBe(
        'On sort position 2 of 5, which is empty. Press ENTER to move selected object Beta here or use TAB to move to a different position.',
      );
      expect(focusLabel(i18n, tile(4, 'Omega'), selected, counts)).toBe(
        'On sort position 5 of 5, which contains object Omega. Use TAB to move to a different position or press ENTER to move the selected object Beta here, which will return the object currently in sort position 5 to unsorted.',
      );
    });

    it('names the unsorted list for a sorted and for an unsorted selection (rows 14 and 15)', () => {
      expect(focusLabel(i18n, { type: 'choice', empty: true }, { type: 'target', value: 'Omega' }, counts)).toBe(
        'On unsorted list. Press ENTER to return selected object Omega to unsorted or use TAB to move to a sort position.',
      );
      expect(focusLabel(i18n, { type: 'choice', empty: true }, { type: 'choice', value: 'Beta' }, counts)).toBe(
        'On unsorted list. Press ENTER to leave object Beta unsorted or use TAB to move to a sort position.',
      );
    });
  });

  describe('on selection (rows 10 and 11)', () => {
    it('names an unsorted object', () => {
      expect(selectedMessage(i18n, { type: 'choice', value: 'Beta' }, counts)).toBe(
        'Selected object Beta Use TAB to move to a sorted position.',
      );
    });

    it('names a sorted object and its position', () => {
      expect(selectedMessage(i18n, { type: 'target', index: 4, value: 'Omega' }, counts)).toBe(
        'Selected object Omega, which is in sort position 5 of 5. Use TAB to move to a different position.',
      );
    });
  });

  describe('after a move', () => {
    const beta = { type: 'choice', value: 'Beta' };

    it('places an object in an empty position (row 16)', () => {
      expect(movedMessage(i18n, tiles, beta, { type: 'target', index: 1 })).toBe(
        'Placed object Beta in sort position 2 of 5. 3 of 5 objects on sorted list. Use TAB to move to another object.',
      );
    });

    it('completes the answer when no position is left empty (row 16)', () => {
      const almost = [tile(0, 'A'), tile(1, 'B'), tile(2, 'C'), tile(3, 'D'), tile(4)];

      expect(movedMessage(i18n, almost, beta, { type: 'target', index: 4 })).toBe(
        'Placed object Beta in sort position 5 of 5. Answer is complete. 5 of 5 objects on sorted list.',
      );
    });

    it('places an object in an occupied position (row 17)', () => {
      expect(movedMessage(i18n, tiles, beta, { type: 'target', index: 4 })).toBe(
        'Placed object Beta in sort position 5 of 5. Object Omega has been returned to unsorted list. 2 of 5 objects on sorted list. Use TAB to move to another object.',
      );
    });

    it('moves an object to an empty position (row 18)', () => {
      expect(movedMessage(i18n, tiles, { type: 'target', index: 0, value: 'Alpha' }, { type: 'target', index: 3 })).toBe(
        'Moved object Alpha from sort position 1 to sort position 4. 2 of 5 objects on sorted list. Use TAB to move to another object.',
      );
    });

    it('moves an object to an occupied position (row 19)', () => {
      expect(movedMessage(i18n, tiles, { type: 'target', index: 0, value: 'Alpha' }, { type: 'target', index: 4 })).toBe(
        'Moved object Alpha from sort position 1 to sort position 5. Object Omega has been returned to unsorted list. 1 of 5 objects on sorted list. Use TAB to move to another object.',
      );
    });

    it('removes an object (row 20)', () => {
      expect(movedMessage(i18n, tiles, { type: 'target', index: 4, value: 'Omega' }, { type: 'choice' })).toBe(
        'Removed object Omega from sort position 5. 1 of 5 objects on sorted list. Use TAB to move to another object.',
      );
    });

    it('says nothing when nothing moves', () => {
      expect(movedMessage(i18n, tiles, beta, { type: 'choice' })).toBeUndefined();
    });
  });

  it('announces a cancelled selection (row 21)', () => {
    expect(cancelledMessage(i18n, { value: 'Beta' }, counts)).toBe(
      'Object Beta is no longer selected. 2 of 5 objects on sorted list. Use TAB to move to another object.',
    );
  });
});

describe('focus labels with an object selected', () => {
  const counts5 = getCounts([tile(0, 'Alpha'), tile(1), tile(2), tile(3), tile(4, 'Omega')]);

  it('names the selected object, not a move onto itself', () => {
    const selected = { type: 'target', index: 0, value: 'Alpha' };

    expect(focusLabel(i18n, { type: 'target', index: 0, label: 'Alpha' }, selected, counts5)).toBe(
      'Selected object Alpha, which is in sort position 1 of 5. Use TAB to move to a different position.',
    );
  });

  it('names the unsorted list only as the selected object’s own place in it', () => {
    const selected = { type: 'target', id: 'a', index: 0, value: 'Alpha' };

    expect(focusLabel(i18n, { type: 'choice', id: 'a', empty: true }, selected, counts5)).toContain('On unsorted list.');
    expect(focusLabel(i18n, { type: 'choice', id: 'b', empty: true }, selected, counts5)).toBeUndefined();
    expect(focusLabel(i18n, { type: 'choice', id: 'b', label: 'Beta' }, selected, counts5)).toBe(
      'Unsorted object Beta Press ENTER to select or TAB to move to a different object.',
    );
  });

  it('labels nothing in a disabled item, whose tiles have no role to carry a label', () => {
    expect(focusLabel(i18n, { type: 'choice', label: 'Beta', disabled: true }, null, counts5)).toBeUndefined();
    expect(focusLabel(i18n, { type: 'target', index: 0, label: 'Alpha', disabled: true }, null, counts5)).toBeUndefined();
    expect(readingInstructions(i18n, counts5, true)).toBe('2 of 5 objects are on the sorted list.');
  });
});

describe('announcements in another language', () => {
  it('say a placement in Spanish, with the plural of the language', async () => {
    await catalogs.load('es');
    const es = catalogs.forLocale('es');

    expect(movedMessage(es, tiles, { type: 'choice', value: 'Beta' }, { type: 'target', index: 1 })).toBe(
      'Objeto Beta colocado en la posición 2 de 5. 3 de 5 objetos en la lista ordenada. Usa Tab para ir a otro objeto.',
    );
    expect(unsortedHeading(es, undefined, { sorted: 4, unsorted: 1, total: 5 })).toBe('1 objeto sin ordenar');
  });

  it('count in the singular in English', () => {
    expect(unsortedHeading(i18n, undefined, { sorted: 4, unsorted: 1, total: 5 })).toBe('1 unsorted object');
    expect(sortedHeading(i18n, 'Target', { sorted: 0, unsorted: 5, total: 5 })).toBe('Target 0 sorted objects');
  });
});

describe('plural announcements in every locale', () => {
  // Every plural key, with the slots it is read with, at counts that fall in each locale's categories
  const counts = [0, 1, 2, 3, 5, 11, 100];
  const keys = {
    objectsAreOnSortedList: (n: number) => ({ count: n, sorted: 1, total: n }),
    unsortedObjects: (n: number) => ({ count: n }),
    sortedObjects: (n: number) => ({ count: n }),
    answerComplete: (n: number) => ({ count: n, total: n }),
    objectsOnSortedList: (n: number) => ({ count: n, sorted: 1, total: n }),
  } as const;

  it.each(catalogs.locales.filter((locale) => locale !== 'en-US'))(
    'reads every count in %s as text of its own, with its numbers',
    async (locale) => {
      await catalogs.load(locale);
      const translator = catalogs.forLocale(locale);

      for (const [key, slots] of Object.entries(keys)) {
        for (const n of counts) {
          const text = translator.plural(key as keyof typeof keys, slots(n));

          expect(text, `${locale} ${key} ${n}`).not.toBe(key);
          expect(text, `${locale} ${key} ${n}`).not.toMatch(/\{\w+\}/);
          expect(text, `${locale} ${key} ${n}`).toContain(String(n));
        }
      }
    },
  );
});
