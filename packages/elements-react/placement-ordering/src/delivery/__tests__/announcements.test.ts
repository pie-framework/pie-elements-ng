import { describe, expect, it } from 'vitest';
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

// Five sort positions; positions 1 and 5 (indexes 0 and 4) hold objects, the rest are empty.
const tile = (index: number, label?: string) => ({ type: 'target', index, label, empty: !label });
const tiles = [tile(0, 'Alpha'), tile(1), tile(2), tile(3), tile(4, '<p>Omega</p>')];
const counts = getCounts(tiles);

describe('announcements', () => {
  it('reads labels as plain text', () => {
    expect(toPlainText('<p>Fish &amp; <b>chips</b></p>')).toBe('Fish & chips');
  });

  it('counts the sorted and unsorted objects', () => {
    expect(counts).toEqual({ sorted: 2, unsorted: 3, total: 5 });
  });

  it('reads the instructions and count before the objects (row 1)', () => {
    expect(readingInstructions(counts)).toBe(
      'Build a sorted list by moving each object to the correct position. Use TAB to move between objects and drop areas, ENTER to select/drop, and ESC to cancel. 2 of 5 objects are on the sorted list.',
    );
  });

  it('reads the column headings with their counts (rows 2 and 5)', () => {
    expect(unsortedHeading(undefined, counts)).toBe('3 unsorted objects');
    expect(sortedHeading('<p>Target</p>', counts)).toBe('Target 2 sorted objects');
  });

  describe('on focus', () => {
    it('names an unsorted and a sorted object (rows 8 and 9)', () => {
      expect(focusLabel({ type: 'choice', label: 'Alpha' }, null, counts)).toBe(
        'Unsorted object Alpha Press ENTER to select or TAB to move to a different object.',
      );
      expect(focusLabel(tile(0, 'Alpha'), null, counts)).toBe(
        'Sorted object Alpha In position 1 of 5. Press ENTER to select or TAB to move to a different object',
      );
    });

    it('names a sort position while an object is selected (rows 12 and 13)', () => {
      const selected = { type: 'choice', value: 'Beta' };

      expect(focusLabel(tile(1), selected, counts)).toBe(
        'On sort position 2 of 5, which is empty. Press ENTER to move selected object Beta here or use TAB to move to a different position.',
      );
      expect(focusLabel(tile(4, 'Omega'), selected, counts)).toBe(
        'On sort position 5 of 5, which contains object Omega. Use TAB to move to a different position or press ENTER to move the selected object Beta here, which will return the object currently in sort position 5 to unsorted.',
      );
    });

    it('names the unsorted list for a sorted and for an unsorted selection (rows 14 and 15)', () => {
      expect(focusLabel({ type: 'choice', empty: true }, { type: 'target', value: 'Omega' }, counts)).toBe(
        'On unsorted list. Press ENTER to return selected object Omega to unsorted or use TAB to move to a sort position.',
      );
      expect(focusLabel({ type: 'choice', empty: true }, { type: 'choice', value: 'Beta' }, counts)).toBe(
        'On unsorted list. Press ENTER to leave object Beta unsorted or use TAB to move to a sort position.',
      );
    });
  });

  describe('on selection (rows 10 and 11)', () => {
    it('names an unsorted object', () => {
      expect(selectedMessage({ type: 'choice', value: 'Beta' }, counts)).toBe(
        'Selected object Beta Use TAB to move to a sorted position.',
      );
    });

    it('names a sorted object and its position', () => {
      expect(selectedMessage({ type: 'target', index: 4, value: 'Omega' }, counts)).toBe(
        'Selected object Omega, which is in sort position 5 of 5. Use TAB to move to a different position.',
      );
    });
  });

  describe('after a move', () => {
    const beta = { type: 'choice', value: 'Beta' };

    it('places an object in an empty position (row 16)', () => {
      expect(movedMessage(tiles, beta, { type: 'target', index: 1 })).toBe(
        'Placed object Beta in sort position 2 of 5. 3 of 5 objects on sorted list. Use TAB to move to another object.',
      );
    });

    it('completes the answer when no position is left empty (row 16)', () => {
      const almost = [tile(0, 'A'), tile(1, 'B'), tile(2, 'C'), tile(3, 'D'), tile(4)];

      expect(movedMessage(almost, beta, { type: 'target', index: 4 })).toBe(
        'Placed object Beta in sort position 5 of 5. Answer is complete. 5 of 5 objects on sorted list.',
      );
    });

    it('places an object in an occupied position (row 17)', () => {
      expect(movedMessage(tiles, beta, { type: 'target', index: 4 })).toBe(
        'Placed object Beta in sort position 5 of 5. Object Omega has been returned to unsorted list. 2 of 5 objects on sorted list. Use TAB to move to another object.',
      );
    });

    it('moves an object to an empty position (row 18)', () => {
      expect(movedMessage(tiles, { type: 'target', index: 0, value: 'Alpha' }, { type: 'target', index: 3 })).toBe(
        'Moved object Alpha from sort position 1 to sort position 4. 2 of 5 objects on sorted list. Use TAB to move to another object.',
      );
    });

    it('moves an object to an occupied position (row 19)', () => {
      expect(movedMessage(tiles, { type: 'target', index: 0, value: 'Alpha' }, { type: 'target', index: 4 })).toBe(
        'Moved object Alpha from sort position 1 to sort position 5. Object Omega has been returned to unsorted list. 1 of 5 objects on sorted list. Use TAB to move to another object.',
      );
    });

    it('removes an object (row 20)', () => {
      expect(movedMessage(tiles, { type: 'target', index: 4, value: 'Omega' }, { type: 'choice' })).toBe(
        'Removed object Omega from sort position 5. 1 of 5 objects on sorted list. Use TAB to move to another object.',
      );
    });

    it('says nothing when nothing moves', () => {
      expect(movedMessage(tiles, beta, { type: 'choice' })).toBeUndefined();
    });
  });

  it('announces a cancelled selection (row 21)', () => {
    expect(cancelledMessage({ value: 'Beta' }, counts)).toBe(
      'Object Beta is no longer selected. 2 of 5 objects on sorted list. Use TAB to move to another object.',
    );
  });
});

describe('focus labels with an object selected', () => {
  const counts5 = getCounts([tile(0, 'Alpha'), tile(1), tile(2), tile(3), tile(4, 'Omega')]);

  it('names the selected object, not a move onto itself', () => {
    const selected = { type: 'target', index: 0, value: 'Alpha' };

    expect(focusLabel({ type: 'target', index: 0, label: 'Alpha' }, selected, counts5)).toBe(
      'Selected object Alpha, which is in sort position 1 of 5. Use TAB to move to a different position.',
    );
  });

  it('names the unsorted list only as the selected object’s own place in it', () => {
    const selected = { type: 'target', id: 'a', index: 0, value: 'Alpha' };

    expect(focusLabel({ type: 'choice', id: 'a', empty: true }, selected, counts5)).toContain('On unsorted list.');
    expect(focusLabel({ type: 'choice', id: 'b', empty: true }, selected, counts5)).toBeUndefined();
    expect(focusLabel({ type: 'choice', id: 'b', label: 'Beta' }, selected, counts5)).toBe(
      'Unsorted object Beta Press ENTER to select or TAB to move to a different object.',
    );
  });

  it('only names the objects of a disabled item', () => {
    expect(focusLabel({ type: 'choice', label: 'Beta', disabled: true }, null, counts5)).toBe('Unsorted object Beta');
    expect(focusLabel({ type: 'target', index: 0, label: 'Alpha', disabled: true }, null, counts5)).toBe(
      'Sorted object Alpha In position 1 of 5.',
    );
    expect(readingInstructions(counts5, true)).toBe('2 of 5 objects are on the sorted list.');
  });
});
