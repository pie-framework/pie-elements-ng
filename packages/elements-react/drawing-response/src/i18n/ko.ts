import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  fillColor: '채우기 색',
  outlineColor: '윤곽선 색',
  colors: {
    noFill: '채우기 없음',
    lightblue: '하늘색',
    lightyellow: '연노랑',
    red: '빨강',
    orange: '주황',
    yellow: '노랑',
    violet: '보라',
    blue: '파랑',
    green: '초록',
    white: '흰색',
    black: '검정',
  },
  onDoubleClick: '이 텍스트를 편집하려면 두 번 클릭해 주세요. 완료하려면 Enter 키를 눌러 주세요.',
  drawingArea: '그리기 영역',
  drawingAreaOverImage: '배경 이미지 위의 그리기 영역',
  tools: {
    select: '선택',
    freeDraw: '자유 그리기',
    line: '선',
    rectangle: '직사각형',
    circle: '원',
    textEntry: '텍스트 입력',
    eraser: '지우개',
  },
  undo: '실행 취소',
  clearAll: '모두 지우기',
  renderError: '오류가 발생했습니다: {message}',
} satisfies MessageCatalog;
