import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoices: 'Choix de réponses',
  blankLabel: 'espace vide',
  emptyBlank: '(vide)',
  blankPreSelectionHint: 'La réponse choisie apparaîtra sur la ligne vide ci-dessus.',
  correctAnswerSelected: 'Réponse correcte sélectionnée',
  incorrectAnswerSelected: 'Réponse incorrecte sélectionnée',
  selectedAnswerImage: 'Image de la réponse sélectionnée',
  choiceImage: 'Choix {id}',
  clickToEnableAutoplay: "Cliquer pour activer la lecture automatique de l'audio",
  audioResourceUnavailable: "L'audio est activé, mais aucune URL audio lisible n'est configurée.",
  listen: 'Écouter',
  listenSilentAlt: 'Réécouter les consignes',
  listenPlayingAlt: 'Consignes en cours de lecture',
  printAudio: 'Audio :',
  printTranscript: 'Transcription :',
  showCorrectAnswer: 'Afficher la réponse correcte',
  hideCorrectAnswer: 'Masquer la réponse correcte',
  showTeacherInstructions: "Afficher les consignes de l'enseignant",
  hideTeacherInstructions: "Masquer les consignes de l'enseignant",
} satisfies MessageCatalog;
