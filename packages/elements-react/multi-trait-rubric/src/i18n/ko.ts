import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  showRubric: '채점 기준표 표시',
  hideRubric: '채점 기준표 숨기기',
  halfScoringNote: '* 이 채점 기준표에서는 0.5점 또는 중간 점수를 줄 수 있습니다.',
  tooLargeForPrint: '문항이 너무 커서 인쇄 모드에 맞지 않습니다.',
  standardsHeader: '성취기준',
  descriptionHeader: '설명',
  scorePoints: {
    other: '{count}점',
  },
  noDescription: '설명 없음',
} satisfies MessageCatalog;
