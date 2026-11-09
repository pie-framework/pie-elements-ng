import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoices: 'Svarsalternativ',
  blankLabel: 'lucka',
  emptyBlank: '(tom)',
  blankPreSelectionHint: 'Svaret du väljer visas på den tomma raden ovan.',
  correctAnswerSelected: 'Rätt svar valt',
  incorrectAnswerSelected: 'Fel svar valt',
  selectedAnswerImage: 'Bild för valt svar',
  choiceImage: 'Alternativ {id}',
  clickToEnableAutoplay: 'Klicka för att aktivera automatisk uppspelning av ljud',
  audioResourceUnavailable: 'Ljud är aktiverat, men ingen spelbar ljud-URL har konfigurerats.',
  listen: 'Lyssna',
  listenSilentAlt: 'Upprepa instruktionerna',
  listenPlayingAlt: 'Instruktionerna spelas upp',
  printAudio: 'Ljud:',
  printTranscript: 'Transkription:',
  showCorrectAnswer: 'Visa rätt svar',
  hideCorrectAnswer: 'Dölj rätt svar',
  showTeacherInstructions: 'Visa lärarinstruktioner',
  hideTeacherInstructions: 'Dölj lärarinstruktioner',
} satisfies MessageCatalog;
