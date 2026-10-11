import type { MatchModel, MatchRow } from '../types.js';

export default {
  choiceMode: 'radio',
  feedbackEnabled: false,
  headers: ['Column 1', 'Column 2', 'Column 3'],
  layout: 3,
  lockChoiceOrder: true,
  partialScoring: false,
  prompt: '',
  promptEnabled: true,
  rationale: '',
  rationaleEnabled: true,
  rows: [] as MatchRow[],
  scoringType: 'auto',
  studentInstructionsEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  toolbarEditorPosition: 'bottom',
} satisfies Omit<MatchModel, 'id' | 'element'>;
