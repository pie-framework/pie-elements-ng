import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  graph: 'Grafic în planul de coordonate',
  axisRange: 'Axa {axis} de la {min} la {max}.',
  plottedNone: 'Niciun obiect reprezentat.',
  plotted: {
    one: '{count} obiect reprezentat: {marks}.',
    few: '{count} obiecte reprezentate: {marks}.',
    other: '{count} de obiecte reprezentate: {marks}.',
  },
  line: 'Dreaptă',
  shadedRegion: 'Regiune hașurată',
  label: 'Etichetă',
  markLabel: 'Etichetă la ({x}, {y})',
  reset: 'Resetează',
  lineA: 'Dreapta A',
  lineB: 'Dreapta B',
  solutionSet: 'Mulțimea soluțiilor',
  solid: 'Continuă',
  dashed: 'Întreruptă',
  lineStyleCorrect: 'Stilul dreptei corect: {style}',
  lineStyleIncorrect: 'Stilul dreptei greșit: trasată {drawn}, așteptată {expected}',
  regionVerdict: {
    correct: 'Regiune hașurată corectă',
    incorrect: 'Regiune hașurată greșită',
    missing: 'Regiune hașurată din barem, nehașurată',
  },
  key: 'Legendă',
  keyLegend: {
    studentCorrect: 'Răspuns corect al elevului',
    studentIncorrect: 'Răspuns greșit al elevului',
    answerKeyCorrect: 'Corect conform baremului',
    lineStyleCorrect: 'Stilul dreptei corect',
    lineStyleIncorrect: 'Stilul dreptei greșit',
  },
} satisfies MessageCatalog;
