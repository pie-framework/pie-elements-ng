import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoices: 'Antwoordkeuzes',
  blankLabel: 'open plek',
  emptyBlank: '(leeg)',
  blankPreSelectionHint: 'Het antwoord dat je kiest, verschijnt op de lege regel hierboven.',
  correctAnswerSelected: 'Juist antwoord geselecteerd',
  incorrectAnswerSelected: 'Onjuist antwoord geselecteerd',
  selectedAnswerImage: 'Afbeelding van geselecteerd antwoord',
  choiceImage: 'Keuze {id}',
  clickToEnableAutoplay: 'Klik om automatisch afspelen van audio in te schakelen',
  audioResourceUnavailable:
    'Audio is ingeschakeld, maar er is geen afspeelbare audio-URL geconfigureerd.',
  listen: 'Luisteren',
  listenSilentAlt: 'Instructies herhalen',
  listenPlayingAlt: 'Instructies worden afgespeeld',
  printAudio: 'Audio:',
  printTranscript: 'Transcript:',
  showCorrectAnswer: 'Juist antwoord weergeven',
  hideCorrectAnswer: 'Juist antwoord verbergen',
  showTeacherInstructions: 'Instructies voor de leraar weergeven',
  hideTeacherInstructions: 'Instructies voor de leraar verbergen',
} satisfies MessageCatalog;
