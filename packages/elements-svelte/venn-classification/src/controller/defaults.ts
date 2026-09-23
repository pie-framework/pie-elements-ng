import type { VennModel } from '../types.js';

// No `id` or `element`: the item config supplies `id`, and the player registers
// the element under a versioned tag it stamps as `element`.
const model: VennModel = {
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
