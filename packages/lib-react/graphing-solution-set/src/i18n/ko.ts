import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  graph: '좌표평면 그래프',
  axisRange: '{axis}축은 {min}부터 {max}까지입니다.',
  plottedNone: '그려진 개체가 없습니다.',
  plotted: {
    other: '그려진 개체 {count}개: {marks}.',
  },
  line: '선',
  shadedRegion: '음영 영역',
  label: '레이블',
  markLabel: '({x}, {y})의 레이블',
  reset: '초기화',
  lineA: '선 A',
  lineB: '선 B',
  solutionSet: '해집합',
  solid: '실선',
  dashed: '점선',
} satisfies MessageCatalog;
