import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoice: '答案选项 {index}/{total}',
  image: {
    other: '包含 {count} 个作答区域的图片',
  },
  reachedLimit: {
    other: '已满',
  },
  responseArea: '作答区域 {index}/{total}',
  choicesListA11y: '选项列表',
} satisfies MessageCatalog;
