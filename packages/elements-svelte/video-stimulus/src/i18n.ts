import { resolveMediaUiText } from '@pie-lib/media-svelte';
import type { VideoStimulusUiText, VideoStimulusUiTextKey } from './types.js';

const DELIVERY_MESSAGES = {
  en: {
    videoLabel: 'Video',
    transcriptLabel: 'Video transcript',
    retrying: 'Trying again…',
    retryingDescription: 'The browser is loading the video again.',
    trackUnavailable: 'Text track unavailable',
    trackErrorDescription: 'A text track could not be loaded. You can retry the video.',
    videoUnavailable: 'Video unavailable',
    missingVideoSource:
      'No playable video source is available. The transcript remains available when provided.',
    videoErrorDescription:
      'Check your connection and try again. The transcript remains available when provided.',
    retry: 'Try again',
  },
  es: {
    videoLabel: 'Video',
    transcriptLabel: 'Transcripción del video',
    retrying: 'Intentando de nuevo…',
    retryingDescription: 'El navegador está cargando el video de nuevo.',
    trackUnavailable: 'Pista de texto no disponible',
    trackErrorDescription:
      'No se pudo cargar una pista de texto. Puede volver a intentar cargar el video.',
    videoUnavailable: 'Video no disponible',
    missingVideoSource:
      'No hay una fuente de video reproducible. La transcripción sigue disponible cuando se proporciona.',
    videoErrorDescription:
      'Compruebe su conexión e inténtelo de nuevo. La transcripción sigue disponible cuando se proporciona.',
    retry: 'Intentar de nuevo',
  },
} as const;

export const VIDEO_STIMULUS_UI_TEXT_KEYS = Object.freeze([
  'showTranscript',
  'hideTranscript',
  'viewTranscript',
  'videoLabel',
  'transcriptLabel',
  'retrying',
  'retryingDescription',
  'trackUnavailable',
  'trackErrorDescription',
  'videoUnavailable',
  'missingVideoSource',
  'videoErrorDescription',
  'retry',
] satisfies VideoStimulusUiTextKey[]);

function nonBlankOverride(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function resolveVideoStimulusUiText(
  language?: string,
  overrides?: unknown
): VideoStimulusUiText {
  const locale = language?.trim().toLowerCase().startsWith('es') ? 'es' : 'en';
  const source =
    overrides !== null && typeof overrides === 'object' && !Array.isArray(overrides)
      ? (overrides as Record<string, unknown>)
      : {};
  const transcript = resolveMediaUiText(language, {
    showTranscript: nonBlankOverride(source.showTranscript),
    hideTranscript: nonBlankOverride(source.hideTranscript),
    viewTranscript: nonBlankOverride(source.viewTranscript),
  });
  const defaults: VideoStimulusUiText = {
    ...transcript,
    ...DELIVERY_MESSAGES[locale],
  };

  return {
    showTranscript: nonBlankOverride(source.showTranscript) ?? defaults.showTranscript,
    hideTranscript: nonBlankOverride(source.hideTranscript) ?? defaults.hideTranscript,
    viewTranscript: nonBlankOverride(source.viewTranscript) ?? defaults.viewTranscript,
    videoLabel: nonBlankOverride(source.videoLabel) ?? defaults.videoLabel,
    transcriptLabel: nonBlankOverride(source.transcriptLabel) ?? defaults.transcriptLabel,
    retrying: nonBlankOverride(source.retrying) ?? defaults.retrying,
    retryingDescription:
      nonBlankOverride(source.retryingDescription) ?? defaults.retryingDescription,
    trackUnavailable: nonBlankOverride(source.trackUnavailable) ?? defaults.trackUnavailable,
    trackErrorDescription:
      nonBlankOverride(source.trackErrorDescription) ?? defaults.trackErrorDescription,
    videoUnavailable: nonBlankOverride(source.videoUnavailable) ?? defaults.videoUnavailable,
    missingVideoSource: nonBlankOverride(source.missingVideoSource) ?? defaults.missingVideoSource,
    videoErrorDescription:
      nonBlankOverride(source.videoErrorDescription) ?? defaults.videoErrorDescription,
    retry: nonBlankOverride(source.retry) ?? defaults.retry,
  };
}
