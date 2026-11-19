import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  addElementLimit: {
    other: '最多只能添加 {count} 个元素。',
  },
  undo: '撤销',
  clearAll: '全部清除',
  graphLabel: '从 {min} 到 {max} 的数轴，每隔 {interval} 有一个刻度',
  closedEnd: '实心',
  openEnd: '空心',
  elementCorrect: '正确。',
  elementIncorrect: '错误。',
  line: '从 {left}（{leftEnd}）到 {right}（{rightEnd}）的线段。',
  plottedNone: '尚未标出任何内容。',
  pointClosed: '位于 {position} 的实心点。',
  pointOpen: '位于 {position} 的空心点。',
  rayLeft: '从 {position}（{end}）向左的射线。',
  rayRight: '从 {position}（{end}）向右的射线。',
} satisfies MessageCatalog;
