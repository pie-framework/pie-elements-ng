import type { MultiTraitRubricModel, Scale } from '../types.js';

export default {
  addScaleEnabled: true,
  description: false,
  excludeZero: false,
  halfScoring: false,
  maxPointsEnabled: true,
  pointLabels: true,
  scales: [] as Scale[],
  standards: false,
  visibleToStudent: true,
} satisfies Omit<MultiTraitRubricModel, 'id' | 'element'>;
