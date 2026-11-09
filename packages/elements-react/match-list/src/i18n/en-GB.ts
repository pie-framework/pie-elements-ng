import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  choicesListA11y: 'Choices list',
  answerA11y: 'Answer {id}',
  responseAreaForA11y: 'Response area for {prompt}',
  responseAreaA11y: 'Response area {id}',
  dragInstructionsA11y: 'Press Space or Enter to pick up this answer choice. Once picked up, use Tab or Shift+Tab to cycle through response areas, or use arrow keys to move it freely. Press Space or Enter to drop, or Escape to cancel. You can also click an answer choice to select it, then click a response area to place it there.',
  pickedUpA11y: 'Picked up {choice}. Use Tab to move between response areas, then press Space or Enter to drop.',
  notOverResponseAreaA11y: '{choice} is not over a response area.',
  overFilledA11y: 'Over {target}. Currently contains {choice}.',
  overEmptyA11y: 'Over {target}. Currently empty.',
  returnedA11y: '{choice} was returned to its original position.',
  droppedA11y: 'Dropped {choice} in {target}.',
  cancelledA11y: 'Cancelled. {choice} was returned to its original position.',
} satisfies MessageCatalog;
