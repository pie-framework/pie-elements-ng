import type { DrawingResponseModel } from '../types.js';

export default {
  backgroundImageEnabled: true,
  imageDimensions: { height: 0, width: 0 },
  imageUrl: '',
  prompt: '',
  promptEnabled: true,
  spellCheckEnabled: true,
  studentInstructionsEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  toolbarEditorPosition: 'bottom',
} satisfies Omit<DrawingResponseModel, 'id' | 'element'>;
