import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  showRubric: 'Dangos y rwbrig',
  hideRubric: "Cuddio'r rwbrig",
  halfScoringNote: '* Caniateir hanner marciau neu sgoriau rhyngddynt o dan y rwbrig hwn.',
  tooLargeForPrint: "Mae'r cwestiwn yn rhy fawr i ffitio yn y modd argraffu.",
  standardsHeader: 'Safon(au)',
  descriptionHeader: 'Disgrifiad',
  scorePoints: {
    zero: '{count} o bwyntiau',
    one: '{count} pwynt',
    two: '{count} bwynt',
    few: '{count} phwynt',
    many: '{count} phwynt',
    other: '{count} o bwyntiau',
  },
  noDescription: 'Dim disgrifiad',
} satisfies MessageCatalog;
