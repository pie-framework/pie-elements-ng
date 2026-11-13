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
  lineStyleCorrect: '선 모양 정답: {style}',
  lineStyleIncorrect: '선 모양 오답: 그린 모양 {drawn}, 정답 모양 {expected}',
  regionVerdict: {
    correct: '음영 영역 정답',
    incorrect: '음영 영역 오답',
    missing: '정답 키의 음영 영역, 음영 처리되지 않음',
  },
  key: '범례',
  keyLegend: {
    studentCorrect: '학생 정답',
    studentIncorrect: '학생 오답',
    answerKeyCorrect: '정답 키 기준 정답',
    lineStyleCorrect: '선 모양 정답',
    lineStyleIncorrect: '선 모양 오답',
  },
} satisfies MessageCatalog;
