import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warningTitle: '警告',
  resetWarning: 'グラフに追加したすべての要素が削除され、グラフが元の状態にリセットされます。続行しますか？',
  defineLinesFirst: '先に線を定めてから、この問題の解の集合を選択してください。',
  lineChangeWarning: '解の集合を追加した後に線を変更すると、選択した解の集合が消去されます。線を変更するには「解の集合を消去」をクリックしてください。変更しない場合は「キャンセル」をクリックしてください。',
  addLineAFirst: '線Bを追加する前に、グラフに線Aを追加してください',
  addLineBFirst: '線Aに切り替える前に、グラフに線Bを追加してください',
  clearSolutionSet: '解の集合を消去',
  confirm: 'OK',
  cancel: 'キャンセル',
} satisfies MessageCatalog;
