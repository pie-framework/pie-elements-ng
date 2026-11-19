/** The interface strings `@pie-element/venn-classification` renders; the source for every other locale. */
export default {
  /** Name of the tray holding the unplaced tiles, also the drop target that returns a tile there. */
  tray: 'Tiles to classify',
  /** Drop target named when it cannot be resolved. */
  unknownTarget: 'unknown',
  /** Live announcements while a tile is moved. */
  cancelled: 'Cancelled',
  returnedToTray: '{name} returned to tray',
  placedIn: '{name} placed in {target}',
  pickedUp: 'Picked up {name}',
  pickedUpWithKeyboard:
    'Picked up {name}, drop target: {target}. Use arrow keys to choose a drop target, Enter to drop, Escape to cancel.',
  dropTarget: 'Drop target: {target}',
  /** Shown instead of a diagram whose circle count delivery cannot lay out. */
  unsupportedCircles: {
    one: 'This diagram cannot be shown: it has {count} circle, and only {supported} are supported.',
    other:
      'This diagram cannot be shown: it has {count} circles, and only {supported} are supported.',
  },
  /** A circle with no label, by its number. */
  setNumber: 'Set {number}',
  /** Region names composed from the circle labels. */
  regionOnly: '{set} only',
  regionNeither: 'Neither {first} nor {second}',
  regionNoneOf: 'None of {sets}',
  /** Joins the circle labels of an overlap, "A and B". */
  regionAndSeparator: ' and ',
  /** Joins a list: the circles of `regionNoneOf`, and the parts of a tile's name. */
  listSeparator: ', ',
  /** A tile's accessible name: its label, or this for a tile with none, then where it sits and its verdict. */
  tileFallbackName: 'Tile',
  tileNotPlaced: 'not placed',
  tileInRegion: 'in {region}',
  tileCorrect: 'correct',
  tileIncorrect: 'incorrect',
  /** Labels of the correct-answer toggle. */
  showCorrectAnswer: 'Show correct answer',
  hideCorrectAnswer: 'Hide correct answer',
  /** Labels of the teacher instructions' toggle. */
  showTeacherInstructions: 'Show Teacher Instructions',
  hideTeacherInstructions: 'Hide Teacher Instructions',
};
