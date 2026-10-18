import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: '選択式問題',
  multipleCorrectAnswerQuestion: '複数正解問題',
  multipleSelectQuestion: '複数選択問題',
  minSelections: '{minSelections}個以上選択してください。',
  minmaxSelectionsEqual: '{minSelections}個選択してください。',
  minmaxSelectionsRange: '{minSelections}個以上{maxSelections}個以下で選択してください。',
  maxSelections: {
    other: '選択できるのは{count}件までです。',
  },
  showTeacherInstructions: '教師用指示を表示',
  hideTeacherInstructions: '教師用指示を非表示',
} satisfies MessageCatalog;
