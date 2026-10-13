import type { ImageClozeAssociationModel } from '../types.js';

export default {
  rationale: '',
  rationaleEnabled: true,
  studentInstructionsEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
} satisfies Omit<ImageClozeAssociationModel, 'id' | 'element'>;
