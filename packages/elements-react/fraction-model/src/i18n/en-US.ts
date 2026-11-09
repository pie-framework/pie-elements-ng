/** The interface strings `@pie-element/fraction-model` renders; the source for every other locale. */
export default {
  /** A model's accessible name; the plural follows the parts per model. */
  modelLabel: {
    one: 'Model {index} of {total}: {selected} of {count} part selected',
    other: 'Model {index} of {total}: {selected} of {count} parts selected',
  },
  /** Labels of the fields a learner sets when the item lets them configure the models. */
  numberOfModels: 'Number of Models',
  partsPerModel: 'Parts per Model',
  /** The dialog shown before a configuration change clears the learner's answer. */
  warningTitle: 'Warning',
  answerChangeWarning:
    'Changing either the Number of Models or Parts per Model will remove added answer. Are you sure you want to continue?',
  confirm: 'OK',
  cancel: 'Cancel',
};
