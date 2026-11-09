import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  actions: 'Actions',
  add: 'Add',
  delete: 'Delete',
  newLabel: 'New label',
  categoryLabel: 'Category {index} label',
  categoryLabelValue: 'Category {index} label: {label}',
  category: 'Category {index}',
  warning: 'Warning',
  reachedLimit: {
    other: "There can't be more than {count} categories.",
  },
  key: 'Key',
  keyLegend: {
    incorrectAnswer: 'Student incorrect answer',
    correctAnswer: 'Student correct answer',
    correctKeyAnswer: 'Answer key correct',
  },
  chartTypes: {
    bar: 'Bar chart',
    histogram: 'Histogram',
    lineDot: 'Line chart with dots',
    lineCross: 'Line chart with crosses',
    dotPlot: 'Dot plot',
    linePlot: 'Line plot',
  },
  categoriesNone: 'No categories.',
  categories: {
    one: '{count} category: {categories}.',
    other: '{count} categories: {categories}.',
  },
  valueRange: 'Values from {min} to {max}.',
  labelledValueRange: '{label} from {min} to {max}.',
} satisfies MessageCatalog;
