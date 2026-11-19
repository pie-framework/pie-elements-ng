import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  addElementLimit: {
    one: 'Vous ne pouvez ajouter que {count} élément',
    many: 'Vous ne pouvez ajouter que {count} éléments',
    other: 'Vous ne pouvez ajouter que {count} éléments',
  },
  undo: 'Annuler',
  clearAll: 'Tout effacer',
  graphLabel: 'Droite graduée de {min} à {max}, avec une graduation tous les {interval}',
  closedEnd: 'fermé',
  openEnd: 'ouvert',
  elementCorrect: 'Correct.',
  elementIncorrect: 'Incorrect.',
  line: 'Segment de {left} ({leftEnd}) à {right} ({rightEnd}).',
  plottedNone: "Rien n'est placé.",
  pointClosed: 'Point fermé en {position}.',
  pointOpen: 'Point ouvert en {position}.',
  rayLeft: 'Demi-droite partant de {position} ({end}) vers la gauche.',
  rayRight: 'Demi-droite partant de {position} ({end}) vers la droite.',
} satisfies MessageCatalog;
