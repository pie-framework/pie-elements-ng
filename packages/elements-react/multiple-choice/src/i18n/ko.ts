import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: '객관식 문항',
  multipleCorrectAnswerQuestion: '복수 정답 문항',
  multipleSelectQuestion: '복수 선택 문항',
  minSelections: '최소 {minSelections}개를 선택해 주세요.',
  minmaxSelectionsEqual: '{minSelections}개를 선택해 주세요.',
  minmaxSelectionsRange: '{minSelections}개에서 {maxSelections}개 사이로 선택해 주세요.',
  maxSelections: {
    other: '{count}개의 답안만 허용됩니다.',
  },
  answerChoicesA11y: '답안 선택지',
  partAnswerChoicesA11y: '{partLabel}, 답안 선택지',
  pickTheAnswerBelowA11y: '아래에서 답을 선택해 주세요',
  choiceNameA11y: '선택지 {key}',
} satisfies MessageCatalog;
