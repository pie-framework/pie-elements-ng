/** The interface strings `@pie-element/multiple-choice` renders; the source for every other locale. */
export default {
  /** Region name and screen-reader heading of a single-answer question. */
  multipleChoiceQuestion: 'Multiple Choice Question',
  /** Region name of a multiple-answer question. */
  multipleCorrectAnswerQuestion: 'Multiple Correct Answer Question',
  /** Screen-reader heading of a multiple-answer question. */
  multipleSelectQuestion: 'Multiple Select Question',
  minSelections: 'Select at least {minSelections}.',
  minmaxSelectionsEqual: 'Select {minSelections}.',
  minmaxSelectionsRange: 'Select between {minSelections} and {maxSelections}.',
  maxSelections: {
    one: 'Only {count} answer is allowed.',
    other: 'Only {count} answers are allowed.',
  },
  showTeacherInstructions: 'Show Teacher Instructions',
  hideTeacherInstructions: 'Hide Teacher Instructions',
  /** Visually hidden name of the answer choices' group; the prompt renders before it (PIE-1244). */
  answerChoicesA11y: 'Answer choices',
  /** The same group's name in a two-part question, so its parts' groups stay apart. */
  partAnswerChoicesA11y: '{partLabel}, answer choices',
  /** Visually hidden note after a choice's key, naming a choice whose math is read in the content. */
  pickTheAnswerBelowA11y: 'Pick the answer below',
};
