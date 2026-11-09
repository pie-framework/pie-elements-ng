import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  tray: '분류할 타일',
  unknownTarget: '알 수 없음',
  cancelled: '취소되었습니다',
  returnedToTray: '{name}을(를) 트레이로 되돌렸습니다',
  placedIn: '{name}을(를) {target}에 놓았습니다',
  pickedUp: '{name}을(를) 집었습니다',
  pickedUpWithKeyboard:
    '{name}을(를) 집었습니다. 놓을 위치: {target}. 화살표 키로 놓을 위치를 선택하고 Enter 키로 놓거나 Esc 키로 취소하십시오.',
  dropTarget: '놓을 위치: {target}',
  unsupportedCircles: {
    other:
      '이 다이어그램을 표시할 수 없습니다. 원이 {count}개 있으며 {supported}개까지만 지원됩니다.',
  },
  setNumber: '집합 {number}',
  regionOnly: '{set}만',
  regionNeither: '{first}도 {second}도 아님',
  regionNoneOf: '{sets} 중 어느 것도 아님',
  regionAndSeparator: ' 및 ',
  listSeparator: ', ',
  tileFallbackName: '타일',
  tileNotPlaced: '놓지 않음',
  tileInRegion: '{region}에 있음',
  tileCorrect: '정답',
  tileIncorrect: '오답',
  showCorrectAnswer: '정답 표시',
  hideCorrectAnswer: '정답 숨기기',
  showTeacherInstructions: '교사 지침 표시',
  hideTeacherInstructions: '교사 지침 숨기기',
} satisfies MessageCatalog;
