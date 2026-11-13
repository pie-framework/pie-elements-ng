/** The interface strings `@pie-lib/graphing-solution-set` renders; the source for every other locale. */
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
  /** Names of the plotted marks: a line, and the polygon that shades the solution set. */
  line: 'Line',
  shadedRegion: 'Shaded region',
  label: 'Label',
  /** Accessible name of a mark's label input, by the mark's coordinates. */
  markLabel: 'Label at ({x}, {y})',
  reset: 'Reset',
  /** The tool menu: the lines and the solution set to pick from, and each line's style. */
  lineA: 'Line A',
  lineB: 'Line B',
  solutionSet: 'Solution Set',
  solid: 'Solid',
  dashed: 'Dashed',
  /** A line's solid or dashed style judged apart from its position, read out by the badge beside the line. */
  lineStyleCorrect: 'Line style correct: {style}',
  lineStyleIncorrect: 'Line style incorrect: drawn {drawn}, expected {expected}',
  /** Read out for the icon on a shaded region in evaluate. */
  regionVerdict: {
    correct: 'Shaded region correct',
    incorrect: 'Shaded region incorrect',
    missing: 'Shaded region in the answer key, not shaded',
  },
  /** Title of the evaluate legend. */
  key: 'Key',
  keyLegend: {
    studentCorrect: 'Student Correct',
    studentIncorrect: 'Student Incorrect',
    answerKeyCorrect: 'Answer Key Correct',
    lineStyleCorrect: 'Line Style Correct',
    lineStyleIncorrect: 'Line Style Incorrect',
  },
};
