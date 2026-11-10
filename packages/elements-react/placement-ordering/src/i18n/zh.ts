import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  dragInstructions: '按空格键或 Enter 键拿起此答案选项。拿起后，使用 Tab 键或 Shift+Tab 键在作答区域之间切换，或使用方向键自由移动。按空格键或 Enter 键放下，或按 Esc 键取消。',
  commonCorrectAnswerWithAlternates: '注意：上方显示的答案是本题最常见的正确答案。本题还设置了一个或多个其他正确答案，这些答案同样会被判为正确。',
  readingInstructions: '把每个对象移动到正确的位置，建立一个排好序的列表。使用 Tab 键在对象和放置区域之间切换，按 Enter 键选择或放下，按 Esc 键取消。',
  objectsAreOnSortedList: {
    other: '{total} 个对象中有 {sorted} 个在已排序列表中。',
  },
  unsortedObjects: {
    other: '{count} 个未排序对象',
  },
  sortedObjects: {
    other: '{count} 个已排序对象',
  },
  unsortedObjectPrefix: '对象：',
  sortedObjectPrefix: '位置 {position}：',
  endOfUnsorted: '未排序对象结束',
  endOfSorted: '已排序对象结束。',
  useTabToObject: '使用 Tab 键移动到对象。',
  unsortedObjectFocus: '未排序对象 {text} 按 Enter 键选择，或按 Tab 键移动到其他对象。',
  sortedObjectFocus: '已排序对象 {text} 位于第 {position} 个位置，共 {total} 个。按 Enter 键选择，或按 Tab 键移动到其他对象',
  emptyPositionFocus: '第 {position} 个位置，共 {total} 个，该位置为空。按 Enter 键把所选对象 {text} 移到这里，或按 Tab 键移动到其他位置。',
  occupiedPositionFocus: '第 {position} 个位置，共 {total} 个，该位置已有对象 {occupant}。按 Tab 键移动到其他位置，或按 Enter 键把所选对象 {text} 移到这里，这会把目前在第 {position} 个位置的对象放回未排序列表。',
  unsortedListReturnFocus: '未排序列表。按 Enter 键把所选对象 {text} 放回未排序列表，或按 Tab 键移动到某个位置。',
  unsortedListLeaveFocus: '未排序列表。按 Enter 键让对象 {text} 保持未排序，或按 Tab 键移动到某个位置。',
  selectedUnsorted: '已选择对象 {text} 使用 Tab 键移动到已排序列表中的某个位置。',
  selectedSorted: '已选择对象 {text}，位于第 {position} 个位置，共 {total} 个。使用 Tab 键移动到其他位置。',
  placed: '已把对象 {text} 放到第 {position} 个位置，共 {total} 个。',
  moved: '已把对象 {text} 从第 {from} 个位置移到第 {to} 个位置。',
  removed: '已把对象 {text} 从第 {position} 个位置移除。',
  returnedToUnsorted: '对象 {text} 已放回未排序列表。',
  answerComplete: {
    other: '答案已完成。{total} 个对象中有 {total} 个在已排序列表中。',
  },
  objectsOnSortedList: {
    other: '{total} 个对象中有 {sorted} 个在已排序列表中。',
  },
  useTabToAnotherObject: '使用 Tab 键移动到其他对象。',
  noLongerSelected: '对象 {text} 已取消选择。',
} satisfies MessageCatalog;
