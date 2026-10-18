import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: 'Multiple Choice Question',
  multipleCorrectAnswerQuestion: 'Multiple Correct Answer Question',
  multipleSelectQuestion: 'Multiple Select Question',
  minSelections: 'Select at least {minSelections}.',
  minmaxSelectionsEqual: 'Select {minSelections}.',
  minmaxSelectionsRange: 'Select between {minSelections} and {maxSelections}.',
  maxSelections: {
    one: 'Only {count} answer is allowed.',
    other: 'Only {count} answers are allowed.',
  },
  showTeacherInstructions: 'Show Teacher Instructions',
  hideTeacherInstructions: 'Hide Teacher Instructions',
} satisfies MessageCatalog;
