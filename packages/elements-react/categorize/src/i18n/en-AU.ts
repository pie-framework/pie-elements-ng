import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warning: 'Warning',
  limitMaxChoicesPerCategory: "You've reached the limit of {maxChoicesPerCategory} responses per area. To add another response, one must first be removed.",
  cancel: 'Cancel',
  commonCorrectAnswerWithAlternates: 'Note: The answer shown above is the most common correct answer for this item. One or more additional correct answers are also defined, and will also be recognized as correct.',
} satisfies MessageCatalog;
