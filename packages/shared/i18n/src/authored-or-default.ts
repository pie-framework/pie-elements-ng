// Markup, spacing (`&nbsp;` included) and a short leading label ("Note:") do not tell authored
// text from a shipped default: models store the English default with and without its label.
const comparable = (text: string) =>
  text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;|&#xa0;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[^:：]{1,12}[:：]\s*/, '');

/**
 * Authored text, else the shipped default in `language`.
 *
 * Stored text equal to a shipped default counts as absent. Authoring wrote defaults into models in
 * English, the interface locale or the item's declared language, so those are the locales compared;
 * the caller holds its render until their catalogs are resident.
 */
export function authoredOrDefault(
  text: unknown,
  defaultIn: (locale: string | undefined) => string,
  language?: string,
  itemLanguage?: string
): string {
  const fallback = defaultIn(language);
  if (typeof text !== 'string' || !text.trim()) return fallback;
  const authored = comparable(text);
  const isDefault = [undefined, language, itemLanguage].some(
    (locale) => comparable(defaultIn(locale)) === authored
  );
  return isDefault ? fallback : text;
}
