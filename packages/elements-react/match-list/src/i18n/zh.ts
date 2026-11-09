import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  choicesListA11y: '选项列表',
  answerA11y: '答案 {id}',
  responseAreaForA11y: '{prompt}的作答区',
  responseAreaA11y: '作答区 {id}',
  dragInstructionsA11y: '按空格键或 Enter 键拿起此答案选项。拿起后，使用 Tab 键或 Shift+Tab 键在各作答区之间切换，或使用方向键自由移动。按空格键或 Enter 键放下，或按 Esc 键取消。也可以点击答案选项将其选中，然后点击作答区将其放到该处。',
  pickedUpA11y: '已拿起{choice}。使用 Tab 键在作答区之间移动，然后按空格键或 Enter 键放下。',
  notOverResponseAreaA11y: '{choice}不在作答区上方。',
  overFilledA11y: '位于{target}上方。当前包含{choice}。',
  overEmptyA11y: '位于{target}上方。当前为空。',
  returnedA11y: '{choice}已返回原位置。',
  droppedA11y: '已将{choice}放入{target}。',
  cancelledA11y: '已取消。{choice}已返回原位置。',
} satisfies MessageCatalog;
