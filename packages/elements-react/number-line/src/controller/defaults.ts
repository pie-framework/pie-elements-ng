import type { NumberLineModel, NumberLineResponse } from '../types.js';

export default {
  correctResponse: [] as NumberLineResponse[],
  feedback: {
    correct: { default: 'Correct', type: 'none' },
    incorrect: { default: 'Incorrect', type: 'none' },
    partial: { default: 'Nearly', type: 'none' },
  },
  graph: {
    arrows: { left: true, right: true },
    availableTypes: {
      PF: true,
    },
    domain: { min: -1, max: 1 },
    exhibitOnly: false,
    initialElements: [] as NumberLineResponse[],
    initialType: 'PF',
    maxNumberOfPoints: 1,
    ticks: { minor: 0.125, major: 0.5, tickIntervalType: 'Decimal' },
    title: '',
    width: 500,
  },
  prompt: '',
  promptEnabled: true,
  rationale: '',
  rationaleEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  toolbarEditorPosition: 'bottom',
  widthEnabled: true,
} satisfies Omit<NumberLineModel, 'id' | 'element'>;
