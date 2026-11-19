import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  modelLabel: {
    one: 'Modell {index} av {total}: {selected} av {count} del markerad',
    other: 'Modell {index} av {total}: {selected} av {count} delar markerade',
  },
  numberOfModels: 'Antal modeller',
  partsPerModel: 'Delar per modell',
  warningTitle: 'Varning',
  answerChangeWarning: 'Om du ändrar antalet modeller eller delar per modell tas det tillagda svaret bort. Vill du fortsätta?',
  confirm: 'OK',
  cancel: 'Avbryt',
} satisfies MessageCatalog;
