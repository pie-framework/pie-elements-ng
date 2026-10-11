import type { Choice, DragInTheBlankModel } from '../types.js';

export default {
  choices: [] as Choice[],
  choicesPosition: 'below',
  correctResponse: {},
  disabled: false,
  duplicates: true,
  markup: '',
  mode: 'gather',
  prompt: '',
  promptEnabled: true,
  rationale: '',
  rationaleEnabled: true,
  studentInstructionsEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  toolbarEditorPosition: 'bottom',
} satisfies Omit<DragInTheBlankModel, 'id' | 'element'>;
