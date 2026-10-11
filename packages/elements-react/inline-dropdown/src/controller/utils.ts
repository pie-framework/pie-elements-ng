import { forEach } from '@pie-element/shared-lodash';
import type { Choice, InlineDropdownModel } from '../types.js';

export const getAllCorrectResponses = ({
  choices,
  alternateResponse,
}: Partial<Pick<InlineDropdownModel, 'choices' | 'alternateResponse'>>) => {
  alternateResponse = alternateResponse || {};
  const correctAnswers: Record<string, string[]> = {};

  forEach<Choice[]>(choices, (respArea, key) => {
    if (!correctAnswers[key]) {
      correctAnswers[key] = [];
    }

    if (respArea) {
      respArea.forEach((choice) => {
        if (choice.correct) {
          correctAnswers[key].push(choice.value);

          if (alternateResponse[key]) {
            correctAnswers[key] = [...correctAnswers[key], ...alternateResponse[key]];
          }
        }
      });
    }
  });

  return correctAnswers;
};
