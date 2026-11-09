import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warningTitle: 'Avertissement',
  resetWarning: "Cette action supprimera tous les éléments ajoutés au graphique et rétablira son état d'origine. Voulez-vous vraiment continuer ?",
  defineLinesFirst: "Tracez d'abord la ou les droites, puis sélectionnez l'ensemble des solutions de la question.",
  lineChangeWarning: "Modifier une droite après avoir ajouté un ensemble des solutions effacera l'ensemble des solutions sélectionné. Cliquez sur « Effacer l'ensemble des solutions » pour modifier la droite. Sinon, cliquez sur « Annuler ».",
  addLineAFirst: "Ajoutez la droite A au graphique avant d'ajouter la droite B",
  addLineBFirst: 'Ajoutez la droite B au graphique avant de revenir à la droite A',
  clearSolutionSet: "Effacer l'ensemble des solutions",
  confirm: 'OK',
  cancel: 'Annuler',
} satisfies MessageCatalog;
