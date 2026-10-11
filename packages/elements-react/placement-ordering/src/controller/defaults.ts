import type { Choice, CorrectResponse, PlacementOrderingModel } from '../types.js';

export default {
  choiceLabel: '',
  choiceLabelEnabled: true,
  choices: [] as Choice[],
  correctResponse: [] as CorrectResponse[],
  feedbackEnabled: false,
  numberedGuides: false,
  orientation: 'vertical',
  partialScoring: true,
  placementArea: false,
  prompt: '',
  promptEnabled: true,
  rationale: '',
  rationaleEnabled: true,
  removeTilesAfterPlacing: true,
  scoringType: 'auto',
  studentInstructionsEnabled: true,
  targetLabel: '',
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  toolbarEditorPosition: 'bottom',
} satisfies Omit<PlacementOrderingModel, 'id' | 'element'>;
