import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  addElementLimit: {
    one: 'Det går bara att lägga till {count} element',
    other: 'Det går bara att lägga till {count} element',
  },
  undo: 'Ångra',
  clearAll: 'Rensa allt',
  graphLabel: 'Tallinje från {min} till {max}, med en markering var {interval}',
  closedEnd: 'sluten',
  openEnd: 'öppen',
  elementCorrect: 'Rätt.',
  elementIncorrect: 'Fel.',
  line: 'Sträcka från {left} ({leftEnd}) till {right} ({rightEnd}).',
  plottedNone: 'Inget är markerat.',
  pointClosed: 'Sluten punkt vid {position}.',
  pointOpen: 'Öppen punkt vid {position}.',
  rayLeft: 'Stråle från {position} ({end}) åt vänster.',
  rayRight: 'Stråle från {position} ({end}) åt höger.',
} satisfies MessageCatalog;
