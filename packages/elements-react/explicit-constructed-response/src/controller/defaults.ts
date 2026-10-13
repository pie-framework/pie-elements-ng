import type { Choices, ExplicitConstructedResponseModel } from '../types.js';

export default {
  choices: {} as Choices,
  displayType: 'block',
  markup: '',
  maxLengthPerChoiceEnabled: true,
  playerIdleSaveDelay: 1500,
  // Student-facing spellcheck is off unless the model opts in. See PIE-979.
  playerSpellCheckEnabled: false,
  prompt: '',
  promptEnabled: true,
  rationale: '',
  rationaleEnabled: true,
  spellCheckEnabled: true,
  studentInstructionsEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  toolbarEditorPosition: 'bottom',
} satisfies Omit<ExplicitConstructedResponseModel, 'id' | 'element'>;
