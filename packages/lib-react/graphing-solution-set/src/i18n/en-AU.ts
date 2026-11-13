import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  graph: 'Coordinate graph',
  axisRange: '{axis} axis from {min} to {max}.',
  plottedNone: 'Nothing plotted.',
  plotted: {
    one: '{count} object plotted: {marks}.',
    other: '{count} objects plotted: {marks}.',
  },
  line: 'Line',
  shadedRegion: 'Shaded region',
  label: 'Label',
  markLabel: 'Label at ({x}, {y})',
  reset: 'Reset',
  lineA: 'Line A',
  lineB: 'Line B',
  solutionSet: 'Solution Set',
  solid: 'Solid',
  dashed: 'Dashed',
  lineStyleCorrect: 'Line style correct: {style}',
  lineStyleIncorrect: 'Line style incorrect: drawn {drawn}, expected {expected}',
  regionVerdict: {
    correct: 'Shaded region correct',
    incorrect: 'Shaded region incorrect',
    missing: 'Shaded region in the answer key, not shaded',
  },
  key: 'Key',
  keyLegend: {
    studentCorrect: 'Student Correct',
    studentIncorrect: 'Student Incorrect',
    answerKeyCorrect: 'Answer Key Correct',
    lineStyleCorrect: 'Line Style Correct',
    lineStyleIncorrect: 'Line Style Incorrect',
  },
} satisfies MessageCatalog;
