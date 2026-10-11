import type { MultipleChoiceConfiguration } from '../types.js';

export const generateValidationMessage = (config: MultipleChoiceConfiguration) => {
  const { minAnswerChoices, maxAnswerChoices } = config;

  const answerChoicesMessage =
    `\nThere should be at least ${minAnswerChoices} ` +
    (maxAnswerChoices ? `and at most ${maxAnswerChoices} ` : '') +
    'answer choices defined.' +
    '\nEvery answer choice should be non-blank and unique.';

  const correctAnswerMessage = '\nA correct answer must be defined.';

  const message = 'Validation requirements:' + answerChoicesMessage + correctAnswerMessage;

  return message;
};
