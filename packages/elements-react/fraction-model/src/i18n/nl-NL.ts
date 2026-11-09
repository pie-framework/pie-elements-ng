import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  modelLabel: {
    one: 'Model {index} van {total}: {selected} van {count} deel geselecteerd',
    other: 'Model {index} van {total}: {selected} van {count} delen geselecteerd',
  },
  numberOfModels: 'Aantal modellen',
  partsPerModel: 'Delen per model',
  warningTitle: 'Waarschuwing',
  answerChangeWarning: 'Bij het wijzigen van het aantal modellen of delen per model wordt het toegevoegde antwoord verwijderd. Toch doorgaan?',
  confirm: 'OK',
  cancel: 'Annuleren',
} satisfies MessageCatalog;
