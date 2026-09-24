import type {
  MediaAssetRef,
  MediaSource,
  TextTrackRef,
  TranscriptRef,
} from '@pie-element/shared-types';
import type { MediaUiText } from '@pie-lib/media-svelte';

export type AudioContentDeclaration = 'unknown' | 'none' | 'meaningful';
export type CaptionSupportDeclaration = 'unknown' | 'notRequired' | 'track' | 'open' | 'missing';
export type VisualSupportDeclaration = 'unknown' | 'notMeaningful' | 'described' | 'missing';

export interface VideoStimulusPresentation {
  showLabel?: boolean;
  showDescription?: boolean;
  transcriptInitiallyExpanded?: boolean;
}

export interface VideoStimulusAccessibilityProfile {
  audioContent?: AudioContentDeclaration;
  captionSupport?: CaptionSupportDeclaration;
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

export interface VideoStimulusModel {
  id?: string;
  element?: string;
  media: MediaAssetRef;
  language?: string;
  presentation?: VideoStimulusPresentation;
  accessibilityProfile?: VideoStimulusAccessibilityProfile;
  uiText?: Partial<VideoStimulusUiText>;
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
