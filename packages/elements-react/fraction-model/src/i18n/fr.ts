import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  modelLabel: {
    one: 'Modèle {index} sur {total} : {selected} sur {count} partie sélectionnée',
    many: 'Modèle {index} sur {total} : {selected} sur {count} parties sélectionnées',
    other: 'Modèle {index} sur {total} : {selected} sur {count} parties sélectionnées',
  },
  numberOfModels: 'Nombre de modèles',
  partsPerModel: 'Parties par modèle',
  warningTitle: 'Avertissement',
  answerChangeWarning: 'Modifier le nombre de modèles ou le nombre de parties par modèle supprimera la réponse ajoutée. Voulez-vous vraiment continuer ?',
  confirm: 'OK',
  cancel: 'Annuler',
} satisfies MessageCatalog;
