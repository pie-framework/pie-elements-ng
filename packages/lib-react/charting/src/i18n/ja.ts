import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  actions: '操作',
  add: '追加',
  delete: '削除',
  newLabel: '新しいラベル',
  categoryLabel: 'カテゴリー{index}のラベル',
  categoryLabelValue: 'カテゴリー{index}のラベル：{label}',
  category: 'カテゴリー{index}',
  warning: '警告',
  reachedLimit: {
    other: 'カテゴリーは{count}個までです。',
  },
  key: '凡例',
  keyLegend: {
    incorrectAnswer: '生徒の不正解',
    correctAnswer: '生徒の正解',
    correctKeyAnswer: '正解（解答キー）',
  },
  chartTypes: {
    bar: '棒グラフ',
    histogram: 'ヒストグラム',
    lineDot: '点付き折れ線グラフ',
    lineCross: '×印付き折れ線グラフ',
    dotPlot: 'ドットプロット',
    linePlot: 'ラインプロット',
  },
  categoriesNone: 'カテゴリーはありません。',
  categories: {
    other: 'カテゴリー{count}個：{categories}。',
  },
  valueRange: '値の範囲：{min}～{max}。',
  labelledValueRange: '{label}：{min}～{max}。',
} satisfies MessageCatalog;
