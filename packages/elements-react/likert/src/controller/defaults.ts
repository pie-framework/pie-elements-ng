import type { LikertChoice, LikertModel } from '../types.js';

export default {
  choices: [] as LikertChoice[],
  likertOrientation: 'horizontal',
  likertScale: 'likert3',
  likertType: 'agreement',
  prompt: '',
  promptEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
} satisfies Omit<LikertModel, 'id' | 'element'>;
