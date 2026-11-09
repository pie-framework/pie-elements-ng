import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoices: 'Dewisiadau ateb',
  blankLabel: 'bwlch',
  emptyBlank: '(gwag)',
  blankPreSelectionHint: 'Bydd yr ateb a ddewiswch yn ymddangos ar y llinell wag uchod.',
  correctAnswerSelected: "Ateb cywir wedi'i ddewis",
  incorrectAnswerSelected: "Ateb anghywir wedi'i ddewis",
  selectedAnswerImage: 'Delwedd yr ateb a ddewiswyd',
  choiceImage: 'Dewis {id}',
  clickToEnableAutoplay: 'Cliciwch i alluogi chwarae sain yn awtomatig',
  audioResourceUnavailable:
    "Mae sain wedi'i galluogi, ond does dim URL sain y gellir ei chwarae wedi'i ffurfweddu.",
  listen: 'Gwrando',
  listenSilentAlt: 'Ailadrodd y cyfarwyddiadau',
  listenPlayingAlt: "Mae'r cyfarwyddiadau'n chwarae",
  printAudio: 'Sain:',
  printTranscript: 'Trawsgrifiad:',
  showCorrectAnswer: 'Dangos yr ateb cywir',
  hideCorrectAnswer: "Cuddio'r ateb cywir",
  showTeacherInstructions: "Dangos cyfarwyddiadau'r athro",
  hideTeacherInstructions: "Cuddio cyfarwyddiadau'r athro",
} satisfies MessageCatalog;
