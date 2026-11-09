import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  showRubric: 'Show Rubric',
  hideRubric: 'Hide Rubric',
  halfScoringNote: '* Half-point or in-between scores are permitted under this rubric.',
  tooLargeForPrint: 'The item is too large to fit in print mode.',
  standardsHeader: 'Standard(s)',
  descriptionHeader: 'Description',
  scorePoints: {
    one: '{count} point',
    other: '{count} points',
  },
  noDescription: 'No Description',
} satisfies MessageCatalog;
