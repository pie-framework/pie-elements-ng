import type { VennModel } from '../types.js';

const model: VennModel = {
  id: '1',
  element: 'venn-classification',
  prompt: '<p>Sort each tile into the correct region of the Venn diagram.</p>',
  promptEnabled: true,
  circles: [{ label: 'Set A' }, { label: 'Set B' }],
  tiles: [],
  regionLabels: {},
  scoringPolicy: 'partialPerTile',
};

export default {
  model,
  configuration: {
    prompt: {
      label: 'Prompt',
      settings: true,
    },
    scoringPolicy: {
      label: 'Scoring policy',
      settings: true,
    },
  },
};
