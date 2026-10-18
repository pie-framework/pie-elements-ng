import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: 'Question à choix multiple',
  multipleCorrectAnswerQuestion: 'Question à plusieurs réponses correctes',
  multipleSelectQuestion: 'Question à choix multiples',
  minSelections: 'Sélectionnez au moins {minSelections}.',
  minmaxSelectionsEqual: 'Sélectionnez {minSelections}.',
  minmaxSelectionsRange: 'Sélectionnez entre {minSelections} et {maxSelections}.',
  maxSelections: {
    one: 'Seulement {count} réponse est autorisée.',
    other: 'Seulement {count} réponses sont autorisées.',
  },
  showTeacherInstructions: "Afficher les consignes de l'enseignant",
  hideTeacherInstructions: "Masquer les consignes de l'enseignant",
} satisfies MessageCatalog;
