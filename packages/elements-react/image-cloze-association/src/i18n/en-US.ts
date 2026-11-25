/** The interface strings `@pie-element/image-cloze-association` renders; the source for every other locale. */
export default {
  /** Accessible name of a choice, by its position among the item's choices. */
  answerChoice: 'Answer choice {index} of {total}',
  /** Accessible name of the item image, by its number of response areas. */
  image: {
    one: 'Image with {count} response area',
    other: 'Image with {count} response areas',
  },
  /**
   * Shown when a drop would exceed the per-area limit, by that limit. The warning shows only for a
   * limit above one (a limit of one replaces the placed choice), so `other` is the form learners see.
   */
  reachedLimit: {
    one: 'You’ve reached the limit of {count} response per area. To add another response, one must first be removed.',
    other: 'Full',
  },
  /** Accessible name of a response area without an authored one, by its position. */
  responseArea: 'Response area {index} of {total}',
  /** Name of the answer choice pool, read when it is a tab stop. */
  choicesListA11y: 'Choices list',

  /* Screen reader announcements. A tile's drag instruction, read after its name. */
  dragInstructionsA11y: 'Press ENTER to select.',
  /** Names a choice that has no text of its own, by its position among the item's choices. */
  unnamedChoiceA11y: 'number {index}',
  /** Intro, row 1: the image, its drop areas and its answer choices. */
  introImageA11y: 'The image shows {alt}.',
  introImageNoAltA11y: 'The image.',
  introSingleAreaSingleA11y: 'It has 1 drop area, which can hold 1 answer choice.',
  introSingleAreaMultiA11y: 'It has 1 drop area, which can hold up to {capacity} answer choices.',
  introMultiAreasSingleA11y: 'It has {areas} drop areas, which can each hold 1 answer choice.',
  introMultiAreasMultiA11y: 'It has {areas} drop areas, which can each hold up to {capacity} answer choices.',
  introChoicesReusableA11y: {
    one: 'There is {count} answer choice, which can be reused.',
    other: 'There are {count} answer choices, which can be reused.',
  },
  introChoicesNotReusableA11y: {
    one: 'There is {count} answer choice, which cannot be reused.',
    other: 'There are {count} answer choices, which cannot be reused.',
  },
  /** Intro, row 2. */
  keyboardHelpA11y: 'Use TAB to move between answer choices and drop areas, ENTER to select/drop, and ESC to cancel.',
  /** Intro, row 3: each drop area and what it holds. */
  dropAreaEmptyA11y: 'Drop area {label} is empty.',
  dropAreaContainsA11y: 'Drop area {label} contains the following:',
  dropAreaChoiceA11y: 'answer choice {choice}',
  dropAreaEndA11y: 'End of answer choices in drop area.',
  dropAreaSingleFilledA11y: 'Drop area {label} contains answer choice {choice}.',
  /** Intro, row 4: the answer choices still in the pool. */
  availableA11y: {
    one: '{count} available answer choice.',
    other: '{count} available answer choices.',
  },
  availableChoiceA11y: 'Answer choice: {choice}',
  availableEndA11y: 'End of available answer choices.',
  tabToChoiceA11y: 'Use TAB to move to answer choice.',
  tabToChoicesA11y: 'Use TAB to move to an answer choice.',
  /** Rows 5 and 6: the name of a choice tile in the pool, and in a drop area. */
  answerChoiceA11y: 'Answer choice: {choice}',
  answerChoiceInDropAreaA11y: 'Answer choice: {choice} in drop area {label}',
  /** Row 7: a choice was selected, by whether the item has one drop area or several. */
  selectedSingleAreaA11y: 'Selected answer choice {choice}. Use TAB to move to drop area.',
  selectedMultiAreasA11y: 'Selected answer choice {choice}. Use TAB to move to a drop area.',
  /** Rows 8 and 15: a selection ended without moving anything. */
  deselectedA11y: 'Answer choice {choice} is no longer selected. Use TAB to move to an answer choice.',
  /** Row 9: a drop area has focus while a choice is selected. */
  overAreaSingleA11y:
    'Selected drop area {label}. Press ENTER to move selected answer choice {choice} here or ESC to cancel.',
  overAreaMultiA11y:
    'Selected drop area {label}. Press ENTER to move selected answer choice {choice} here or TAB to move to a different drop area.',
  /** Row 10: the pool has focus while the selected choice is in a drop area. */
  overPoolFromAreaSingleA11y:
    'Press ENTER to remove selected answer choice {choice} from {label} drop area or ESC to cancel.',
  overPoolFromAreaMultiA11y:
    'Press ENTER to remove selected answer choice {choice} from {label} drop area or TAB to move to a drop area.',
  /** Row 11: the pool has focus while the selected choice is already in it. */
  overPoolUnplacedSingleA11y:
    'Press ENTER to leave selected answer choice {choice} unplaced or TAB to move to drop area.',
  overPoolUnplacedMultiA11y:
    'Press ENTER to leave selected answer choice {choice} unplaced or TAB to move to a drop area.',
  /** Focus is on none of the drop areas or the pool during a drag. */
  notOverDropAreaA11y: '{choice} is not over a drop area.',
  /** Rows 12 to 14: what a placement just did. */
  placedA11y: 'Placed answer choice {choice} in {label} drop area.',
  replacedA11y: 'To make room for it, answer choice {removed} was removed.',
  movedA11y: 'Moved answer choice {choice} from {from} drop area to {to} drop area.',
  removedA11y: 'Removed answer choice {choice} from {label} drop area.',
};
