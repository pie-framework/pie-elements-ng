import { resolveMediaUiText } from '@pie-lib/media-svelte';
import { catalogs } from './i18n/index.js';
import type { VideoStimulusUiText, VideoStimulusUiTextKey } from './types.js';

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

/** The authored overrides delivery applies: the known keys with a non-blank value, else none. */
export function videoStimulusUiTextOverrides(
  overrides: unknown
): Partial<VideoStimulusUiText> | undefined {
  if (overrides === null || typeof overrides !== 'object' || Array.isArray(overrides)) {
    return undefined;
  }
  const source = overrides as Record<string, unknown>;
  const kept: Partial<VideoStimulusUiText> = {};
  for (const key of VIDEO_STIMULUS_UI_TEXT_KEYS) {
    const value = nonBlankOverride(source[key]);
    if (value !== undefined) kept[key] = value;
  }
  return Object.keys(kept).length > 0 ? kept : undefined;
}

/**
 * The learner-facing strings in `language`, the chrome language, with the item's non-blank
 * overrides last. A locale whose catalogs are not resident yet reads as English.
 */
export function resolveVideoStimulusUiText(
  language?: string,
  overrides?: unknown
): VideoStimulusUiText {
  const authored = videoStimulusUiTextOverrides(overrides) ?? {};
  const i18n = catalogs.forLocale(language);

  return {
    ...resolveMediaUiText(language, authored),
    videoLabel: authored.videoLabel ?? i18n.t('videoLabel'),
    transcriptLabel: authored.transcriptLabel ?? i18n.t('transcriptLabel'),
    retrying: authored.retrying ?? i18n.t('retrying'),
    retryingDescription: authored.retryingDescription ?? i18n.t('retryingDescription'),
    trackUnavailable: authored.trackUnavailable ?? i18n.t('trackUnavailable'),
    trackErrorDescription: authored.trackErrorDescription ?? i18n.t('trackErrorDescription'),
    videoUnavailable: authored.videoUnavailable ?? i18n.t('videoUnavailable'),
    missingVideoSource: authored.missingVideoSource ?? i18n.t('missingVideoSource'),
    videoErrorDescription: authored.videoErrorDescription ?? i18n.t('videoErrorDescription'),
    retry: authored.retry ?? i18n.t('retry'),
  };
}
