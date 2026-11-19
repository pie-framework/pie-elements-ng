import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  graph: 'Koordinatsystem',
  axisRange: '{axis}-axeln från {min} till {max}.',
  plottedNone: 'Inget ritat.',
  plotted: {
    one: '{count} objekt ritat: {marks}.',
    other: '{count} objekt ritade: {marks}.',
  },
  line: 'Linje',
  shadedRegion: 'Skuggat område',
  label: 'Etikett',
  markLabel: 'Etikett vid ({x}; {y})',
  reset: 'Återställ',
  lineA: 'Linje A',
  lineB: 'Linje B',
  solutionSet: 'Lösningsmängd',
  solid: 'Heldragen',
  dashed: 'Streckad',
} satisfies MessageCatalog;
