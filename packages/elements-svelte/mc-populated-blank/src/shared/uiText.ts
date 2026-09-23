import type { McpbUiText } from './types';

/**
 * Default learner-facing strings. The controller merges an item's `uiText` over
 * these and delivery merges them again for a model that skipped the controller,
 * so both read this one set. `selectedAnswerInSentence` is the blank's
 * accessible name, "blank" as the Learnosity original announces it.
 */
export const DEFAULT_UI_TEXT: Required<McpbUiText> = {
  answerChoices: 'Answer choices',
  selectedAnswerInSentence: 'blank',
  blankPreSelectionHint: 'The answer you choose will appear on the blank line above.',
  showCorrectAnswer: 'Show correct answer',
  hideCorrectAnswer: 'Hide correct answer',
  clickToEnableAutoplay: 'Click to enable audio autoplay',
  audioResourceUnavailable: 'Audio is enabled but no playable audio URL is configured.',
  transcriptLabel: 'Transcript',
  listenLabelEn: 'Listen',
  listenLabelEs: 'Escuchar',
  listenSilentAlt: 'Repeat instructions',
  listenPlayingAlt: 'Instructions are playing',
  listenSilentAltEs: 'Escuchar. Repetir las instrucciones.',
  listenPlayingAltEs: 'Escuchar. Estas son las instrucciones.',
};
