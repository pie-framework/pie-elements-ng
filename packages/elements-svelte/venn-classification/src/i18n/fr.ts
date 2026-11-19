import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  tray: 'Tuiles à classer',
  unknownTarget: 'inconnu',
  cancelled: 'Annulation',
  returnedToTray: 'Retour de {name} dans le bac',
  placedIn: 'Placement de {name} dans {target}',
  pickedUp: 'Saisie de {name}',
  pickedUpWithKeyboard:
    'Saisie de {name}, cible : {target}. Utiliser les flèches pour choisir une cible, Entrée pour déposer, Échap pour annuler.',
  dropTarget: 'Cible : {target}',
  unsupportedCircles: {
    one: "Impossible d'afficher ce diagramme : il comporte {count} cercle, et seuls {supported} sont pris en charge.",
    many: "Impossible d'afficher ce diagramme : il comporte {count} cercles, et seuls {supported} sont pris en charge.",
    other:
      "Impossible d'afficher ce diagramme : il comporte {count} cercles, et seuls {supported} sont pris en charge.",
  },
  setNumber: 'Ensemble {number}',
  regionOnly: 'Uniquement {set}',
  regionNeither: 'Ni {first} ni {second}',
  regionNoneOf: 'Aucun parmi {sets}',
  regionAndSeparator: ' et ',
  listSeparator: ', ',
  tileFallbackName: 'Tuile',
  tileNotPlaced: 'non placée',
  tileInRegion: 'dans {region}',
  tileCorrect: 'correcte',
  tileIncorrect: 'incorrecte',
  showCorrectAnswer: 'Afficher la réponse correcte',
  hideCorrectAnswer: 'Masquer la réponse correcte',
  showTeacherInstructions: "Afficher les consignes de l'enseignant",
  hideTeacherInstructions: "Masquer les consignes de l'enseignant",
} satisfies MessageCatalog;
