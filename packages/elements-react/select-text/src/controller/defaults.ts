import type { SelectTextModel, TextToken } from '../types.js';

export default {
  feedbackEnabled: false,
  highlightChoices: false,
  maxSelections: 0,
  mode: 'sentence',
  partialScoring: false,
  prompt: '',
  promptEnabled: true,
  rationale: '',
  rationaleEnabled: true,
  scoringType: 'auto',
  studentInstructionsEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  text: '',
  tokens: [] as TextToken[],
  toolbarEditorPosition: 'bottom',
} satisfies Omit<SelectTextModel, 'id' | 'element'>;
