/** The interface strings `@pie-lib/charting` renders; the source for every other locale. */
export default {
  /** The menu for adding and deleting categories, and its items. */
  actions: 'Actions',
  add: 'Add',
  delete: 'Delete',
  /** Label of a category added without a default label, and its name in the delete item. */
  newLabel: 'New label',
  /** Accessible names of a category's label input, and of its typeset label. */
  categoryLabel: 'Category {index} label',
  categoryLabelValue: 'Category {index} label: {label}',
  /** Accessible name of a category's value slider when the category has no label. */
  category: 'Category {index}',
  /** The dialog shown on adding a category past the limit. */
  warning: 'Warning',
  reachedLimit: {
    other: "There can't be more than {count} categories.",
  },
  /** Title of the evaluate legend. */
  key: 'Key',
  keyLegend: {
    incorrectAnswer: 'Student incorrect answer',
    correctAnswer: 'Student correct answer',
    correctKeyAnswer: 'Answer key correct',
  },
  /** The chart's accessible name when it has no title, by chart type. */
  chartTypes: {
    bar: 'Bar chart',
    histogram: 'Histogram',
    lineDot: 'Line chart with dots',
    lineCross: 'Line chart with crosses',
    dotPlot: 'Dot plot',
    linePlot: 'Line plot',
  },
  /** The chart's description: its categories, then the range of its values. */
  categoriesNone: 'No categories.',
  categories: {
    one: '{count} category: {categories}.',
    other: '{count} categories: {categories}.',
  },
  valueRange: 'Values from {min} to {max}.',
  labelledValueRange: '{label} from {min} to {max}.',
};
