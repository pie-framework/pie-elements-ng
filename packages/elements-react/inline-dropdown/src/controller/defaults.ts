import type { InlineDropdownModel } from '../types.js';

export default {
  alternateResponse: {},
  choiceRationaleEnabled: true,
  choices: {},
  disabled: false,
  displayType: 'block',
  markup: '',
  mode: 'gather',
  prompt: '',
  promptEnabled: true,
  rationale: '',
  rationaleEnabled: true,
  shuffle: true,
  studentInstructionsEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  toolbarEditorPosition: 'bottom',
} satisfies Omit<InlineDropdownModel, 'id' | 'element'>;
