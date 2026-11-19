import { canonicalLanguageTag, DEFAULT_LOCALE } from '@pie-element/shared-i18n';

export interface LanguageChoice {
  value: string;
  label: string;
}

/**
 * A tag's language and script, so regional variants of one written language compare equal: `en`
 * and `en-GB` are one choice, `zh-TW` and `zh-CN` two.
 */
export const writtenLanguage = (tag: string): string => {
  try {
    const locale = new Intl.Locale(tag).maximize();
    return `${locale.language}-${locale.script}`;
  } catch {
    return tag.toLowerCase();
  }
};

const languageLabel = (tag: string, displayLocale: string): string => {
  try {
    return new Intl.DisplayNames([displayLocale], { type: 'language' }).of(tag) ?? tag;
  } catch {
    return tag;
  }
};

/**
 * The languages the toolbar offers for marking text: the item's content language, then the
 * interface locale, each once by written language and labelled in the interface locale.
 */
export function contentLanguageChoices(
  contentLanguage: string | null | undefined,
  interfaceLocale: string | null | undefined,
): LanguageChoice[] {
  const tags = [contentLanguage, interfaceLocale].map((tag) => canonicalLanguageTag(tag)).filter(Boolean) as string[];
  const unique = tags.filter(
    (tag, index) => !tags.slice(0, index).some((other) => writtenLanguage(other) === writtenLanguage(tag)),
  );
  const displayLocale = canonicalLanguageTag(interfaceLocale) ?? DEFAULT_LOCALE;
  return unique.map((value) => ({ value, label: languageLabel(value, displayLocale) }));
}
