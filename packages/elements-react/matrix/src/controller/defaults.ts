import type { MatrixModel } from '../types.js';

export default {
  columnLabels: ['COLUMN 1', 'COLUMN 2', 'COLUMN 3'],
  labelType: 'agreement',
  matrixValues: {} as Record<string, number>,
  prompt: '',
  promptEnabled: true,
  rowLabels: ['STATEMENT 1', 'STATEMENT 2'],
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
} satisfies Omit<MatrixModel, 'id' | 'element'>;
