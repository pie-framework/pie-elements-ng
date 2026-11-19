import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warning: '警告',
  limitMaxChoicesPerCategory: '每个区域最多只能放 {maxChoicesPerCategory} 个答案，你已达到上限。要添加其他答案，必须先移除一个答案。',
  cancel: '取消',
  commonCorrectAnswerWithAlternates: '注意：上方显示的答案是本题最常见的正确答案。本题还设置了一个或多个其他正确答案，这些答案同样会被判为正确。',
  maxChoicesPerCategoryRestriction: '要将此值改为 {maxChoicesPerCategory}，每个类别的答案选项不得超过 {maxChoicesPerCategory} 个。',
} satisfies MessageCatalog;
