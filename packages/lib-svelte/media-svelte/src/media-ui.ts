import type { MediaUiText } from './types.js';

export const DEFAULT_MEDIA_UI_TEXT: Readonly<MediaUiText> = Object.freeze({
  showTranscript: 'Show transcript',
  hideTranscript: 'Hide transcript',
  viewTranscript: 'View transcript',
});

const SPANISH_MEDIA_UI_TEXT: Readonly<MediaUiText> = Object.freeze({
  showTranscript: 'Mostrar transcripción',
  hideTranscript: 'Ocultar transcripción',
  viewTranscript: 'Ver transcripción',
});

function nonBlankOverride(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function resolveMediaUiText(
  language?: string,
  overrides?: Partial<MediaUiText>
): MediaUiText {
  const baseLanguage = language?.trim().toLowerCase().split(/[-_]/, 1)[0];
  const defaults = baseLanguage === 'es' ? SPANISH_MEDIA_UI_TEXT : DEFAULT_MEDIA_UI_TEXT;

  return {
    showTranscript: nonBlankOverride(overrides?.showTranscript) ?? defaults.showTranscript,
    hideTranscript: nonBlankOverride(overrides?.hideTranscript) ?? defaults.hideTranscript,
    viewTranscript: nonBlankOverride(overrides?.viewTranscript) ?? defaults.viewTranscript,
  };
}
