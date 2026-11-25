/** The interface strings `@pie-lib/mask-markup` renders; the source for every other locale. */
export default {
  /** Accessible name of a constructed-response box, by its position among the item's boxes. */
  response: 'Response {index} of {total}',
  /** Accessible name of a drag-in-the-blank drop area, by its number. */
  blank: 'Blank {index}',
  /** Visually hidden name of an item's only inline dropdown. */
  query: 'Query',
  /** Visually hidden name of one of an item's inline dropdowns, by its number. */
  queryNumber: 'Query {index}',

  /** Name of an answer choice with no text (an image, say), from its id. */
  answerA11y: 'Answer {id}',
  /** Read on focusing an answer choice, after its name. */
  dragInstructionsA11y: 'Press ENTER to select.',
  /** Name of a focused answer choice in the pool; `{choice}` is its text. */
  answerChoiceA11y: 'Answer choice: {choice}',
  /** Name of a focused answer choice that sits in a blank. */
  answerChoiceInBlankA11y: 'Answer choice: {choice} in blank {number}',

  /** Read after the prompt, before the template; the intro is these five sentences in order. */
  introCountA11y: 'This question has {blanks} blanks and {choices} answer choices.',
  introReusableA11y: 'Answer choices can be reused.',
  introNotReusableA11y: 'Answer choices cannot be reused.',
  introDropAreaA11y: 'Each blank is a drop area that must be filled with a single answer choice.',
  keyboardHelpA11y: 'Use TAB to move between answer choices and blanks, ENTER to select/drop, and ESC to cancel.',
  progressA11y: '{filled} of {total} blanks have an answer choice.',
  /** Name of a blank read in the template; `{choice}` is the text of the answer choice it holds. */
  blankEmptyA11y: 'Blank {number} is empty',
  blankFilledA11y: 'Blank {number} contains the answer choice {choice} end of answer choice',
  /** Read around the answer choices still available. */
  availableCountA11y: '{count} available answer choices.',
  availableEndA11y: 'End of available answer choices. Use TAB to move to an answer choice.',

  /** Announcements while an answer choice is selected and moved. */
  selectedA11y: 'Selected answer choice {choice}. Use TAB to choose a blank.',
  notOverBlankA11y: '{choice} is not over a blank.',
  overBlankA11y:
    'Selected blank {number}. Press ENTER to move selected answer choice {choice} here or TAB to move to a different blank.',
  overPoolFromBlankA11y:
    'Press ENTER to remove selected answer choice from blank {number} or TAB to move to a different blank. Selected answer choice: {choice}',
  overPoolUnplacedA11y:
    'Press ENTER to leave selected answer choice unplaced or TAB to move to a blank. Selected answer choice: {choice}',
  placedA11y: 'Placed answer choice {choice} in blank {number}',
  movedA11y: 'Moved answer choice {choice} from blank {from} to blank {to}.',
  removedA11y: 'Removed answer choice {choice} from blank {number}.',
  remainingA11y:
    '{filled} of {total} blanks have an answer choice. {available} available answer choices. Use TAB to select an answer choice.',
  completeA11y: 'Answer is complete. {total} of {total} blanks have an answer choice.',
  deselectedA11y: 'Answer choice {choice} is no longer selected. Use TAB to select an answer choice.',
};
