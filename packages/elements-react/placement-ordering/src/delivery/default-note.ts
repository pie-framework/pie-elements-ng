import { catalogs } from '../i18n/index.js';

// Markup, spacing and a leading "Note:" label do not tell an authored note from a shipped default:
// models store the English default with and without its label.
const comparable = (text: string) =>
  text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[^:：]{1,12}[:：]\s*/, '');

/**
 * The note shown with the correct answer: the authored one, else the alternates default in `language`.
 *
 * A stored note equal to a shipped default counts as absent. Defaults were written into models in
 * the item's declared language or in English, so those are the locales compared; the element holds
 * its render until both catalogs are resident.
 */
export function alternatesNote(note: unknown, language?: string, itemLanguage?: string): string {
  const fallback = catalogs.forLocale(language).t('commonCorrectAnswerWithAlternates');
  if (typeof note !== 'string' || !note.trim()) return fallback;
  const authored = comparable(note);
  const isDefault = [undefined, language, itemLanguage].some(
    (locale) => comparable(catalogs.forLocale(locale).t('commonCorrectAnswerWithAlternates')) === authored,
  );
  return isDefault ? fallback : note;
}
