/**
 * Media Element Type Definitions
 *
 * Maps to QTI 2.2 mediaInteraction
 * Provides video/audio playback with optional interaction tracking
 */

import type { PieEnvironment, PieEvaluation, PieModel, PieSession } from '@pie-shared/types';

/**
 * Media type
 */
export type MediaType = 'video' | 'audio';

/**
 * Media source with format
 */
export interface MediaSource {
  src: string;
  type: string; // MIME type (e.g., 'video/mp4', 'audio/mpeg')
}

/**
 * Playback event for tracking
 */
export interface PlaybackEvent {
  type: 'play' | 'pause' | 'ended' | 'seeked';
  timestamp: number; // Unix timestamp
  currentTime: number; // Media current time in seconds
}

/**
 * Media model - defines the media interaction
 */
export interface MediaModel extends PieModel {
  element: '@pie-element/media';

  /** Media type */
  mediaType: MediaType;

  /** Media sources (supports multiple formats for browser compatibility) */
  sources: MediaSource[];

  /** Poster image URL (video only) */
  poster?: string;

  /** Caption/subtitle track URL (WebVTT format) */
  captions?: string;

  /** Caption language code (e.g., 'en', 'es') */
  captionsLanguage?: string;

  /** Caption label (e.g., 'English', 'Spanish') */
  captionsLabel?: string;

  /** Show native browser controls */
  showControls?: boolean;

  /** Enable autoplay (with restrictions) */
  autoplay?: boolean;

  /** Enable loop playback */
  loop?: boolean;

  /** Require user to watch/listen to completion */
  requireCompletion?: boolean;

  /** Minimum percentage that must be played (0-100) */
  minPlayedPercentage?: number;

  /** Track playback events */
  trackPlayback?: boolean;

  /** Maximum playback rate allowed */
  maxPlaybackRate?: number;

  /** Disable seeking/scrubbing */
  disableSeeking?: boolean;

  /** Prompt text */
  prompt?: string;

  /** Enable prompt display */
  promptEnabled?: boolean;

  /** Rationale text (instructor only) */
  rationale?: string;

  /** Enable rationale display */
  rationaleEnabled?: boolean;
}

/**
 * Media session - tracks user interaction
 */
export interface MediaSession extends PieSession {
  /** Whether media has been played */
  played?: boolean;

  /** Whether media has been completed (reached end) */
  completed?: boolean;

  /** Total time played in seconds */
  totalTimePlayed?: number;

  /** Highest time reached in seconds */
  highestTimeReached?: number;

  /** Playback events (if tracking enabled) */
  events?: PlaybackEvent[];

  /** Number of times played */
  playCount?: number;

  /** Number of times paused */
  pauseCount?: number;

  /** Number of seeks performed */
  seekCount?: number;
}

/**
 * Media evaluation - assesses completion requirements
 */
export interface MediaEvaluation extends PieEvaluation {
  /** Whether completion requirements were met */
  complete: boolean;

  /** Percentage of media played (0-100) */
  percentagePlayed?: number;

  /** Whether minimum percentage requirement was met */
  metMinimumRequirement?: boolean;
}

/**
 * Props for Media component
 */
export interface MediaComponentProps {
  /** Media model */
  model: MediaModel;

  /** Media session (bindable) */
  session: MediaSession;

  /** Evaluation result */
  evaluation?: MediaEvaluation;

  /** Environment */
  env: PieEnvironment;

  /** Session change callback */
  onSessionChange: (session: MediaSession) => void;

  /** Duration change callback */
  onDurationChange?: (duration: number) => void;
}
