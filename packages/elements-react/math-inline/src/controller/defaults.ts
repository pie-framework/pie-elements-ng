import type { MathInlineModel, MathInlineResponse } from '../types.js';
import { ResponseTypes } from './utils.js';

export default {
  allowTrailingZerosDefault: false,
  customKeys: [] as string[],
  equationEditor: '8',
  expression: '',
  feedback: {
    correct: { default: 'Correct', type: 'none' },
    incorrect: { default: 'Incorrect', type: 'none' },
    partial: { default: 'Nearly', type: 'none' },
  },
  feedbackEnabled: false,
  ignoreOrderDefault: false,
  partialScoring: true,
  prompt: '',
  promptEnabled: true,
  rationale: '',
  rationaleEnabled: true,
  responseType: ResponseTypes.advanced,
  responses: [] as MathInlineResponse[],
  scoringType: 'auto',
  studentInstructionsEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  toolbarEditorPosition: 'bottom',
  validationDefault: 'literal',
} satisfies Omit<MathInlineModel, 'id' | 'element'>;
