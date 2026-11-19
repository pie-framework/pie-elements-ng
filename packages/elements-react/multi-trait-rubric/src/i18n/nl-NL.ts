import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  showRubric: 'Rubric weergeven',
  hideRubric: 'Rubric verbergen',
  halfScoringNote: '* Bij deze rubric zijn halve punten of tussenliggende scores toegestaan.',
  tooLargeForPrint: 'De vraag is te groot voor de afdrukweergave.',
  standardsHeader: 'Standaard(en)',
  descriptionHeader: 'Beschrijving',
  scorePoints: {
    one: '{count} punt',
    other: '{count} punten',
  },
  noDescription: 'Geen beschrijving',
} satisfies MessageCatalog;
