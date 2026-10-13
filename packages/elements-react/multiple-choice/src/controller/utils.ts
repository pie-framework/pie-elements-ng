import { isEqual } from '@pie-element/shared-lodash';
import type { Choice, MultipleChoiceModel, MultipleChoiceSession } from '../types.js';

export const getCorrectResponse = (choices: Choice[]) =>
  choices
    .filter((c) => c.correct)
    .map((c) => c.value)
    .sort();

export const isResponseCorrect = (question: MultipleChoiceModel, session: MultipleChoiceSession | undefined) => {
  let correctResponse = getCorrectResponse(question.choices);
  return session && isEqual((session.value || []).sort(), correctResponse);
};
