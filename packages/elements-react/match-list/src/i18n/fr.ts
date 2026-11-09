import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  choicesListA11y: 'Liste des choix',
  answerA11y: 'Réponse {id}',
  responseAreaForA11y: 'Zone de réponse pour {prompt}',
  responseAreaA11y: 'Zone de réponse {id}',
  dragInstructionsA11y: "Appuyez sur Espace ou Entrée pour saisir ce choix de réponse. Une fois le choix saisi, utilisez Tab ou Maj+Tab pour parcourir les zones de réponse, ou les touches fléchées pour le déplacer librement. Appuyez sur Espace ou Entrée pour le déposer, ou sur Échap pour annuler. Vous pouvez aussi cliquer sur un choix de réponse pour le sélectionner, puis cliquer sur une zone de réponse pour l'y placer.",
  pickedUpA11y: "{choice} a été saisi. Utilisez Tab pour passer d'une zone de réponse à l'autre, puis appuyez sur Espace ou Entrée pour le déposer.",
  notOverResponseAreaA11y: "{choice} n'est pas au-dessus d'une zone de réponse.",
  overFilledA11y: 'Au-dessus de {target}. Contient actuellement {choice}.',
  overEmptyA11y: 'Au-dessus de {target}. Actuellement vide.',
  returnedA11y: "{choice} a été remis à sa position d'origine.",
  droppedA11y: '{choice} a été déposé dans {target}.',
  cancelledA11y: "Annulé. {choice} a été remis à sa position d'origine.",
} satisfies MessageCatalog;
