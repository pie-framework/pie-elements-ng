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
  lineStyleCorrect: 'Rätt linjetyp: {style}',
  lineStyleIncorrect: 'Fel linjetyp: ritad {drawn}, förväntad {expected}',
  regionVerdict: {
    correct: 'Rätt skuggat område',
    incorrect: 'Fel skuggat område',
    missing: 'Skuggat område enligt facit, inte skuggat',
  },
  key: 'Teckenförklaring',
  keyLegend: {
    studentCorrect: 'Elevens rätta svar',
    studentIncorrect: 'Elevens felaktiga svar',
    answerKeyCorrect: 'Rätt enligt facit',
    lineStyleCorrect: 'Rätt linjetyp',
    lineStyleIncorrect: 'Fel linjetyp',
  },
} satisfies MessageCatalog;
