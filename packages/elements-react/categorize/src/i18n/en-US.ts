/** The interface strings `@pie-element/categorize` renders; the source for every other locale. */
export default {
  /** The dialog shown when a drop would exceed the per-category limit: title, text and close button. */
  warning: 'Warning',
  limitMaxChoicesPerCategory:
    "You've reached the limit of {maxChoicesPerCategory} responses per area. To add another response, one must first be removed.",
  cancel: 'Cancel',
  /** Shown with the correct answer when alternate correct answers are defined; an authored note replaces it. */
  commonCorrectAnswerWithAlternates:
    'Note: The answer shown above is the most common correct answer for this item. One or more additional correct answers are also defined, and will also be recognized as correct.',
  /** The authoring alert shown when a lower per-category limit is less than the answer choices a category already holds. */
  maxChoicesPerCategoryRestriction:
    'To change this value to {maxChoicesPerCategory}, each category must have {maxChoicesPerCategory} or fewer answer choices.',
  /** Name of the answer choice pool, read when it is a tab stop; categorize's authored choices label replaces it. */
  choicesListA11y: 'Choices list',

  /* Screen reader announcements. A choice's drag instruction, read after its name. */
  dragInstructionsA11y: 'Press ENTER to select.',
  /** Names a choice, category, row or column that has no text of its own, by its position. */
  unnamedA11y: 'number {index}',
  /** Intro, row 1: the categories and the answer choices. A list of categories, by how many there are and what each holds. */
  introOneCategoryUnlimitedA11y: 'The question has 1 category, which can hold any number of answer choices.',
  introOneCategoryOneA11y: 'The question has 1 category, which can hold 1 answer choice.',
  introOneCategoryManyA11y: 'The question has 1 category, which can hold up to {capacity} answer choices.',
  introCategoriesUnlimitedA11y: 'The question has {count} categories, which can each hold any number of answer choices.',
  introCategoriesOneA11y: 'The question has {count} categories, which can each hold 1 answer choice.',
  introCategoriesManyA11y: 'The question has {count} categories, which can each hold up to {capacity} answer choices.',
  /** Intro, row 1: categories in a matrix. `An` is for a count said with a vowel sound (8, 11, 18) in English; other locales word both alike. */
  introMatrixA11y: 'The question has {count} categories, arranged in a {columns} by {rows} matrix.',
  introMatrixAnA11y: 'The question has {count} categories, arranged in an {columns} by {rows} matrix.',
  /** Math: a fraction as it is said. */
  mathFractionA11y: '{numerator} over {denominator}',
  matrixCapacityUnlimitedA11y: 'Each category can hold any number of answer choices.',
  matrixCapacityOneA11y: 'Each category can hold 1 answer choice.',
  matrixCapacityManyA11y: 'Each category can hold up to {capacity} answer choices.',
  columnLabelsA11y: 'The column labels are:',
  columnA11y: 'Column {index}: {label}',
  rowLabelsA11y: 'The row labels are:',
  rowA11y: 'Row {index}: {label}',
  introChoicesReusableA11y: {
    one: 'There is {count} answer choice, which can be reused.',
    other: 'There are {count} answer choices, which can be reused.',
  },
  introChoicesNotReusableA11y: {
    one: 'There is {count} answer choice, which cannot be reused.',
    other: 'There are {count} answer choices, which cannot be reused.',
  },
  /** Intro, row 2. */
  keyboardHelpA11y: 'Use TAB to move between answer choices and categories, ENTER to select/drop, and ESC to cancel.',
  /** Intro, row 3: each category and what it holds. The subject is one of the next three. */
  categorySubjectA11y: 'Category {label}',
  categorySubjectIndexedA11y: 'Category {index} {label}',
  categorySubjectMatrixA11y: 'The category in row {row} and column {column}',
  categoryEmptyA11y: '{subject} is empty.',
  categoryHoldsA11y: '{subject} contains answer choice {choice}.',
  categoryContainsA11y: {
    one: '{subject} contains {count} answer choice.',
    other: '{subject} contains {count} answer choices.',
  },
  categoryChoiceA11y: 'answer choice {choice}',
  categoryEndA11y: 'End of answer choices.',
  /** Intro, row 4: the answer choices still in the pool. */
  availableA11y: {
    one: '{count} available answer choice.',
    other: '{count} available answer choices.',
  },
  availableChoiceA11y: 'Answer choice: {choice}',
  availableEndA11y: 'End of available answer choices.',
  tabToChoicesA11y: 'Use TAB to move to an answer choice.',
  /** A category as the other messages name it: in a list, and in a matrix. */
  categoryNamedA11y: 'category {label}',
  categoryInMatrixA11y: 'category in row {row} and column {column}',
  /** Rows 5 and 6: the name of a choice in the pool, and in a category. */
  answerChoiceA11y: 'Answer choice: {choice}',
  answerChoiceInCategoryA11y: 'Answer choice: {choice} in {category}',
  /** Row 7: a choice was selected. */
  selectedA11y: 'Selected answer choice {choice}. Use TAB to move to a drop area.',
  /** Rows 8 and 15: a selection ended without moving anything. */
  deselectedA11y: 'Answer choice {choice} is no longer selected. Use TAB to move to an answer choice.',
  /** Row 9: a category has focus while a choice is selected. */
  overCategoryA11y:
    'Selected drop area for {category}. Press ENTER to move selected answer choice {choice} here or TAB to move to a different drop area.',
  /** Row 10: the pool has focus while the selected choice is in a category. */
  overPoolFromCategoryA11y:
    'Press ENTER to remove selected answer choice {choice} from drop area for {category} or TAB to move to a category drop area.',
  /** Row 11: the pool has focus while the selected choice is already in it. */
  overPoolUnplacedA11y:
    'Press ENTER to leave selected answer choice {choice} unplaced or TAB to move to a category drop area.',
  /** Focus is on no category and not on the pool during a drag. */
  notOverDropAreaA11y: '{choice} is not over a drop area.',
  /** Rows 12 to 14: what a placement just did. */
  placedA11y: 'Placed answer choice {choice} in drop area for {category}.',
  /** Row 12, in a list and in a matrix alike: a one-choice category gave up its choice. */
  replacedA11y: 'To make room for it, answer choice {removed} was removed.',
  movedA11y: 'Moved answer choice {choice} from drop area for {from} to drop area for {to}.',
  removedA11y: 'Removed answer choice {choice} from drop area for {from}.',
};
