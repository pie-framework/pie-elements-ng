/** The interface strings `@pie-element/match-list` renders; the source for every other locale. */
export default {
  /** Name of the answer-choice pool as a drop target. */
  choicesListA11y: 'Choices list',
  /** Name of an answer choice with no text, from its id. */
  answerA11y: 'Answer {id}',
  /** Name of a response area, from its prompt's text. */
  responseAreaForA11y: 'Response area for {prompt}',
  /** Name of a response area whose prompt has no text, from its id. */
  responseAreaA11y: 'Response area {id}',
  /** How to move an answer choice with the keyboard, read on focusing one. */
  dragInstructionsA11y:
    'Press Space or Enter to pick up this answer choice. Once picked up, use Tab or Shift+Tab to cycle through response areas, or use arrow keys to move it freely. Press Space or Enter to drop, or Escape to cancel. You can also click an answer choice to select it, then click a response area to place it there.',
  /** Announcements while an answer choice is moved; `{choice}` names it, `{target}` the drop target. */
  pickedUpA11y: 'Picked up {choice}. Use Tab to move between response areas, then press Space or Enter to drop.',
  notOverResponseAreaA11y: '{choice} is not over a response area.',
  overFilledA11y: 'Over {target}. Currently contains {choice}.',
  overEmptyA11y: 'Over {target}. Currently empty.',
  returnedA11y: '{choice} was returned to its original position.',
  droppedA11y: 'Dropped {choice} in {target}.',
  cancelledA11y: 'Cancelled. {choice} was returned to its original position.',
};
