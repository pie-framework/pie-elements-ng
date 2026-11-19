import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  addElementLimit: {
    zero: 'Ni ellir ychwanegu mwy na {count} o elfennau',
    one: 'Ni ellir ychwanegu mwy na {count} elfen',
    two: 'Ni ellir ychwanegu mwy na {count} elfen',
    few: 'Ni ellir ychwanegu mwy na {count} elfen',
    many: 'Ni ellir ychwanegu mwy na {count} elfen',
    other: 'Ni ellir ychwanegu mwy na {count} o elfennau',
  },
  undo: 'Dadwneud',
  clearAll: 'Clirio popeth',
  graphLabel: 'Llinell rif o {min} i {max}, gyda marc bob {interval}',
  closedEnd: 'caeedig',
  openEnd: 'agored',
  elementCorrect: 'Cywir.',
  elementIncorrect: 'Anghywir.',
  line: 'Llinell o {left} ({leftEnd}) i {right} ({rightEnd}).',
  plottedNone: "Does dim wedi'i blotio.",
  pointClosed: 'Pwynt caeedig ar {position}.',
  pointOpen: 'Pwynt agored ar {position}.',
  rayLeft: "Pelydr o {position} ({end}) tua'r chwith.",
  rayRight: "Pelydr o {position} ({end}) tua'r dde.",
} satisfies MessageCatalog;
