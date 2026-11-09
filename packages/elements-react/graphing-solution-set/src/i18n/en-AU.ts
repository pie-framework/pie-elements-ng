import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warningTitle: 'Warning',
  resetWarning: 'This will remove all the elements added on the graph and reset graph to original state. Are you sure you want to continue?',
  defineLinesFirst: 'Please define the line(s) and then select a solution set for the item.',
  lineChangeWarning: "Changing a line after adding a solution set will clear your selected solution set. Click 'Clear Solution Set' to change the line. Otherwise, click 'Cancel'.",
  addLineAFirst: 'Please add Line A to the graph before adding Line B',
  addLineBFirst: 'Please add Line B to the graph before switching to Line A',
  clearSolutionSet: 'Clear Solution Set',
  confirm: 'OK',
  cancel: 'Cancel',
} satisfies MessageCatalog;
