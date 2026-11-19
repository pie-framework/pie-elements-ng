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
} satisfies MessageCatalog;
