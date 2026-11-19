import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  addElementLimit: {
    other: '요소는 {count}개까지만 추가할 수 있습니다.',
  },
  undo: '실행 취소',
  clearAll: '모두 지우기',
  graphLabel: '{min}부터 {max}까지의 수직선, 눈금 간격 {interval}',
  closedEnd: '닫힘',
  openEnd: '열림',
  elementCorrect: '정답입니다.',
  elementIncorrect: '오답입니다.',
  line: '{left}({leftEnd})부터 {right}({rightEnd})까지의 선분입니다.',
  plottedNone: '표시된 것이 없습니다.',
  pointClosed: '{position}에 있는 닫힌 점입니다.',
  pointOpen: '{position}에 있는 열린 점입니다.',
  rayLeft: '{position}({end})에서 왼쪽으로 향하는 반직선입니다.',
  rayRight: '{position}({end})에서 오른쪽으로 향하는 반직선입니다.',
} satisfies MessageCatalog;
