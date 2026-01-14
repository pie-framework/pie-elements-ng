/**
 * Default model for Multiple Choice
 */

import type { MultipleChoiceModel } from '../types';

export const defaults: Omit<MultipleChoiceModel, 'id' | 'element'> = {
  prompt: '',
  promptEnabled: true,
  choices: [
    {
      value: 'a',
      label: 'Choice A',
      correct: true,
    },
    {
      value: 'b',
      label: 'Choice B',
      correct: false,
    },
    {
      value: 'c',
      label: 'Choice C',
      correct: false,
    },
  ],
  choiceMode: 'radio',
  choicePrefix: 'letters',
  choicesLayout: 'vertical',
  lockChoiceOrder: false,
  partialScoring: false,
  feedbackEnabled: true,
  rationaleEnabled: true,
  rationale: '',
  teacherInstructions: '',
};
