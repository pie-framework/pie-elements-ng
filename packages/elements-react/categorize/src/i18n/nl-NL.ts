import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warning: 'Waarschuwing',
  limitMaxChoicesPerCategory: 'Je hebt het maximum van {maxChoicesPerCategory} antwoorden per vak bereikt. Haal eerst een antwoord weg om een ander antwoord toe te voegen.',
  cancel: 'Annuleren',
  commonCorrectAnswerWithAlternates: 'Opmerking: het antwoord hierboven is het meest voorkomende juiste antwoord voor deze opgave. Er zijn ook een of meer andere juiste antwoorden vastgelegd, en die worden ook als juist herkend.',
  maxChoicesPerCategoryRestriction: 'Om deze waarde in {maxChoicesPerCategory} te wijzigen, mag het aantal antwoordkeuzes per categorie niet hoger zijn dan {maxChoicesPerCategory}.',
} satisfies MessageCatalog;
