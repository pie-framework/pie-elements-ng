import type {
  ConfigureProp,
  MediaAssetRef,
  MediaSource,
  MediaUiText,
  PieModel,
  TextTrackRef,
  TranscriptRef,
} from '@pie-element/shared-types';

/** Whether the video's audio carries meaning; `unknown` is unresolved. */
export type AudioContentDeclaration = 'unknown' | 'none' | 'meaningful';
/**
 * How captions are provided: a captions text `track`, `open` (burned into the video), `notRequired`,
 * or `missing`; `unknown` is unresolved.
 */
export type CaptionSupportDeclaration = 'unknown' | 'notRequired' | 'track' | 'open' | 'missing';
/**
 * Whether the visuals carry meaning the audio does not, and whether they are `described`;
 * `unknown` is unresolved.
 */
export type VisualSupportDeclaration = 'unknown' | 'notMeaningful' | 'described' | 'missing';

/** What delivery shows around the video. */
export interface VideoStimulusPresentation {
  /**
   * `false` hides `media.label` visually; it stays the video's accessible name
   * @default true
   */
  showLabel?: boolean;
  /**
   * `false` hides `media.description`
   * @default true
   */
  showDescription?: boolean;
  /**
   * Opens the transcript on first render
   * @default false
   */
  transcriptInitiallyExpanded?: boolean;
}

/**
 * The author's accessibility declarations. `validate()` requires each resolved and consistent with
 * the media; delivery does not read them.
 */
export interface VideoStimulusAccessibilityProfile {
  /**
   * Whether the audio carries meaning; `meaningful` requires captions
   * @default "unknown"
   */
  audioContent?: AudioContentDeclaration;
  /**
   * How captions are provided; `track` requires a valid captions track in `media.tracks`
   * @default "unknown"
   */
  captionSupport?: CaptionSupportDeclaration;
  /**
   * Whether the visuals are described; `missing` fails validation
   * @default "unknown"
   */
  visualSupport?: VisualSupportDeclaration;
}

export interface VideoStimulusUiText extends MediaUiText {
  videoLabel: string;
  transcriptLabel: string;
  retrying: string;
  retryingDescription: string;
  trackUnavailable: string;
  trackErrorDescription: string;
  videoUnavailable: string;
  missingVideoSource: string;
  videoErrorDescription: string;
  retry: string;
}

export type VideoStimulusUiTextKey = keyof VideoStimulusUiText;

/** Model for the video stimulus: one video with its captions, transcript, label and description */
export interface VideoStimulusModel extends PieModel {
  /**
   * The video: its sources, text tracks, transcript, label and description. Delivery reads it only
   * when `version` is 1 and `kind` is `video`; `validate()` also requires `id`, `label`, `lang` and a
   * playable source.
   */
  media: MediaAssetRef;
  /**
   * The learner-facing strings' language, a BCP 47 tag; an invalid tag reads as `en`.
   * @default "en"
   */
  language?: string;
  /** What delivery shows around the video */
  presentation?: VideoStimulusPresentation;
  /** The author's accessibility declarations */
  accessibilityProfile?: VideoStimulusAccessibilityProfile;
  /** Overrides of the learner-facing strings by name; a blank value keeps the default */
  uiText?: Partial<VideoStimulusUiText>;
}

/**
 * Config Object for `@pie-element/video-stimulus`. The author view has no settings panel and reads
 * none of it.
 */
export interface VideoStimulusConfiguration {
  /** Not read */
  media?: ConfigureProp;
  /** Not read */
  presentation?: ConfigureProp;
  /** Not read */
  accessibilityProfile?: ConfigureProp;
}

/** The element writes no session; the player creates the entry with `id` and `element`. */
export interface VideoStimulusSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
}

export interface VideoStimulusEnvironment {
  mode?: string;
  role?: string;
  [key: string]: unknown;
}

export interface VideoStimulusMediaViewModel {
  version: 1;
  id: string;
  kind: 'video';
  sources: MediaSource[];
  poster?: string;
  thumbnail?: string;
  durationSeconds?: number;
  tracks?: TextTrackRef[];
  transcript?: TranscriptRef;
  label: string;
  description?: string;
  lang?: string;
}

export interface VideoStimulusViewModel {
  id?: string;
  element: string;
  media: VideoStimulusMediaViewModel;
  language: string;
  presentation: Required<VideoStimulusPresentation>;
  uiText: VideoStimulusUiText;
  mode?: string;
}

export type SourceField = 'src' | 'type' | 'width' | 'height' | 'bitrate';
export type TrackField = 'src' | 'kind' | 'lang' | 'label' | 'default';
export type TranscriptField = 'src' | 'html' | 'plainText' | 'lang';

export type VideoStimulusFieldKey =
  | 'model'
  | 'language'
  | 'media'
  | 'media.version'
  | 'media.kind'
  | 'media.id'
  | 'media.label'
  | 'media.lang'
  | 'media.sources'
  | `media.sources.${number}.${SourceField}`
  | 'media.poster'
  | 'media.thumbnail'
  | 'media.durationSeconds'
  | 'media.tracks'
  | `media.tracks.${number}.${TrackField}`
  | 'media.transcript'
  | `media.transcript.${TranscriptField}`
  | 'accessibilityProfile.audioContent'
  | 'accessibilityProfile.captionSupport'
  | 'accessibilityProfile.visualSupport'
  | 'uiText'
  | `uiText.${VideoStimulusUiTextKey}`;

export type VideoStimulusValidationErrors = Partial<Record<VideoStimulusFieldKey, string>>;

export interface AccessibilityFinding {
  field: VideoStimulusFieldKey;
  message: string;
}

export interface AccessibilityReview {
  errors: VideoStimulusValidationErrors;
  warnings: AccessibilityFinding[];
}
