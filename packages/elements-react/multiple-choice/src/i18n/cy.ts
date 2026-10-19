import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: 'Cwestiwn dewis aml',
  multipleCorrectAnswerQuestion: 'Cwestiwn gyda sawl ateb cywir',
  multipleSelectQuestion: 'Cwestiwn aml-ddewis',
  minSelections: 'Dewiswch o leiaf {minSelections}.',
  minmaxSelectionsEqual: 'Dewiswch {minSelections}.',
  minmaxSelectionsRange: 'Dewiswch rhwng {minSelections} a {maxSelections}.',
  maxSelections: {
    zero: "Dim ond {count} o atebion sy'n cael eu caniatáu.",
    one: "Dim ond {count} ateb sy'n cael ei ganiatáu.",
    two: "Dim ond {count} ateb sy'n cael eu caniatáu.",
    few: "Dim ond {count} ateb sy'n cael eu caniatáu.",
    many: "Dim ond {count} o atebion sy'n cael eu caniatáu.",
    other: "Dim ond {count} o atebion sy'n cael eu caniatáu.",
  },
  showTeacherInstructions: "Dangos cyfarwyddiadau'r athro",
  hideTeacherInstructions: "Cuddio cyfarwyddiadau'r athro",
} satisfies MessageCatalog;
