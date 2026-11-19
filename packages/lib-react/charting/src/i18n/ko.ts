import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  actions: '작업',
  add: '추가',
  delete: '삭제',
  newLabel: '새 레이블',
  categoryLabel: '범주 {index} 레이블',
  categoryLabelValue: '범주 {index} 레이블: {label}',
  category: '범주 {index}',
  warning: '경고',
  reachedLimit: {
    other: '범주는 {count}개를 초과할 수 없습니다.',
  },
  key: '범례',
  keyLegend: {
    incorrectAnswer: '학생 오답',
    correctAnswer: '학생 정답',
    correctKeyAnswer: '정답 키 기준 정답',
  },
  chartTypes: {
    bar: '막대그래프',
    histogram: '히스토그램',
    lineDot: '점이 있는 꺾은선그래프',
    lineCross: '십자 표시가 있는 꺾은선그래프',
    dotPlot: '점 도표',
    linePlot: '선 도표',
  },
  categoriesNone: '범주가 없습니다.',
  categories: {
    other: '범주 {count}개: {categories}.',
  },
  valueRange: '값은 {min}부터 {max}까지입니다.',
  labelledValueRange: '{label}: {min}부터 {max}까지.',
} satisfies MessageCatalog;
