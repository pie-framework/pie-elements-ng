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
} satisfies MessageCatalog;
