import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  choicesListA11y: '선택지 목록',
  answerA11y: '답 {id}',
  responseAreaForA11y: '{prompt}의 응답 영역',
  responseAreaA11y: '응답 영역 {id}',
  dragInstructionsA11y: 'Space 또는 Enter 키를 눌러 이 답 선택지를 집습니다. 집은 후에는 Tab 또는 Shift+Tab 키로 응답 영역을 차례로 이동하거나 화살표 키로 자유롭게 이동합니다. Space 또는 Enter 키를 눌러 놓거나 Esc 키를 눌러 취소합니다. 답 선택지를 클릭하여 선택한 다음 응답 영역을 클릭하여 그곳에 놓을 수도 있습니다.',
  pickedUpA11y: '{choice}을(를) 집었습니다. Tab 키로 응답 영역 사이를 이동한 다음 Space 또는 Enter 키를 눌러 놓습니다.',
  notOverResponseAreaA11y: '{choice}이(가) 응답 영역 위에 있지 않습니다.',
  overFilledA11y: '{target} 위에 있습니다. 현재 {choice}이(가) 들어 있습니다.',
  overEmptyA11y: '{target} 위에 있습니다. 현재 비어 있습니다.',
  returnedA11y: '{choice}이(가) 원래 위치로 돌아갔습니다.',
  droppedA11y: '{choice}을(를) {target}에 놓았습니다.',
  cancelledA11y: '취소했습니다. {choice}이(가) 원래 위치로 돌아갔습니다.',
} satisfies MessageCatalog;
