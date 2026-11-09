import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  dragInstructions: 'Space 키나 Enter 키를 눌러 이 답 선택지를 집어 주세요. 집은 후에는 Tab 키나 Shift+Tab 키로 응답 영역을 차례로 이동하거나, 화살표 키로 자유롭게 옮길 수 있습니다. Space 키나 Enter 키를 눌러 놓거나, Esc 키를 눌러 취소해 주세요.',
  commonCorrectAnswerWithAlternates: '참고: 위에 표시된 답은 이 문항에서 가장 일반적인 정답입니다. 추가 정답이 하나 이상 정의되어 있으며, 이 답도 정답으로 인정됩니다.',
  readingInstructions: '각 개체를 올바른 위치로 옮겨 정렬된 목록을 만드세요. Tab 키로 개체와 놓을 영역 사이를 이동하고, Enter 키로 선택하거나 놓고, Esc 키로 취소합니다.',
  objectsAreOnSortedList: {
    other: '개체 {total}개 중 {sorted}개가 정렬된 목록에 있습니다.',
  },
  unsortedObjects: {
    other: '정렬되지 않은 개체 {count}개',
  },
  sortedObjects: {
    other: '정렬된 개체 {count}개',
  },
  unsortedObjectPrefix: '개체:',
  sortedObjectPrefix: '위치 {position}:',
  endOfUnsorted: '정렬되지 않은 개체의 끝',
  endOfSorted: '정렬된 개체의 끝.',
  useTabToObject: 'Tab 키로 개체로 이동하세요.',
  unsortedObjectFocus: '정렬되지 않은 개체 {text} Enter 키를 눌러 선택하거나 Tab 키를 눌러 다른 개체로 이동하세요.',
  sortedObjectFocus: '정렬된 개체 {text} {total}개 중 {position}번째 위치. Enter 키를 눌러 선택하거나 Tab 키를 눌러 다른 개체로 이동하세요',
  emptyPositionFocus: '{total}개 중 {position}번째 위치이며 비어 있습니다. Enter 키를 눌러 선택한 개체 {text}을(를) 여기로 옮기거나 Tab 키를 눌러 다른 위치로 이동하세요.',
  occupiedPositionFocus: '{total}개 중 {position}번째 위치이며 개체 {occupant}이(가) 있습니다. Tab 키를 눌러 다른 위치로 이동하거나 Enter 키를 눌러 선택한 개체 {text}을(를) 여기로 옮기세요. 현재 {position}번째 위치에 있는 개체는 정렬되지 않은 목록으로 돌아갑니다.',
  unsortedListReturnFocus: '정렬되지 않은 목록입니다. Enter 키를 눌러 선택한 개체 {text}을(를) 정렬되지 않은 목록으로 되돌리거나 Tab 키를 눌러 위치로 이동하세요.',
  unsortedListLeaveFocus: '정렬되지 않은 목록입니다. Enter 키를 눌러 개체 {text}을(를) 정렬하지 않은 채로 두거나 Tab 키를 눌러 위치로 이동하세요.',
  selectedUnsorted: '선택한 개체 {text} Tab 키로 정렬된 목록의 위치로 이동하세요.',
  selectedSorted: '선택한 개체 {text}, {total}개 중 {position}번째 위치에 있습니다. Tab 키로 다른 위치로 이동하세요.',
  placed: '개체 {text}을(를) {total}개 중 {position}번째 위치에 놓았습니다.',
  moved: '개체 {text}을(를) {from}번째 위치에서 {to}번째 위치로 옮겼습니다.',
  removed: '개체 {text}을(를) {position}번째 위치에서 뺐습니다.',
  returnedToUnsorted: '개체 {text}이(가) 정렬되지 않은 목록으로 돌아갔습니다.',
  answerComplete: {
    other: '답안이 완성되었습니다. 개체 {total}개 중 {total}개가 정렬된 목록에 있습니다.',
  },
  objectsOnSortedList: {
    other: '개체 {total}개 중 {sorted}개가 정렬된 목록에 있습니다.',
  },
  useTabToAnotherObject: 'Tab 키로 다른 개체로 이동하세요.',
  noLongerSelected: '개체 {text}의 선택이 해제되었습니다.',
} satisfies MessageCatalog;
