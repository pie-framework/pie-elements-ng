import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  showRubric: 'ルーブリックを表示',
  hideRubric: 'ルーブリックを非表示',
  halfScoringNote: '* このルーブリックでは、0.5 点刻みや中間の得点も認められます。',
  tooLargeForPrint: '問題が大きすぎるため、印刷モードに収まりません。',
  standardsHeader: '基準',
  descriptionHeader: '説明',
  scorePoints: {
    other: '{count} 点',
  },
  noDescription: '説明なし',
} satisfies MessageCatalog;
