import Translator from '@pie-lib/translator';

const { translator } = Translator;

/**
 * A learner-facing string in `language`, the model's `language` as the
 * controller emits it. i18next falls back to English for a language or key it
 * does not hold. Values are not HTML-escaped: Svelte escapes what it renders.
 */
export function t(key: string, language?: string, values: Record<string, unknown> = {}): string {
  return translator.t(`translation:mcPopulatedBlank:${key}`, {
    lng: language,
    ...values,
    interpolation: { escapeValue: false },
  });
}

/** A string shared across elements, such as the correct-answer toggle's labels. */
export function tCommon(key: string, language?: string): string {
  return translator.t(`common:${key}`, { lng: language });
}
