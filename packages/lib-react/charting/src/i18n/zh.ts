import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  actions: '操作',
  add: '添加',
  delete: '删除',
  newLabel: '新标签',
  categoryLabel: '类别 {index} 的标签',
  categoryLabelValue: '类别 {index} 的标签：{label}',
  category: '类别 {index}',
  warning: '警告',
  reachedLimit: {
    other: '类别不能超过 {count} 个。',
  },
  key: '图例',
  keyLegend: {
    incorrectAnswer: '学生错误答案',
    correctAnswer: '学生正确答案',
    correctKeyAnswer: '标准答案',
  },
  chartTypes: {
    bar: '条形图',
    histogram: '直方图',
    lineDot: '带点的折线图',
    lineCross: '带叉号的折线图',
    dotPlot: '点图',
    linePlot: '线图',
  },
  categoriesNone: '暂无类别。',
  categories: {
    other: '{count} 个类别：{categories}。',
  },
  valueRange: '数值范围为 {min} 至 {max}。',
  labelledValueRange: '{label}范围为 {min} 至 {max}。',
} satisfies MessageCatalog;
