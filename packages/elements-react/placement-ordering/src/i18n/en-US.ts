/** The interface strings `@pie-element/placement-ordering` renders; the source for every other locale. */
export default {
  /** Read to a screen reader on a focused tile when the item has response areas. */
  dragInstructions:
    'Press Space or Enter to pick up this answer choice. Once picked up, use Tab or Shift+Tab to cycle through response areas, or use arrow keys to move it freely. Press Space or Enter to drop, or Escape to cancel.',
  /** Shown with the correct answer when alternate correct answers are defined; an authored note replaces it. */
  commonCorrectAnswerWithAlternates:
    'Note: The answer shown above is the most common correct answer for this item. One or more additional correct answers are also defined, and will also be recognized as correct.',
  /**
   * What a screen reader hears of an item with response areas. Slots, where a key uses them: `{text}` is
   * an object's text, `{position}` a sort position counted from one, `{total}` the number of sort
   * positions, `{sorted}` the number of objects in them, `{count}` the size of a column, `{from}` and `{to}`
   * the sort positions an object moved between, `{occupant}` the text of the object already in a position.
   *
   * Read once with the item, before the objects; the count follows it.
   */
  readingInstructions:
    'Build a sorted list by moving each object to the correct position. Use TAB to move between objects and drop areas, ENTER to select/drop, and ESC to cancel.',
  /** Slots `{sorted}` and `{total}`; the plural is chosen by `{total}`. */
  objectsAreOnSortedList: {
    one: '{sorted} of {total} object is on the sorted list.',
    other: '{sorted} of {total} objects are on the sorted list.',
  },
  /** After the heading of the unsorted column, by the number of objects in it. */
  unsortedObjects: {
    one: '{count} unsorted object',
    other: '{count} unsorted objects',
  },
  /** After the heading of the sorted column, by the number of objects in it. */
  sortedObjects: {
    one: '{count} sorted object',
    other: '{count} sorted objects',
  },
  /** Before the text of each unsorted object. */
  unsortedObjectPrefix: 'object:',
  /** Before the text of each sorted object. Slot `{position}`. */
  sortedObjectPrefix: 'Sort position {position}:',
  endOfUnsorted: 'End of unsorted objects',
  endOfSorted: 'End of sorted objects.',
  /** After `endOfSorted`, when the objects can be moved. */
  useTabToObject: 'Use TAB to move to an object.',

  /** An unsorted object gets focus. Slot `{text}`. */
  unsortedObjectFocus: 'Unsorted object {text} Press ENTER to select or TAB to move to a different object.',
  /** A sorted object gets focus. Slots `{text}`, `{position}` and `{total}`. */
  sortedObjectFocus:
    'Sorted object {text} In position {position} of {total}. Press ENTER to select or TAB to move to a different object',
  /** An empty sort position gets focus while an object, `{text}`, is selected. Slots `{position}` and `{total}` too. */
  emptyPositionFocus:
    'On sort position {position} of {total}, which is empty. Press ENTER to move selected object {text} here or use TAB to move to a different position.',
  /**
   * A sort position holding `{occupant}` gets focus while an object, `{text}`, is selected. Slots `{position}`
   * and `{total}` too.
   */
  occupiedPositionFocus:
    'On sort position {position} of {total}, which contains object {occupant}. Use TAB to move to a different position or press ENTER to move the selected object {text} here, which will return the object currently in sort position {position} to unsorted.',
  /** The unsorted list gets focus while a sorted object, `{text}`, is selected. */
  unsortedListReturnFocus:
    'On unsorted list. Press ENTER to return selected object {text} to unsorted or use TAB to move to a sort position.',
  /** The unsorted list gets focus while an unsorted object, `{text}`, is selected. */
  unsortedListLeaveFocus:
    'On unsorted list. Press ENTER to leave object {text} unsorted or use TAB to move to a sort position.',

  /** An unsorted object was selected. */
  selectedUnsorted: 'Selected object {text} Use TAB to move to a sorted position.',
  /** A sorted object was selected. Slots `{text}`, `{position}` and `{total}`. */
  selectedSorted:
    'Selected object {text}, which is in sort position {position} of {total}. Use TAB to move to a different position.',

  /** The parts of what a move says, in this order: what moved, what it displaced, how many are sorted, what to do next. */
  placed: 'Placed object {text} in sort position {position} of {total}.',
  moved: 'Moved object {text} from sort position {from} to sort position {to}.',
  removed: 'Removed object {text} from sort position {position}.',
  returnedToUnsorted: 'Object {text} has been returned to unsorted list.',
  /** Says the answer is complete. Slot `{total}`, which also chooses the plural. */
  answerComplete: {
    one: 'Answer is complete. {total} of {total} object on sorted list.',
    other: 'Answer is complete. {total} of {total} objects on sorted list.',
  },
  /** Slots `{sorted}` and `{total}`; the plural is chosen by `{total}`. */
  objectsOnSortedList: {
    one: '{sorted} of {total} object on sorted list.',
    other: '{sorted} of {total} objects on sorted list.',
  },
  useTabToAnotherObject: 'Use TAB to move to another object.',
  /** A selection ended without moving the object. */
  noLongerSelected: 'Object {text} is no longer selected.',
};
