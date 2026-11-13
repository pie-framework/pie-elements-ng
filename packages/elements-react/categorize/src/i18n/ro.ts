import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warning: 'Avertisment',
  limitMaxChoicesPerCategory: 'Ai atins limita de răspunsuri pe zonă ({maxChoicesPerCategory}). Pentru a adăuga un alt răspuns, trebuie mai întâi să elimini unul.',
  cancel: 'Anulează',
  commonCorrectAnswerWithAlternates: 'Notă: Răspunsul afișat mai sus este cel mai frecvent răspuns corect pentru acest item. Sunt definite și unul sau mai multe răspunsuri corecte suplimentare, care vor fi de asemenea recunoscute drept corecte.',
  maxChoicesPerCategoryRestriction: 'Pentru a schimba această valoare în {maxChoicesPerCategory}, numărul variantelor de răspuns din fiecare categorie nu poate depăși {maxChoicesPerCategory}.',
} satisfies MessageCatalog;
