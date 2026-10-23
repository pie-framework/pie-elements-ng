import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: '選択式問題',
  multipleCorrectAnswerQuestion: '複数正解問題',
  multipleSelectQuestion: '複数選択問題',
  minSelections: '{minSelections}個以上選択してください。',
  minmaxSelectionsEqual: '{minSelections}個選択してください。',
  minmaxSelectionsRange: '{minSelections}個以上{maxSelections}個以下で選択してください。',
  maxSelections: {
    other: '選択できるのは{count}個までです。',
  },
  showTeacherInstructions: '教師用指示を表示',
  hideTeacherInstructions: '教師用指示を非表示',
  answerChoicesA11y: '解答の選択肢',
  partAnswerChoicesA11y: '{partLabel}、解答の選択肢',
  pickTheAnswerBelowA11y: '下の答えを選択してください',
} satisfies MessageCatalog;
