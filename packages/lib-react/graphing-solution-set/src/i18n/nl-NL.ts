import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  graph: 'Grafiek in een assenstelsel',
  axisRange: '{axis}-as van {min} tot {max}.',
  plottedNone: 'Niets getekend.',
  plotted: {
    one: '{count} object getekend: {marks}.',
    other: '{count} objecten getekend: {marks}.',
  },
  line: 'Lijn',
  shadedRegion: 'Gearceerd gebied',
  label: 'Label',
  markLabel: 'Label bij ({x}, {y})',
  reset: 'Opnieuw instellen',
  lineA: 'Lijn A',
  lineB: 'Lijn B',
  solutionSet: 'Oplossingsverzameling',
  solid: 'Doorgetrokken',
  dashed: 'Gestreept',
  lineStyleCorrect: 'Lijnstijl juist: {style}',
  lineStyleIncorrect: 'Lijnstijl onjuist: getekend {drawn}, verwacht {expected}',
  regionVerdict: {
    correct: 'Gearceerd gebied juist',
    incorrect: 'Gearceerd gebied onjuist',
    missing: 'Gearceerd gebied volgens de antwoordsleutel, niet gearceerd',
  },
  key: 'Legenda',
  keyLegend: {
    studentCorrect: 'Juist antwoord van de leerling',
    studentIncorrect: 'Onjuist antwoord van de leerling',
    answerKeyCorrect: 'Juist volgens de antwoordsleutel',
    lineStyleCorrect: 'Lijnstijl juist',
    lineStyleIncorrect: 'Lijnstijl onjuist',
  },
} satisfies MessageCatalog;
