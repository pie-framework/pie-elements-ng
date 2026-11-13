import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warning: '경고',
  limitMaxChoicesPerCategory: '영역당 답을 {maxChoicesPerCategory}개까지만 넣을 수 있습니다. 답을 더 넣으려면 먼저 하나를 빼야 합니다.',
  cancel: '취소',
  commonCorrectAnswerWithAlternates: '참고: 위에 표시된 답은 이 문항에서 가장 일반적인 정답입니다. 추가 정답이 하나 이상 정의되어 있으며, 이 답도 정답으로 인정됩니다.',
  maxChoicesPerCategoryRestriction: '이 값을 {maxChoicesPerCategory}개로 변경하려면 각 카테고리의 답 선택지가 {maxChoicesPerCategory}개 이하여야 합니다.',
} satisfies MessageCatalog;
