import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  addElementLimit: {
    one: 'You can only add {count} element',
    other: 'You can only add {count} elements',
  },
  undo: 'Undo',
  clearAll: 'Clear all',
  graphLabel: 'Number line from {min} to {max}, with a tick every {interval}',
  closedEnd: 'closed',
  openEnd: 'open',
  elementCorrect: 'Correct.',
  elementIncorrect: 'Incorrect.',
  line: 'Line from {left} ({leftEnd}) to {right} ({rightEnd}).',
  plottedNone: 'Nothing is plotted.',
  pointClosed: 'Closed point at {position}.',
  pointOpen: 'Open point at {position}.',
  rayLeft: 'Ray from {position} ({end}) to the left.',
  rayRight: 'Ray from {position} ({end}) to the right.',
} satisfies MessageCatalog;
