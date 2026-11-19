import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  addElementLimit: {
    one: 'Er kan maar {count} element worden toegevoegd',
    other: 'Er kunnen maar {count} elementen worden toegevoegd',
  },
  undo: 'Ongedaan maken',
  clearAll: 'Alles wissen',
  graphLabel: 'Getallenlijn van {min} tot {max}, met een streepje elke {interval}',
  closedEnd: 'gesloten',
  openEnd: 'open',
  elementCorrect: 'Goed.',
  elementIncorrect: 'Fout.',
  line: 'Lijnstuk van {left} ({leftEnd}) tot {right} ({rightEnd}).',
  plottedNone: 'Er is niets uitgezet.',
  pointClosed: 'Gesloten punt bij {position}.',
  pointOpen: 'Open punt bij {position}.',
  rayLeft: 'Halve lijn vanaf {position} ({end}) naar links.',
  rayRight: 'Halve lijn vanaf {position} ({end}) naar rechts.',
} satisfies MessageCatalog;
