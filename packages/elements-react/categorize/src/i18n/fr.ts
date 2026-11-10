import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warning: 'Avertissement',
  limitMaxChoicesPerCategory: 'Tu as atteint la limite de {maxChoicesPerCategory} réponses par zone. Pour ajouter une autre réponse, il faut d’abord en retirer une.',
  cancel: 'Annuler',
  commonCorrectAnswerWithAlternates: 'Remarque : la réponse affichée ci-dessus est la bonne réponse la plus courante pour cette question. Une ou plusieurs autres bonnes réponses sont également définies et seront aussi reconnues comme correctes.',
  maxChoicesPerCategoryRestriction: 'Pour passer cette valeur à {maxChoicesPerCategory}, chaque catégorie doit contenir au plus {maxChoicesPerCategory} choix de réponse.',
} satisfies MessageCatalog;
