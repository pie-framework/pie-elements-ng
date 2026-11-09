/** The interface strings `@pie-lib/graphing` renders; the source for every other locale. */
export default {
  /** Accessible name of a graph with no title. */
  graph: 'Coordinate graph',
  /** The graph's description: each axis's range, then what is plotted. */
  axisRange: '{axis} axis from {min} to {max}.',
  plottedNone: 'Nothing plotted.',
  plotted: {
    one: '{count} object plotted: {marks}.',
    other: '{count} objects plotted: {marks}.',
  },
  /** Tool and mark names, keyed by tool type: the toolbar's buttons and the plotted list. */
  point: 'Point',
  circle: 'Circle',
  line: 'Line',
  parabola: 'Parabola',
  absolute: 'Absolute Value',
  exponential: 'Exponential',
  polygon: 'Polygon',
  ray: 'Ray',
  segment: 'Segment',
  sine: 'Sine',
  vector: 'Vector',
  label: 'Label',
  /** Accessible name of a mark's label input, by the mark's coordinates. */
  markLabel: 'Label at ({x}, {y})',
  correctMarkLabel: 'Correct label at ({x}, {y})',
  undo: 'Undo',
  redo: 'Redo',
  reset: 'Reset',
  /** Status line once the student has placed as many marks with the current tool as its limit allows. */
  markLimitReached: '{tool}: limit of {limit} reached. No more can be placed.',
  /** Title of the evaluate legend. */
  key: 'Key',
  keyLegend: {
    missingRequiredLabel: 'Missing Required Label',
    answerKeyCorrect: 'Answer Key Correct',
    answerKeyCorrectLabel: 'Answer Key Correct Label',
    studentIncorrect: 'Student Incorrect',
    incorrectStudentLabel: 'Incorrect Student Label',
    studentCorrect: 'Student Correct',
    studentCorrectLabel: 'Student Correct Label',
  },
};
