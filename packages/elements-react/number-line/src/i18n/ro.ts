import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  addElementLimit: {
    one: 'Poți adăuga doar {count} element',
    few: 'Poți adăuga doar {count} elemente',
    other: 'Poți adăuga doar {count} de elemente',
  },
  undo: 'Anulează',
  clearAll: 'Șterge tot',
  graphLabel: 'Axa numerelor de la {min} la {max}, cu o diviziune la fiecare {interval}',
  closedEnd: 'închis',
  openEnd: 'deschis',
  elementCorrect: 'Corect.',
  elementIncorrect: 'Greșit.',
  line: 'Segment de la {left} ({leftEnd}) la {right} ({rightEnd}).',
  plottedNone: 'Nu este reprezentat nimic.',
  pointClosed: 'Punct închis în {position}.',
  pointOpen: 'Punct deschis în {position}.',
  rayLeft: 'Semidreaptă de la {position} ({end}) spre stânga.',
  rayRight: 'Semidreaptă de la {position} ({end}) spre dreapta.',
} satisfies MessageCatalog;
