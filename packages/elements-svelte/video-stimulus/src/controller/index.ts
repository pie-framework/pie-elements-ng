import type { MediaSource, TextTrackRef, TranscriptRef } from '@pie-element/shared-types';
import { isSafeMediaSrc, normalizeMediaSources } from '@pie-players/pie-assessment-toolkit';
import { resolveVideoStimulusUiText, VIDEO_STIMULUS_UI_TEXT_KEYS } from '../i18n.js';
import type {
  AccessibilityFinding,
  AccessibilityReview,
  VideoStimulusAccessibilityProfile,
  VideoStimulusEnvironment,
  VideoStimulusFieldKey,
  VideoStimulusMediaViewModel,
  VideoStimulusModel,
  VideoStimulusPresentation,
  VideoStimulusUiText,
  VideoStimulusUiTextKey,
  VideoStimulusValidationErrors,
  VideoStimulusViewModel,
} from '../types.js';

export type {
  AccessibilityFinding,
  AccessibilityReview,
  AudioContentDeclaration,
  CaptionSupportDeclaration,
  VideoStimulusAccessibilityProfile,
  VideoStimulusEnvironment,
  VideoStimulusFieldKey,
  VideoStimulusModel,
  VideoStimulusPresentation,
  VideoStimulusUiText,
  VideoStimulusUiTextKey,
  VideoStimulusValidationErrors,
  VideoStimulusViewModel,
  VisualSupportDeclaration,
} from '../types.js';

const TRACK_KINDS = new Set(['captions', 'subtitles', 'descriptions', 'chapters', 'metadata']);
const AUDIO_CONTENT_VALUES = new Set(['unknown', 'none', 'meaningful']);
const CAPTION_SUPPORT_VALUES = new Set(['unknown', 'notRequired', 'track', 'open', 'missing']);
const VISUAL_SUPPORT_VALUES = new Set(['unknown', 'notMeaningful', 'described', 'missing']);
const GENERIC_LABELS = new Set(['media', 'untitled', 'video', 'video stimulus']);
const COMMON_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg']);
const UI_TEXT_KEYS = new Set<string>(VIDEO_STIMULUS_UI_TEXT_KEYS);

const DEFAULT_PRESENTATION: Required<VideoStimulusPresentation> = {
  showLabel: true,
  showDescription: true,
  transcriptInitiallyExpanded: false,
};

const DEFAULT_ACCESSIBILITY_PROFILE: Required<VideoStimulusAccessibilityProfile> = {
  audioContent: 'unknown',
  captionSupport: 'unknown',
  visualSupport: 'unknown',
};

const DEFAULT_MODEL: VideoStimulusModel = {
  element: 'video-stimulus',
  media: {
    version: 1,
    id: '',
    kind: 'video',
    sources: [],
    label: '',
    lang: '',
  },
  language: 'en',
  presentation: DEFAULT_PRESENTATION,
  accessibilityProfile: DEFAULT_ACCESSIBILITY_PROFILE,
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function trimmed(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const result = value.trim();
  return result || undefined;
}

function finitePositive(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function finitePositiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

function isValidLanguageTag(value: unknown): value is string {
  const language = trimmed(value);
  if (!language) return false;
  try {
    return Intl.getCanonicalLocales(language).length === 1;
  } catch {
    return false;
  }
}

function isBlobUrl(value: unknown): boolean {
  return typeof value === 'string' && value.trim().toLowerCase().startsWith('blob:');
}

function isSafeDurableUrl(value: unknown): value is string {
  return isSafeMediaSrc(value) && !isBlobUrl(value);
}

function isSafeTranscriptSrc(value: unknown): value is string {
  if (!isSafeMediaSrc(value)) return false;
  const src = value.trim();
  if (src.startsWith('//')) return true;
  const scheme = src.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  return scheme === undefined || scheme === 'http' || scheme === 'https';
}

function setError(
  errors: VideoStimulusValidationErrors,
  field: VideoStimulusFieldKey,
  message: string
): void {
  if (!errors[field]) errors[field] = message;
}

function cloneSource(source: MediaSource): MediaSource {
  return { ...source };
}

function cloneTrack(track: TextTrackRef): TextTrackRef {
  return { ...track };
}

function cloneTranscript(transcript: TranscriptRef): TranscriptRef {
  return { ...transcript };
}

function cloneModel(model: VideoStimulusModel): VideoStimulusModel {
  return {
    ...model,
    media: {
      ...model.media,
      sources: Array.isArray(model.media.sources) ? model.media.sources.map(cloneSource) : [],
      tracks: Array.isArray(model.media.tracks) ? model.media.tracks.map(cloneTrack) : undefined,
      transcript: model.media.transcript ? cloneTranscript(model.media.transcript) : undefined,
    },
    presentation: model.presentation ? { ...model.presentation } : undefined,
    accessibilityProfile: model.accessibilityProfile
      ? { ...model.accessibilityProfile }
      : undefined,
    uiText: model.uiText ? { ...model.uiText } : undefined,
  };
}

export function createDefaultModel(
  overrides: Partial<VideoStimulusModel> = {}
): VideoStimulusModel {
  const suppliedMedia = overrides.media;
  const media = suppliedMedia
    ? {
        ...DEFAULT_MODEL.media,
        ...suppliedMedia,
        sources: Array.isArray(suppliedMedia.sources) ? suppliedMedia.sources.map(cloneSource) : [],
        tracks: Array.isArray(suppliedMedia.tracks)
          ? suppliedMedia.tracks.map(cloneTrack)
          : undefined,
        transcript: suppliedMedia.transcript
          ? cloneTranscript(suppliedMedia.transcript)
          : undefined,
      }
    : {
        ...DEFAULT_MODEL.media,
        sources: [],
      };

  return cloneModel({
    ...DEFAULT_MODEL,
    ...overrides,
    media,
    presentation: {
      ...DEFAULT_PRESENTATION,
      ...(overrides.presentation ?? {}),
    },
    accessibilityProfile: {
      ...DEFAULT_ACCESSIBILITY_PROFILE,
      ...(overrides.accessibilityProfile ?? {}),
    },
    uiText: overrides.uiText ? { ...overrides.uiText } : undefined,
  });
}

function validateOptionalUrl(
  value: unknown,
  field: VideoStimulusFieldKey,
  errors: VideoStimulusValidationErrors,
  durable: boolean
): void {
  if (value === undefined || value === null || value === '') return;
  if (!isSafeMediaSrc(value)) {
    setError(errors, field, 'Enter a safe HTTP(S), data, blob, or relative media URL.');
  } else if (durable && isBlobUrl(value)) {
    setError(errors, field, 'Blob URLs are temporary and cannot be published.');
  }
}

function validateSourceRows(
  rawSources: unknown,
  errors: VideoStimulusValidationErrors,
  strict: boolean
): void {
  if (rawSources === undefined) return;
  if (!Array.isArray(rawSources)) {
    setError(errors, 'media.sources', 'Video sources must be an array.');
    return;
  }

  const seen = new Set<string>();
  rawSources.forEach((rawSource, index) => {
    if (!isRecord(rawSource)) {
      setError(errors, `media.sources.${index}.src`, 'Source must be an object with a URL.');
      return;
    }

    const src = trimmed(rawSource.src);
    if (src) {
      if (!isSafeMediaSrc(src)) {
        setError(
          errors,
          `media.sources.${index}.src`,
          'Enter a safe HTTP(S), data, blob, or relative video URL.'
        );
      } else if (strict && isBlobUrl(src)) {
        setError(
          errors,
          `media.sources.${index}.src`,
          'Blob URLs are temporary and cannot be published.'
        );
      } else if (seen.has(src)) {
        setError(errors, `media.sources.${index}.src`, 'Each source URL must be unique.');
      }
      seen.add(src);
    } else if (strict) {
      setError(errors, `media.sources.${index}.src`, 'A source URL is required.');
    }

    const type = trimmed(rawSource.type);
    if (type && !/^video\/[a-z0-9.+-]+$/i.test(type)) {
      setError(errors, `media.sources.${index}.type`, 'MIME type must start with "video/".');
    }

    for (const field of ['width', 'height'] as const) {
      if (rawSource[field] !== undefined && finitePositiveInteger(rawSource[field]) === undefined) {
        setError(
          errors,
          `media.sources.${index}.${field}`,
          `${field === 'width' ? 'Width' : 'Height'} must be a positive whole number.`
        );
      }
    }
    if (rawSource.bitrate !== undefined && finitePositive(rawSource.bitrate) === undefined) {
      setError(errors, `media.sources.${index}.bitrate`, 'Bitrate must be a positive number.');
    }
  });
}

function validateTrackRows(
  rawTracks: unknown,
  errors: VideoStimulusValidationErrors,
  strict: boolean
): void {
  if (rawTracks === undefined) return;
  if (!Array.isArray(rawTracks)) {
    setError(errors, 'media.tracks', 'Text tracks must be an array.');
    return;
  }

  let defaultCount = 0;
  const seenSources = new Set<string>();
  rawTracks.forEach((rawTrack, index) => {
    if (!isRecord(rawTrack)) {
      setError(errors, `media.tracks.${index}.src`, 'Track must be an object.');
      return;
    }

    const src = trimmed(rawTrack.src);
    if (!src) {
      setError(errors, `media.tracks.${index}.src`, 'Track URL is required.');
    } else if (!isSafeMediaSrc(src)) {
      setError(errors, `media.tracks.${index}.src`, 'Enter a safe text-track URL.');
    } else if (strict && isBlobUrl(src)) {
      setError(
        errors,
        `media.tracks.${index}.src`,
        'Blob URLs are temporary and cannot be published.'
      );
    } else if (seenSources.has(src)) {
      setError(errors, `media.tracks.${index}.src`, 'Each text-track URL must be unique.');
    }
    if (src) seenSources.add(src);

    if (typeof rawTrack.kind !== 'string' || !TRACK_KINDS.has(rawTrack.kind)) {
      setError(
        errors,
        `media.tracks.${index}.kind`,
        'Choose captions, subtitles, descriptions, chapters, or metadata.'
      );
    }
    if (!isValidLanguageTag(rawTrack.lang)) {
      setError(errors, `media.tracks.${index}.lang`, 'Enter a valid BCP 47 language tag.');
    }
    if (!trimmed(rawTrack.label)) {
      setError(errors, `media.tracks.${index}.label`, 'Track label is required.');
    }
    if (rawTrack.default !== undefined && typeof rawTrack.default !== 'boolean') {
      setError(errors, `media.tracks.${index}.default`, 'Default must be true or false.');
    }
    if (rawTrack.default === true) defaultCount += 1;
  });

  if (defaultCount > 1) {
    setError(errors, 'media.tracks', 'Only one text track can be the default.');
  }
}

function hasReadableTranscriptHtml(html: string): boolean {
  const withoutBlockedContent = html.replace(
    /<(script|style|form|iframe|object|embed|audio|video)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    ' '
  );
  return Boolean(
    withoutBlockedContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function normalizeTranscript(raw: unknown): TranscriptRef | undefined {
  if (!isRecord(raw)) return undefined;
  const transcript: TranscriptRef = {};
  const src = trimmed(raw.src);
  const html = trimmed(raw.html);
  const plainText = trimmed(raw.plainText);
  if (src && isSafeTranscriptSrc(src)) transcript.src = src;
  // Inline HTML remains opaque authored data in the DOM-free controller. The
  // shared Transcript component owns sanitization immediately before rendering.
  if (html && hasReadableTranscriptHtml(html)) transcript.html = html;
  if (plainText) transcript.plainText = plainText;
  if (isValidLanguageTag(raw.lang)) transcript.lang = raw.lang.trim();
  return transcript.src || transcript.html || transcript.plainText ? transcript : undefined;
}

function validateTranscript(
  rawTranscript: unknown,
  errors: VideoStimulusValidationErrors,
  strict: boolean
): void {
  if (rawTranscript === undefined) return;
  if (!isRecord(rawTranscript)) {
    setError(errors, 'media.transcript', 'Transcript must be an object.');
    return;
  }

  if (trimmed(rawTranscript.src)) {
    if (strict && isBlobUrl(rawTranscript.src)) {
      setError(errors, 'media.transcript.src', 'Blob URLs are temporary and cannot be published.');
    } else if (!isSafeTranscriptSrc(rawTranscript.src)) {
      setError(errors, 'media.transcript.src', 'Enter a safe HTTP(S) or relative transcript URL.');
    }
  }
  if (rawTranscript.html !== undefined && typeof rawTranscript.html !== 'string') {
    setError(errors, 'media.transcript.html', 'Inline transcript HTML must be text.');
  }
  if (rawTranscript.plainText !== undefined && typeof rawTranscript.plainText !== 'string') {
    setError(errors, 'media.transcript.plainText', 'Plain transcript content must be text.');
  }
  if (rawTranscript.lang !== undefined && !isValidLanguageTag(rawTranscript.lang)) {
    setError(errors, 'media.transcript.lang', 'Enter a valid BCP 47 language tag.');
  }

  const hasSuppliedContent = Boolean(
    trimmed(rawTranscript.src) || trimmed(rawTranscript.html) || trimmed(rawTranscript.plainText)
  );
  if (strict && !hasSuppliedContent) {
    setError(
      errors,
      'media.transcript',
      'Provide inline HTML, plain text, or an external transcript URL.'
    );
  }
  if (trimmed(rawTranscript.html) && !hasReadableTranscriptHtml(String(rawTranscript.html))) {
    setError(
      errors,
      'media.transcript.html',
      'Inline transcript HTML must contain safe readable content.'
    );
  }
}

function validateUiText(rawUiText: unknown, errors: VideoStimulusValidationErrors): void {
  if (rawUiText === undefined) return;
  if (!isRecord(rawUiText)) {
    setError(errors, 'uiText', 'Learner UI text overrides must be an object.');
    return;
  }

  for (const [key, value] of Object.entries(rawUiText)) {
    if (!UI_TEXT_KEYS.has(key)) {
      setError(errors, 'uiText', `Unknown learner UI text key: ${key}.`);
      continue;
    }
    if (!trimmed(value)) {
      setError(
        errors,
        `uiText.${key as VideoStimulusUiTextKey}`,
        'Learner UI text overrides must be non-empty strings.'
      );
    }
  }
}

function validateAccessibilityShape(
  rawProfile: unknown,
  errors: VideoStimulusValidationErrors
): void {
  if (rawProfile === undefined) return;
  if (!isRecord(rawProfile)) {
    setError(
      errors,
      'accessibilityProfile.audioContent',
      'Accessibility profile must be an object.'
    );
    return;
  }
  if (
    rawProfile.audioContent !== undefined &&
    (typeof rawProfile.audioContent !== 'string' ||
      !AUDIO_CONTENT_VALUES.has(rawProfile.audioContent))
  ) {
    setError(errors, 'accessibilityProfile.audioContent', 'Choose unknown, none, or meaningful.');
  }
  if (
    rawProfile.captionSupport !== undefined &&
    (typeof rawProfile.captionSupport !== 'string' ||
      !CAPTION_SUPPORT_VALUES.has(rawProfile.captionSupport))
  ) {
    setError(
      errors,
      'accessibilityProfile.captionSupport',
      'Choose unknown, not required, track, open captions, or missing.'
    );
  }
  if (
    rawProfile.visualSupport !== undefined &&
    (typeof rawProfile.visualSupport !== 'string' ||
      !VISUAL_SUPPORT_VALUES.has(rawProfile.visualSupport))
  ) {
    setError(
      errors,
      'accessibilityProfile.visualSupport',
      'Choose unknown, not meaningful, described, or missing.'
    );
  }
}

export function validateDraft(model: unknown): VideoStimulusValidationErrors {
  const errors: VideoStimulusValidationErrors = {};
  if (model === undefined || model === null) return errors;
  if (!isRecord(model)) {
    setError(errors, 'model', 'Model must be an object.');
    return errors;
  }

  if (model.language !== undefined && !isValidLanguageTag(model.language)) {
    setError(errors, 'language', 'Enter a valid BCP 47 learner UI language.');
  }
  validateUiText(model.uiText, errors);

  if (model.media === undefined || model.media === null) return errors;
  if (!isRecord(model.media)) {
    setError(errors, 'media', 'Media must be an object.');
    return errors;
  }

  const media = model.media;
  if (media.version !== undefined && media.version !== 1) {
    setError(errors, 'media.version', 'Media asset version must be 1.');
  }
  if (media.kind !== undefined && media.kind !== 'video') {
    setError(errors, 'media.kind', 'Media kind must be "video".');
  }
  if (media.lang !== undefined && media.lang !== '' && !isValidLanguageTag(media.lang)) {
    setError(errors, 'media.lang', 'Enter a valid BCP 47 media language.');
  }
  validateSourceRows(media.sources, errors, false);
  validateOptionalUrl(media.poster, 'media.poster', errors, false);
  validateOptionalUrl(media.thumbnail, 'media.thumbnail', errors, false);
  if (media.durationSeconds !== undefined && finitePositive(media.durationSeconds) === undefined) {
    setError(errors, 'media.durationSeconds', 'Duration must be a positive number of seconds.');
  }
  validateTrackRows(media.tracks, errors, false);
  validateTranscript(media.transcript, errors, false);
  validateAccessibilityShape(model.accessibilityProfile, errors);
  return errors;
}

function validCaptionTrackCount(media: UnknownRecord | undefined): number {
  if (!media || !Array.isArray(media.tracks)) return 0;
  return media.tracks.filter(
    (track) =>
      isRecord(track) &&
      track.kind === 'captions' &&
      isSafeMediaSrc(track.src) &&
      isValidLanguageTag(track.lang) &&
      Boolean(trimmed(track.label))
  ).length;
}

function transcriptFromMedia(media: UnknownRecord | undefined): TranscriptRef | undefined {
  return media ? normalizeTranscript(media.transcript) : undefined;
}

function addWarning(
  warnings: AccessibilityFinding[],
  field: VideoStimulusFieldKey,
  message: string
): void {
  if (!warnings.some((warning) => warning.field === field && warning.message === message)) {
    warnings.push({ field, message });
  }
}

export function reviewAccessibility(model: unknown): AccessibilityReview {
  const errors: VideoStimulusValidationErrors = {};
  const warnings: AccessibilityFinding[] = [];
  const root = isRecord(model) ? model : undefined;
  const media = root && isRecord(root.media) ? root.media : undefined;
  const profile = root && isRecord(root.accessibilityProfile) ? root.accessibilityProfile : {};
  const audioContent = profile.audioContent;
  const captionSupport = profile.captionSupport;
  const visualSupport = profile.visualSupport;
  const captionTracks = validCaptionTrackCount(media);

  if (audioContent === undefined || audioContent === 'unknown') {
    setError(
      errors,
      'accessibilityProfile.audioContent',
      'Review whether the video contains meaningful synchronized audio.'
    );
  }
  if (captionSupport === undefined || captionSupport === 'unknown') {
    setError(
      errors,
      'accessibilityProfile.captionSupport',
      'Resolve how captions are provided before publishing.'
    );
  }
  if (visualSupport === undefined || visualSupport === 'unknown') {
    setError(
      errors,
      'accessibilityProfile.visualSupport',
      'Review whether important visual information is described in the audio.'
    );
  }

  if (audioContent === 'meaningful') {
    if (captionSupport === 'missing' || captionSupport === 'notRequired') {
      setError(
        errors,
        'accessibilityProfile.captionSupport',
        'Meaningful synchronized audio requires captions.'
      );
    }
    if (captionSupport === 'track' && captionTracks === 0) {
      setError(
        errors,
        'accessibilityProfile.captionSupport',
        'The captions-track declaration requires a complete captions track.'
      );
    }
  }

  if (visualSupport === 'missing') {
    setError(
      errors,
      'accessibilityProfile.visualSupport',
      'Important visual information must be described in the main or integrated audio.'
    );
  }

  const transcript = transcriptFromMedia(media);
  if (!transcript) {
    addWarning(
      warnings,
      'media.transcript',
      'Add a transcript so content remains available when playback or hearing access is limited.'
    );
  } else if (transcript.src && !transcript.html && !transcript.plainText) {
    addWarning(
      warnings,
      'media.transcript.src',
      'The transcript is external-only; verify that the linked resource remains available and accessible.'
    );
  }

  const tracks = media && Array.isArray(media.tracks) ? media.tracks : [];
  const hasSubtitles = tracks.some((track) => isRecord(track) && track.kind === 'subtitles');
  if (hasSubtitles && captionTracks === 0) {
    addWarning(
      warnings,
      'media.tracks',
      'Subtitles do not automatically include speakers and meaningful sounds; add captions when audio is meaningful.'
    );
  }

  const label = trimmed(media?.label)?.toLowerCase();
  if (label && GENERIC_LABELS.has(label)) {
    addWarning(warnings, 'media.label', 'Use a specific label that identifies the video content.');
  }

  const sources = media && Array.isArray(media.sources) ? media.sources : [];
  sources.forEach((source, index) => {
    if (!isRecord(source)) return;
    const type = trimmed(source.type)?.toLowerCase();
    if (!type) {
      addWarning(
        warnings,
        `media.sources.${index}.type`,
        'Declare the video MIME type to improve browser source selection.'
      );
    } else if (/^video\//.test(type) && !COMMON_VIDEO_TYPES.has(type)) {
      addWarning(
        warnings,
        `media.sources.${index}.type`,
        'Verify this video encoding in all supported browsers.'
      );
    }
  });

  if (captionSupport === 'track' || captionSupport === 'open') {
    addWarning(
      warnings,
      'accessibilityProfile.captionSupport',
      'Manually review caption timing, accuracy, speaker identification, and meaningful sounds.'
    );
  }
  if (visualSupport === 'described') {
    addWarning(
      warnings,
      'accessibilityProfile.visualSupport',
      'Manually verify that the integrated audio describes every important visual detail.'
    );
  }

  return { errors, warnings };
}

export function validate(model: unknown): VideoStimulusValidationErrors {
  const errors: VideoStimulusValidationErrors = { ...validateDraft(model) };
  if (!isRecord(model)) {
    setError(errors, 'model', 'Model must be an object.');
    return errors;
  }
  if (!isRecord(model.media)) {
    setError(errors, 'media', 'Media is required.');
    return errors;
  }

  const media = model.media;
  if (media.version !== 1) {
    setError(errors, 'media.version', 'Media asset version must be 1.');
  }
  if (media.kind !== 'video') {
    setError(errors, 'media.kind', 'Media kind must be "video".');
  }
  if (!trimmed(media.id)) setError(errors, 'media.id', 'Asset ID is required.');
  if (!trimmed(media.label)) setError(errors, 'media.label', 'Video label is required.');
  if (!isValidLanguageTag(media.lang)) {
    setError(errors, 'media.lang', 'A valid BCP 47 media language is required.');
  }
  if (model.language !== undefined && !isValidLanguageTag(model.language)) {
    setError(errors, 'language', 'Enter a valid BCP 47 learner UI language.');
  }

  validateSourceRows(media.sources, errors, true);
  const playableSources = Array.isArray(media.sources)
    ? media.sources.filter((source) => isRecord(source) && isSafeDurableUrl(source.src))
    : [];
  if (playableSources.length === 0) {
    setError(errors, 'media.sources', 'At least one safe, durable video source is required.');
  }

  validateOptionalUrl(media.poster, 'media.poster', errors, true);
  validateOptionalUrl(media.thumbnail, 'media.thumbnail', errors, true);
  validateTrackRows(media.tracks, errors, true);
  validateTranscript(media.transcript, errors, true);

  const accessibility = reviewAccessibility(model);
  for (const [field, message] of Object.entries(accessibility.errors)) {
    if (message) setError(errors, field as VideoStimulusFieldKey, message);
  }
  return errors;
}

function normalizeSources(raw: unknown): MediaSource[] {
  const normalized = normalizeMediaSources(raw);
  if (!Array.isArray(raw)) return [];
  return normalized.map((source: MediaSource) => {
    const original = raw.find((entry) => isRecord(entry) && trimmed(entry.src) === source.src);
    const candidate = isRecord(original) ? original : {};
    const safe: MediaSource = { src: source.src };
    const type = trimmed(source.type);
    if (type && /^video\/[a-z0-9.+-]+$/i.test(type)) safe.type = type;
    const width = finitePositiveInteger(candidate.width);
    const height = finitePositiveInteger(candidate.height);
    const bitrate = finitePositive(candidate.bitrate);
    if (width !== undefined) safe.width = width;
    if (height !== undefined) safe.height = height;
    if (bitrate !== undefined) safe.bitrate = bitrate;
    return safe;
  });
}

function normalizeTracks(raw: unknown): TextTrackRef[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const tracks: TextTrackRef[] = [];
  const seenSources = new Set<string>();
  let hasDefault = false;
  for (const candidate of raw) {
    if (!isRecord(candidate)) continue;
    const src = trimmed(candidate.src);
    const label = trimmed(candidate.label);
    if (
      !src ||
      seenSources.has(src) ||
      !isSafeMediaSrc(src) ||
      typeof candidate.kind !== 'string' ||
      !TRACK_KINDS.has(candidate.kind) ||
      !isValidLanguageTag(candidate.lang) ||
      !label
    ) {
      continue;
    }
    seenSources.add(src);
    const useDefault = candidate.default === true && !hasDefault;
    if (useDefault) hasDefault = true;
    tracks.push({
      src,
      kind: candidate.kind as TextTrackRef['kind'],
      lang: candidate.lang.trim(),
      label,
      ...(useDefault ? { default: true } : {}),
    });
  }
  return tracks.length > 0 ? tracks : undefined;
}

function normalizeMedia(raw: unknown): VideoStimulusMediaViewModel {
  const media = isRecord(raw) && raw.version === 1 && raw.kind === 'video' ? raw : {};
  const poster = trimmed(media.poster);
  const thumbnail = trimmed(media.thumbnail);
  const description = trimmed(media.description);
  const lang = isValidLanguageTag(media.lang) ? media.lang.trim() : undefined;
  const durationSeconds = finitePositive(media.durationSeconds);
  const tracks = normalizeTracks(media.tracks);
  const transcript = normalizeTranscript(media.transcript);
  return {
    version: 1,
    id: trimmed(media.id) ?? '',
    kind: 'video',
    sources: normalizeSources(media.sources),
    label: trimmed(media.label) ?? '',
    ...(poster && isSafeMediaSrc(poster) ? { poster } : {}),
    ...(thumbnail && isSafeMediaSrc(thumbnail) ? { thumbnail } : {}),
    ...(description ? { description } : {}),
    ...(lang ? { lang } : {}),
    ...(durationSeconds !== undefined ? { durationSeconds } : {}),
    ...(tracks ? { tracks } : {}),
    ...(transcript ? { transcript } : {}),
  };
}

function resolveUiText(language: string, overrides: unknown): VideoStimulusUiText {
  return resolveVideoStimulusUiText(language, overrides);
}

export function model(
  question: unknown,
  _session: unknown,
  environment: VideoStimulusEnvironment = {}
): VideoStimulusViewModel {
  const root = isRecord(question) ? question : {};
  const language = isValidLanguageTag(root.language) ? root.language.trim() : 'en';
  const rawPresentation = isRecord(root.presentation) ? root.presentation : {};
  const presentation: Required<VideoStimulusPresentation> = {
    showLabel:
      typeof rawPresentation.showLabel === 'boolean'
        ? rawPresentation.showLabel
        : DEFAULT_PRESENTATION.showLabel,
    showDescription:
      typeof rawPresentation.showDescription === 'boolean'
        ? rawPresentation.showDescription
        : DEFAULT_PRESENTATION.showDescription,
    transcriptInitiallyExpanded:
      typeof rawPresentation.transcriptInitiallyExpanded === 'boolean'
        ? rawPresentation.transcriptInitiallyExpanded
        : DEFAULT_PRESENTATION.transcriptInitiallyExpanded,
  };

  return {
    ...(trimmed(root.id) ? { id: trimmed(root.id) } : {}),
    element: trimmed(root.element) ?? 'video-stimulus',
    media: normalizeMedia(root.media),
    language,
    presentation,
    uiText: resolveUiText(language, root.uiText),
    mode: typeof environment.mode === 'string' ? environment.mode : undefined,
  };
}
