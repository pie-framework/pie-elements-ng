import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  mathResponseQuestion: '数学作答题',
  mathEquationResponseQuestion: '数学方程作答题',
  keypadInstructions: '此字段支持屏幕键盘和实体键盘输入。使用实体键盘可访问并操作屏幕上的数学键盘，该键盘支持 LaTeX 标记。使用向下箭头键可打开数学键盘并在其按钮间移动。使用 Esc 键可关闭数学键盘并返回输入字段。',
  primaryCorrectWithAlternates: '注：上方显示的答案是作者为本题指定的主要正确答案，但其他答案也可能被判为正确。',
  showNote: '显示注释',
  hideNote: '隐藏注释',
  noteLabel: '注：',
} satisfies MessageCatalog;
