import { catalogs } from './i18n/index.js';
import type { MediaUiText } from './types.js';

function nonBlankOverride(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/**
 * The transcript controls' strings in `language`, the chrome language, with the item's non-blank
 * overrides last. A locale whose catalog is not resident yet reads as English.
 */
export function resolveMediaUiText(
  language?: string,
  overrides?: Partial<MediaUiText>
): MediaUiText {
  const i18n = catalogs.forLocale(language);

  return {
    showTranscript: nonBlankOverride(overrides?.showTranscript) ?? i18n.t('showTranscript'),
    hideTranscript: nonBlankOverride(overrides?.hideTranscript) ?? i18n.t('hideTranscript'),
    viewTranscript: nonBlankOverride(overrides?.viewTranscript) ?? i18n.t('viewTranscript'),
  };
}

/** The English strings, with no overrides. */
export const DEFAULT_MEDIA_UI_TEXT: Readonly<MediaUiText> = Object.freeze(resolveMediaUiText());
