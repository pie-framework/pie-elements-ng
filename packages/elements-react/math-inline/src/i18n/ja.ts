import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  mathResponseQuestion: '数式解答問題',
  mathEquationResponseQuestion: '方程式解答問題',
  keypadInstructions: 'この入力欄では、画面上のキーパッドとキーボードの両方で入力できます。キーボードを使って、LaTeX記法を入力できる画面上の数式キーパッドにアクセスし、操作できます。下矢印キーでキーパッドを開き、ボタン間を移動してください。Escキーでキーパッドを閉じ、入力欄に戻ってください。',
  primaryCorrectWithAlternates: '注：上に表示されている解答は、作成者がこの問題に指定した主な正解ですが、ほかの解答も正解として認められる場合があります。',
  showNote: '注を表示',
  hideNote: '注を非表示',
  noteLabel: '注：',
} satisfies MessageCatalog;
