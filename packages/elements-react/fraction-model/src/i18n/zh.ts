import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  modelLabel: {
    other: '模型 {index}/{total}：已选择 {count} 份中的 {selected} 份',
  },
  numberOfModels: '模型数量',
  partsPerModel: '每个模型的份数',
  warningTitle: '警告',
  answerChangeWarning: '更改模型数量或每个模型的份数将删除已添加的答案。确定要继续吗？',
  confirm: '确定',
  cancel: '取消',
} satisfies MessageCatalog;
