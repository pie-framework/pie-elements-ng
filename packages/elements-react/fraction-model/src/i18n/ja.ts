import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  modelLabel: {
    other: 'モデル {index}/{total}：{count} 個の部分のうち {selected} 個を選択',
  },
  numberOfModels: 'モデルの数',
  partsPerModel: '1 つのモデルの部分の数',
  warningTitle: '警告',
  answerChangeWarning: 'モデルの数または 1 つのモデルの部分の数を変更すると、追加した解答が削除されます。続行しますか？',
  confirm: 'OK',
  cancel: 'キャンセル',
} satisfies MessageCatalog;
