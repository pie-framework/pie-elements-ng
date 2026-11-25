import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: '单选题',
  multipleCorrectAnswerQuestion: '多正确答案题',
  multipleSelectQuestion: '多选题',
  minSelections: '请至少选择{minSelections}项。',
  minmaxSelectionsEqual: '请选择{minSelections}项。',
  minmaxSelectionsRange: '请选择{minSelections}至{maxSelections}项。',
  maxSelections: {
    other: '最多只能选择{count}个答案。',
  },
  answerChoicesA11y: '答案选项',
  partAnswerChoicesA11y: '{partLabel}，答案选项',
  pickTheAnswerBelowA11y: '请选择下面的答案',
  choiceNameA11y: '选项 {key}',
} satisfies MessageCatalog;
