import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: 'Flervalsfråga',
  multipleCorrectAnswerQuestion: 'Fråga med flera rätta svar',
  multipleSelectQuestion: 'Fråga med flera val',
  minSelections: 'Välj minst {minSelections}.',
  minmaxSelectionsEqual: 'Välj {minSelections}.',
  minmaxSelectionsRange: 'Välj mellan {minSelections} och {maxSelections}.',
  maxSelections: {
    one: 'Endast {count} svar är tillåtet.',
    other: 'Endast {count} svar är tillåtna.',
  },
  showTeacherInstructions: 'Visa lärarinstruktioner',
  hideTeacherInstructions: 'Dölj lärarinstruktioner',
} satisfies MessageCatalog;
