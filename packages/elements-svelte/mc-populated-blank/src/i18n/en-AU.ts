import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoices: 'Answer choices',
  blankLabel: 'blank',
  emptyBlank: '(blank)',
  blankPreSelectionHint: 'The answer you choose will appear on the blank line above.',
  correctAnswerSelected: 'Correct answer selected',
  incorrectAnswerSelected: 'Incorrect answer selected',
  selectedAnswerImage: 'Selected answer image',
  choiceImage: 'Choice {id}',
  clickToEnableAutoplay: 'Click to enable audio autoplay',
  audioResourceUnavailable: 'Audio is enabled but no playable audio URL is configured.',
  listen: 'Listen',
  listenSilentAlt: 'Repeat instructions',
  listenPlayingAlt: 'Instructions are playing',
  printAudio: 'Audio:',
  printTranscript: 'Transcript:',
  showCorrectAnswer: 'Show correct answer',
  hideCorrectAnswer: 'Hide correct answer',
  showTeacherInstructions: 'Show Teacher Instructions',
  hideTeacherInstructions: 'Hide Teacher Instructions',
} satisfies MessageCatalog;
