import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  tray: 'Tiles to classify',
  unknownTarget: 'unknown',
  cancelled: 'Cancelled',
  returnedToTray: '{name} returned to tray',
  placedIn: '{name} placed in {target}',
  pickedUp: 'Picked up {name}',
  pickedUpWithKeyboard:
    'Picked up {name}, drop target: {target}. Use arrow keys to choose a drop target, Enter to drop, Escape to cancel.',
  dropTarget: 'Drop target: {target}',
  unsupportedCircles: {
    one: 'This diagram cannot be shown: it has {count} circle, and only {supported} are supported.',
    other:
      'This diagram cannot be shown: it has {count} circles, and only {supported} are supported.',
  },
  setNumber: 'Set {number}',
  regionOnly: '{set} only',
  regionNeither: 'Neither {first} nor {second}',
  regionNoneOf: 'None of {sets}',
  regionAndSeparator: ' and ',
  listSeparator: ', ',
  tileFallbackName: 'Tile',
  tileNotPlaced: 'not placed',
  tileInRegion: 'in {region}',
  tileCorrect: 'correct',
  tileIncorrect: 'incorrect',
  showCorrectAnswer: 'Show correct answer',
  hideCorrectAnswer: 'Hide correct answer',
  showTeacherInstructions: 'Show Teacher Instructions',
  hideTeacherInstructions: 'Hide Teacher Instructions',
} satisfies MessageCatalog;
