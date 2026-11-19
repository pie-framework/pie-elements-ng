import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  showRubric: 'Visa bedömningsmatrisen',
  hideRubric: 'Dölj bedömningsmatrisen',
  halfScoringNote: '* Halvpoäng eller mellanliggande poäng är tillåtna enligt den här bedömningsmatrisen.',
  tooLargeForPrint: 'Uppgiften är för stor för att få plats i utskriftsläget.',
  standardsHeader: 'Standard(er)',
  descriptionHeader: 'Beskrivning',
  scorePoints: {
    one: '{count} poäng',
    other: '{count} poäng',
  },
  noDescription: 'Ingen beskrivning',
} satisfies MessageCatalog;
