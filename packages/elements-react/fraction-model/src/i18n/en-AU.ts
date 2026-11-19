import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  modelLabel: {
    one: 'Model {index} of {total}: {selected} of {count} part selected',
    other: 'Model {index} of {total}: {selected} of {count} parts selected',
  },
  numberOfModels: 'Number of Models',
  partsPerModel: 'Parts per Model',
  warningTitle: 'Warning',
  answerChangeWarning: 'Changing either the Number of Models or Parts per Model will remove added answer. Are you sure you want to continue?',
  confirm: 'OK',
  cancel: 'Cancel',
} satisfies MessageCatalog;
