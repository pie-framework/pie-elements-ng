import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  graph: 'Graff cyfesurynnau',
  axisRange: 'Echelin {axis} o {min} i {max}.',
  plottedNone: "Dim wedi'i blotio.",
  plotted: {
    zero: "{count} o wrthrychau wedi'u plotio: {marks}.",
    one: "{count} gwrthrych wedi'i blotio: {marks}.",
    two: "{count} wrthrych wedi'u plotio: {marks}.",
    few: "{count} gwrthrych wedi'u plotio: {marks}.",
    many: "{count} gwrthrych wedi'u plotio: {marks}.",
    other: "{count} o wrthrychau wedi'u plotio: {marks}.",
  },
  line: 'Llinell',
  shadedRegion: "Ardal wedi'i lliwio",
  label: 'Label',
  markLabel: 'Label yn ({x}, {y})',
  reset: 'Ailosod',
  lineA: 'Llinell A',
  lineB: 'Llinell B',
  solutionSet: 'Set datrysiadau',
  solid: 'Di-dor',
  dashed: 'Toredig',
} satisfies MessageCatalog;
