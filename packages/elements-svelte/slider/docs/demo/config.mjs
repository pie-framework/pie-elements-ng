export default {
  id: 'slider-default',
  element: '@pie-element/slider-svelte',
  prompt: "<p>What percentage of Earth's surface is covered by water?</p>",
  lowerBound: 0,
  upperBound: 100,
  step: 1,
  stepLabel: true,
  orientation: 'horizontal',
  reverse: false,
  correctResponse: 71,
  rationale:
    "<p>Approximately 71% of Earth's surface is covered by water, with oceans holding about 96.5% of all Earth's water.</p>",
  partialScoring: true,
  scoringTolerance: 10,
  promptEnabled: true,
  rationaleEnabled: true,
};
