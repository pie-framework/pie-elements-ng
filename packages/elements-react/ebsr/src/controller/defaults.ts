import type { Choice } from '@pie-element/multiple-choice';
import type { EbsrModel, EbsrPart } from '../types.js';

const partModel = (base?: Partial<EbsrPart>): EbsrPart => ({
  choiceMode: 'radio',
  choicePrefix: 'letters',
  choices: [] as Choice[],
  choicesLayout: 'vertical',
  feedbackEnabled: false,
  gridColumns: 2,
  prompt: '',
  promptEnabled: true,
  rationale: '',
  rationaleEnabled: true,
  spellCheckEnabled: true,
  studentInstructionsEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  toolbarEditorPosition: 'bottom',
  ...base,
});

export default {
  partLabels: true,
  partLabelType: 'Letters',
  partA: partModel(),
  partB: partModel(),
} satisfies Omit<EbsrModel, 'id' | 'element'>;
