import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  fillColor: 'Couleur de remplissage',
  outlineColor: 'Couleur du contour',
  colors: {
    noFill: 'Aucun remplissage',
    lightblue: 'Bleu clair',
    lightyellow: 'Jaune clair',
    red: 'Rouge',
    orange: 'Orange',
    yellow: 'Jaune',
    violet: 'Violet',
    blue: 'Bleu',
    green: 'Vert',
    white: 'Blanc',
    black: 'Noir',
  },
  onDoubleClick: 'Double-cliquer pour modifier ce texte. Appuyer sur Entrée pour valider.',
  drawingArea: 'Zone de dessin',
  drawingAreaOverImage: "Zone de dessin sur une image d'arrière-plan",
  tools: {
    select: 'Sélectionner',
    freeDraw: 'Dessin libre',
    line: 'Ligne',
    rectangle: 'Rectangle',
    circle: 'Cercle',
    textEntry: 'Saisie de texte',
    eraser: 'Gomme',
  },
  undo: 'Annuler',
  clearAll: 'Tout effacer',
  renderError: "Une erreur s'est produite : {message}",
} satisfies MessageCatalog;
