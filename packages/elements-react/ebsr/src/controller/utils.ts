import { isEqual } from '@pie-element/shared-lodash';
import type { Choice } from '@pie-element/multiple-choice';
import type { EbsrPart, EbsrSession } from '../types.js';

export const getCorrectResponse = (choices: Choice[]) =>
  choices &&
  choices
    .filter((c) => c.correct)
    .map((c) => c.value)
    .sort();

export const isResponseCorrect = (question: EbsrPart, key: 'partA' | 'partB', session: EbsrSession | undefined) => {
  let correctResponse = getCorrectResponse(question.choices);

  if (session && session.value) {
    return isEqual((session.value[key]!.value || []).sort(), correctResponse);
  }

  return false;
};
