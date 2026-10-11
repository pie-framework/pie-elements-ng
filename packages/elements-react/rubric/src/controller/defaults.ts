import type { RubricModel } from '../types.js';

export default {
  points: ['', '', '', ''],
  sampleAnswers: [null, null, null, null],
  maxPoints: 3,
  maxPointsEnabled: true,
  excludeZero: false,
  excludeZeroEnabled: true,
} satisfies Omit<RubricModel, 'id' | 'element'>;
