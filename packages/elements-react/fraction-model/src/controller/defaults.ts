import type { FractionModelModel, FractionModelResponse } from '../types.js';

// Should be exactly the same as configure/defaults.js
export default {
  model: {
    correctResponse: [] as FractionModelResponse[],
    title: '',
    prompt: '',
    modelTypeSelected: 'bar',
    maxModelSelected: 1,
    partsPerModel: 5,
    allowedStudentConfig: false,
    showGraphLabels: false,
  },
} satisfies { model: Omit<FractionModelModel, 'id' | 'element'> };
