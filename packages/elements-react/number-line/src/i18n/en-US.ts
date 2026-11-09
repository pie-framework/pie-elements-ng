/** The interface strings `@pie-element/number-line` renders; the source for every other locale. */
export default {
  /** Shown when the learner tries to plot more than the item allows. */
  addElementLimit: {
    one: 'You can only add {count} element',
    other: 'You can only add {count} elements',
  },
  /** Toolbar buttons. */
  undo: 'Undo',
  clearAll: 'Clear all',
  /** The number line's accessible name; values are formatted as the tick labels show them. */
  graphLabel: 'Number line from {min} to {max}, with a tick every {interval}',
  /** Endpoint states, slotted into `line`, `rayLeft` and `rayRight`. */
  closedEnd: 'closed',
  openEnd: 'open',
  /** Appended to a plotted element's description in evaluate mode. */
  elementCorrect: 'Correct.',
  elementIncorrect: 'Incorrect.',
  /** Descriptions of the plotted elements, read with the number line. */
  line: 'Line from {left} ({leftEnd}) to {right} ({rightEnd}).',
  plottedNone: 'Nothing is plotted.',
  pointClosed: 'Closed point at {position}.',
  pointOpen: 'Open point at {position}.',
  rayLeft: 'Ray from {position} ({end}) to the left.',
  rayRight: 'Ray from {position} ({end}) to the right.',
};
