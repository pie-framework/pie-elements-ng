import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warningTitle: '警告',
  resetWarning: '这将删除图中添加的所有元素，并将图重置为初始状态。确定要继续吗？',
  defineLinesFirst: '请先确定直线，然后为本题选择解集。',
  lineChangeWarning: '添加解集后更改直线将清除所选的解集。单击“清除解集”以更改直线，否则请单击“取消”。',
  addLineAFirst: '请先在图中添加直线 A，再添加直线 B',
  addLineBFirst: '请先在图中添加直线 B，再切换到直线 A',
  clearSolutionSet: '清除解集',
  confirm: '确定',
  cancel: '取消',
} satisfies MessageCatalog;
