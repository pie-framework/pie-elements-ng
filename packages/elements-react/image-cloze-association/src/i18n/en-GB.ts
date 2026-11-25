import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoice: 'Answer choice {index} of {total}',
  image: {
    one: 'Image with {count} response area',
    other: 'Image with {count} response areas',
  },
  reachedLimit: {
    one: 'You’ve reached the limit of {count} response per area. To add another response, one must first be removed.',
    other: 'Full',
  },
  responseArea: 'Response area {index} of {total}',
  choicesListA11y: 'Choices list',
  dragInstructionsA11y: 'Press ENTER to select.',
  unnamedChoiceA11y: 'number {index}',
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
  keyboardHelpA11y: 'Use TAB to move between answer choices and drop areas, ENTER to select/drop, and ESC to cancel.',
  dropAreaEmptyA11y: 'Drop area {label} is empty.',
  dropAreaContainsA11y: 'Drop area {label} contains the following:',
  dropAreaChoiceA11y: 'answer choice {choice}',
  dropAreaEndA11y: 'End of answer choices in drop area.',
  dropAreaSingleFilledA11y: 'Drop area {label} contains answer choice {choice}.',
  availableA11y: {
    one: '{count} available answer choice.',
    other: '{count} available answer choices.',
  },
  availableChoiceA11y: 'Answer choice: {choice}',
  availableEndA11y: 'End of available answer choices.',
  tabToChoiceA11y: 'Use TAB to move to answer choice.',
  tabToChoicesA11y: 'Use TAB to move to an answer choice.',
  answerChoiceA11y: 'Answer choice: {choice}',
  answerChoiceInDropAreaA11y: 'Answer choice: {choice} in drop area {label}',
  selectedSingleAreaA11y: 'Selected answer choice {choice}. Use TAB to move to drop area.',
  selectedMultiAreasA11y: 'Selected answer choice {choice}. Use TAB to move to a drop area.',
  deselectedA11y: 'Answer choice {choice} is no longer selected. Use TAB to move to an answer choice.',
  overAreaSingleA11y:
    'Selected drop area {label}. Press ENTER to move selected answer choice {choice} here or ESC to cancel.',
  overAreaMultiA11y:
    'Selected drop area {label}. Press ENTER to move selected answer choice {choice} here or TAB to move to a different drop area.',
  overPoolFromAreaSingleA11y:
    'Press ENTER to remove selected answer choice {choice} from {label} drop area or ESC to cancel.',
  overPoolFromAreaMultiA11y:
    'Press ENTER to remove selected answer choice {choice} from {label} drop area or TAB to move to a drop area.',
  overPoolUnplacedSingleA11y:
    'Press ENTER to leave selected answer choice {choice} unplaced or TAB to move to drop area.',
  overPoolUnplacedMultiA11y:
    'Press ENTER to leave selected answer choice {choice} unplaced or TAB to move to a drop area.',
  notOverDropAreaA11y: '{choice} is not over a drop area.',
  placedA11y: 'Placed answer choice {choice} in {label} drop area.',
  replacedA11y: 'To make room for it, answer choice {removed} was removed.',
  movedA11y: 'Moved answer choice {choice} from {from} drop area to {to} drop area.',
  removedA11y: 'Removed answer choice {choice} from {label} drop area.',
} satisfies MessageCatalog;
