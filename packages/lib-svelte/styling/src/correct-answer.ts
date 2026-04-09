import { color } from './color.js';

export type CorrectAnswerTokens = {
  toggleLabelColor: string;
  toggleIconOpenBg: string;
  toggleIconClosedBg: string;
  toggleIconGlyphColor: string;
  choiceHoverBg: string;
  choiceSelectedBg: string;
  choiceCorrectBg: string;
  choiceIncorrectBg: string;
  choiceCorrectBorder: string;
  choiceIncorrectBorder: string;
  feedbackCorrectBg: string;
  feedbackIncorrectBg: string;
  feedbackGlyphColor: string;
};

export const correctAnswerTokens = (): CorrectAnswerTokens => ({
  toggleLabelColor: color.text(),
  toggleIconOpenBg: color.tertiaryLight(),
  toggleIconClosedBg: color.backgroundDark(),
  toggleIconGlyphColor: color.tertiary(),
  choiceHoverBg: color.backgroundDark(),
  choiceSelectedBg: color.secondaryBackground(),
  choiceCorrectBg: color.correctSecondary(),
  choiceIncorrectBg: color.incorrectSecondary(),
  choiceCorrectBorder: color.correctTertiary(),
  choiceIncorrectBorder: color.incorrectWithIcon(),
  feedbackCorrectBg: color.correctWithIcon(),
  feedbackIncorrectBg: color.incorrectWithIcon(),
  feedbackGlyphColor: color.white(),
});

export const correctAnswerTokensToCssVars = (tokens = correctAnswerTokens()): string =>
  [
    `--pie-correct-answer-toggle-label-color:${tokens.toggleLabelColor}`,
    `--pie-correct-answer-toggle-icon-open-bg:${tokens.toggleIconOpenBg}`,
    `--pie-correct-answer-toggle-icon-closed-bg:${tokens.toggleIconClosedBg}`,
    `--pie-correct-answer-toggle-icon-glyph-color:${tokens.toggleIconGlyphColor}`,
    `--pie-correct-answer-choice-hover-bg:${tokens.choiceHoverBg}`,
    `--pie-correct-answer-choice-selected-bg:${tokens.choiceSelectedBg}`,
    `--pie-correct-answer-choice-correct-bg:${tokens.choiceCorrectBg}`,
    `--pie-correct-answer-choice-incorrect-bg:${tokens.choiceIncorrectBg}`,
    `--pie-correct-answer-choice-correct-border:${tokens.choiceCorrectBorder}`,
    `--pie-correct-answer-choice-incorrect-border:${tokens.choiceIncorrectBorder}`,
    `--pie-correct-answer-feedback-correct-bg:${tokens.feedbackCorrectBg}`,
    `--pie-correct-answer-feedback-incorrect-bg:${tokens.feedbackIncorrectBg}`,
    `--pie-correct-answer-feedback-glyph-color:${tokens.feedbackGlyphColor}`,
  ].join(';');
