import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  showRubric: '显示评分量规',
  hideRubric: '隐藏评分量规',
  halfScoringNote: '* 此评分量规允许给半分或介于两档之间的分数。',
  tooLargeForPrint: '该题目过大，无法在打印模式下完整显示。',
  standardsHeader: '标准',
  descriptionHeader: '描述',
  scorePoints: {
    other: '{count} 分',
  },
  noDescription: '无描述',
} satisfies MessageCatalog;
