import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  modelLabel: {
    one: 'Modelul {index} din {total}: {selected} din {count} parte selectată',
    few: 'Modelul {index} din {total}: {selected} din {count} părți selectate',
    other: 'Modelul {index} din {total}: {selected} din {count} de părți selectate',
  },
  numberOfModels: 'Numărul de modele',
  partsPerModel: 'Părți per model',
  warningTitle: 'Avertisment',
  answerChangeWarning: 'Dacă modifici numărul de modele sau de părți per model, răspunsul adăugat va fi eliminat. Sigur vrei să continui?',
  confirm: 'OK',
  cancel: 'Anulează',
} satisfies MessageCatalog;
