import Translator from '@pie-lib/translator';

const { translator } = Translator;

/**
 * A learner-facing string in `language`, the model's `language`. i18next falls
 * back to English for a language or key it does not hold.
 */
export function t(key: string, language?: string): string {
  return translator.t(`translation:simpleCloze:${key}`, { lng: language });
}

/** A string shared across elements, such as the correct-answer toggle's labels. */
export function tCommon(key: string, language?: string): string {
  return translator.t(`common:${key}`, { lng: language });
}
