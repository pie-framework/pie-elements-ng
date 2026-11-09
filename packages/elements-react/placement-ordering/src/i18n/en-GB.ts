import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  dragInstructions: 'Press Space or Enter to pick up this answer choice. Once picked up, use Tab or Shift+Tab to cycle through response areas, or use arrow keys to move it freely. Press Space or Enter to drop, or Escape to cancel.',
  commonCorrectAnswerWithAlternates: 'Note: The answer shown above is the most common correct answer for this item. One or more additional correct answers are also defined, and will also be recognized as correct.',
  readingInstructions: 'Build a sorted list by moving each object to the correct position. Use TAB to move between objects and drop areas, ENTER to select/drop, and ESC to cancel.',
  objectsAreOnSortedList: {
    one: '{sorted} of {total} object is on the sorted list.',
    other: '{sorted} of {total} objects are on the sorted list.',
  },
  unsortedObjects: {
    one: '{count} unsorted object',
    other: '{count} unsorted objects',
  },
  sortedObjects: {
    one: '{count} sorted object',
    other: '{count} sorted objects',
  },
  unsortedObjectPrefix: 'object:',
  sortedObjectPrefix: 'Sort position {position}:',
  endOfUnsorted: 'End of unsorted objects',
  endOfSorted: 'End of sorted objects.',
  useTabToObject: 'Use TAB to move to an object.',
  unsortedObjectFocus: 'Unsorted object {text} Press ENTER to select or TAB to move to a different object.',
  sortedObjectFocus: 'Sorted object {text} In position {position} of {total}. Press ENTER to select or TAB to move to a different object',
  emptyPositionFocus: 'On sort position {position} of {total}, which is empty. Press ENTER to move selected object {text} here or use TAB to move to a different position.',
  occupiedPositionFocus: 'On sort position {position} of {total}, which contains object {occupant}. Use TAB to move to a different position or press ENTER to move the selected object {text} here, which will return the object currently in sort position {position} to unsorted.',
  unsortedListReturnFocus: 'On unsorted list. Press ENTER to return selected object {text} to unsorted or use TAB to move to a sort position.',
  unsortedListLeaveFocus: 'On unsorted list. Press ENTER to leave object {text} unsorted or use TAB to move to a sort position.',
  selectedUnsorted: 'Selected object {text} Use TAB to move to a sorted position.',
  selectedSorted: 'Selected object {text}, which is in sort position {position} of {total}. Use TAB to move to a different position.',
  placed: 'Placed object {text} in sort position {position} of {total}.',
  moved: 'Moved object {text} from sort position {from} to sort position {to}.',
  removed: 'Removed object {text} from sort position {position}.',
  returnedToUnsorted: 'Object {text} has been returned to unsorted list.',
  answerComplete: {
    one: 'Answer is complete. {total} of {total} object on sorted list.',
    other: 'Answer is complete. {total} of {total} objects on sorted list.',
  },
  objectsOnSortedList: {
    one: '{sorted} of {total} object on sorted list.',
    other: '{sorted} of {total} objects on sorted list.',
  },
  useTabToAnotherObject: 'Use TAB to move to another object.',
  noLongerSelected: 'Object {text} is no longer selected.',
} satisfies MessageCatalog;
