/** The interface strings `@pie-element/match-list` renders; the source for every other locale. */
export default {
  /** Name of an answer choice with no text, from its id. */
  answerA11y: 'Answer {id}',
  /** Read on focusing an answer choice, after its name. */
  dragInstructionsA11y: 'Press ENTER to select.',
  /** Name of a focused answer choice in the pool; `{choice}` is its text. */
  answerChoiceA11y: 'Answer choice: {choice}',
  /** Name of a focused answer choice that sits in a drop area; `{number}` and `{text}` name the object. */
  answerChoiceInDropAreaA11y: 'Answer choice: {choice} in drop area for Object {number} {text}',

  /** Read before the objects: `{total}` objects, then whether answer choices can be reused. */
  introReusableA11y:
    'This question has {total} objects that need a match. Each object has one drop area for one answer choice. Answer choices can be reused. Place an answer choice in every drop area.',
  introNotReusableA11y:
    'This question has {total} objects that need a match. Each object has one drop area for one answer choice. Answer choices cannot be reused. Place an answer choice in every drop area.',
  keyboardHelpA11y: 'Use TAB to move between answer choices and drop areas, ENTER to select/drop, and ESC to cancel.',
  progressA11y: '{filled} of {total} drop areas have an answer choice.',
  /** Read before each object's text. */
  objectA11y: 'Object {number}.',
  dropAreaEmptyA11y: 'Drop area {number} is empty',
  dropAreaFilledA11y: 'Drop area {number} contains the answer choice {choice}',
  /** Read after the last object, listing the answer choices still available. */
  availableCountA11y: '{count} available answer choices.',
  availableEndA11y: 'End of available answer choices. Use TAB to move to an answer choice.',

  /** Announcements while an answer choice is selected and moved. */
  selectedA11y: 'Selected answer choice {choice}. Use TAB to choose a drop area.',
  notOverResponseAreaA11y: '{choice} is not over a response area.',
  overDropAreaA11y:
    'Selected drop area for Object {number} {text}. Press ENTER to move selected answer choice {choice} here or TAB to move to a different drop area.',
  overPoolFromDropAreaA11y:
    'Press ENTER to remove selected answer choice from Object {number} drop area or TAB to move to a different drop area. Selected answer choice: {choice}. Object {number}: {text}',
  overPoolUnplacedA11y:
    'Press ENTER to leave selected answer choice unplaced or TAB to move to a drop area. Selected answer choice: {choice}',
  placedA11y: 'Placed answer choice {choice} in drop area for Object {number}: {text}',
  movedA11y: 'Moved answer choice {choice} from Object {from} drop area to Object {to} drop area. {text}',
  removedA11y: 'Removed answer choice {choice} from Object {number} drop area',
  remainingA11y: '{filled} of {total} drop areas have an answer choice. {available} available answer choices. Use TAB to select an answer choice.',
  completeA11y: 'Answer is complete. {total} of {total} drop areas have an answer choice.',
  deselectedA11y: 'Answer choice {choice} is no longer selected. Use TAB to select an answer choice.',
  cancelledA11y: 'Answer choice {choice} is no longer selected. Use TAB to move to an answer choice.',
};
