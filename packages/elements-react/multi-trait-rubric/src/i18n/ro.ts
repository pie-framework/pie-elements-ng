import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  showRubric: 'Afișează grila de evaluare',
  hideRubric: 'Ascunde grila de evaluare',
  halfScoringNote: '* Această grilă de evaluare permite punctaje de jumătate de punct sau intermediare.',
  tooLargeForPrint: 'Itemul este prea mare pentru a încăpea în modul de imprimare.',
  standardsHeader: 'Standard(e)',
  descriptionHeader: 'Descriere',
  scorePoints: {
    one: '{count} punct',
    few: '{count} puncte',
    other: '{count} de puncte',
  },
  noDescription: 'Fără descriere',
} satisfies MessageCatalog;
