import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warning: 'Varning',
  limitMaxChoicesPerCategory: 'Du har nått gränsen på {maxChoicesPerCategory} svar per område. Om du vill lägga till ett svar måste du först ta bort ett.',
  cancel: 'Avbryt',
  commonCorrectAnswerWithAlternates: 'Obs! Svaret som visas ovan är det vanligaste rätta svaret på uppgiften. Ett eller flera ytterligare rätta svar har också angetts, och även de räknas som rätt.',
  maxChoicesPerCategoryRestriction: 'Om du vill ändra värdet till {maxChoicesPerCategory} får varje kategori ha högst {maxChoicesPerCategory} svarsalternativ.',
} satisfies MessageCatalog;
