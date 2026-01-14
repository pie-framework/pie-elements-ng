/**
 * Media Element Controller
 *
 * Business logic for media playback tracking and evaluation
 */

import type { MediaEvaluation, MediaModel, MediaSession, PlaybackEvent } from './media.types.js';

/**
 * Validates a media model
 * @param model - Model to validate
 * @returns Array of error messages (empty if valid)
 */
export function validateModel(model: MediaModel): string[] {
  const errors: string[] = [];

  // Required fields
  if (!model.id) {
    errors.push('Model must have an id');
  }

  if (!model.mediaType) {
    errors.push('Model must specify mediaType (video or audio)');
  } else if (model.mediaType !== 'video' && model.mediaType !== 'audio') {
    errors.push('mediaType must be either "video" or "audio"');
  }

  if (!model.sources || model.sources.length === 0) {
    errors.push('Model must have at least one media source');
  } else {
    // Validate each source
    model.sources.forEach((source, index) => {
      if (!source.src) {
        errors.push(`Source ${index} must have a src URL`);
      }
      if (!source.type) {
        errors.push(`Source ${index} must have a MIME type`);
      }
    });
  }

  // Validate percentage if specified
  if (model.minPlayedPercentage !== undefined) {
    if (model.minPlayedPercentage < 0 || model.minPlayedPercentage > 100) {
      errors.push('minPlayedPercentage must be between 0 and 100');
    }
  }

  // Validate playback rate if specified
  if (model.maxPlaybackRate !== undefined && model.maxPlaybackRate <= 0) {
    errors.push('maxPlaybackRate must be greater than 0');
  }

  return errors;
}

/**
 * Creates an empty media session
 * @returns New session object
 */
export function createSession(): MediaSession {
  return {
    played: false,
    completed: false,
    totalTimePlayed: 0,
    highestTimeReached: 0,
    playCount: 0,
    pauseCount: 0,
    seekCount: 0,
    events: [],
  };
}

/**
 * Records a playback event in the session
 * @param session - Current session
 * @param event - Playback event to record
 * @returns Updated session
 */
export function recordEvent(session: MediaSession, event: PlaybackEvent): MediaSession {
  const events = [...(session.events || []), event];

  const updates: Partial<MediaSession> = { events };

  switch (event.type) {
    case 'play':
      updates.played = true;
      updates.playCount = (session.playCount || 0) + 1;
      break;

    case 'pause':
      updates.pauseCount = (session.pauseCount || 0) + 1;
      break;

    case 'ended':
      updates.completed = true;
      break;

    case 'seeked':
      updates.seekCount = (session.seekCount || 0) + 1;
      break;
  }

  return { ...session, ...updates };
}

/**
 * Updates playback time in session
 * @param session - Current session
 * @param currentTime - Current playback time in seconds
 * @param duration - Total duration in seconds
 * @returns Updated session
 */
export function updatePlaybackTime(
  session: MediaSession,
  currentTime: number,
  duration: number
): MediaSession {
  const highestTimeReached = Math.max(session.highestTimeReached || 0, currentTime);

  // Calculate total time played (rough estimate based on highest time reached)
  const totalTimePlayed = Math.min(highestTimeReached, duration);

  return {
    ...session,
    highestTimeReached,
    totalTimePlayed,
  };
}

/**
 * Checks if session is complete (all requirements met)
 * @param model - Media model
 * @param session - Current session
 * @returns True if complete
 */
export function isSessionComplete(model: MediaModel, session: MediaSession): boolean {
  // If no completion requirements, always complete if played
  if (!model.requireCompletion && !model.minPlayedPercentage) {
    return session.played || false;
  }

  // Check completion requirement
  if (model.requireCompletion && !session.completed) {
    return false;
  }

  // Check minimum percentage requirement
  if (model.minPlayedPercentage !== undefined) {
    // Need duration to calculate percentage - assume incomplete if not available
    // This will be properly calculated in evaluate()
    return false;
  }

  return true;
}

/**
 * Calculates percentage of media played
 * @param session - Current session
 * @param duration - Total media duration in seconds
 * @returns Percentage played (0-100)
 */
export function calculatePercentagePlayed(session: MediaSession, duration: number): number {
  if (duration === 0) return 0;

  const timePlayed = session.highestTimeReached || 0;
  const percentage = (timePlayed / duration) * 100;

  return Math.min(100, Math.max(0, percentage));
}

/**
 * Evaluates media session based on model requirements
 * @param model - Media model
 * @param session - User session
 * @param duration - Total media duration in seconds
 * @returns Evaluation result
 */
export function evaluate(
  model: MediaModel,
  session: MediaSession,
  duration: number
): MediaEvaluation {
  const errors = validateModel(model);
  if (errors.length > 0) {
    return {
      score: 0,
      correct: false,
      complete: false,
    };
  }

  // Calculate percentage played
  const percentagePlayed = calculatePercentagePlayed(session, duration);

  // Check if requirements are met
  let complete = true;
  let metMinimumRequirement = true;

  // Check completion requirement
  if (model.requireCompletion && !session.completed) {
    complete = false;
  }

  // Check minimum percentage requirement
  if (model.minPlayedPercentage !== undefined) {
    metMinimumRequirement = percentagePlayed >= model.minPlayedPercentage;
    if (!metMinimumRequirement) {
      complete = false;
    }
  }

  // Score is 1 if complete, 0 otherwise
  const score = complete ? 1 : 0;

  return {
    score,
    correct: complete,
    complete,
    percentagePlayed: Math.round(percentagePlayed * 100) / 100, // Round to 2 decimals
    metMinimumRequirement,
  };
}

/**
 * Formats time in seconds to MM:SS or HH:MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Gets supported MIME types for the media type
 * @param mediaType - Type of media
 * @returns Array of common MIME types
 */
export function getSupportedMimeTypes(mediaType: 'video' | 'audio'): string[] {
  if (mediaType === 'video') {
    return ['video/mp4', 'video/webm', 'video/ogg'];
  }

  return ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/webm'];
}

/**
 * Checks if browser can play the media type
 * @param source - Media source with MIME type
 * @returns True if probably/maybe playable
 */
export function canPlaySource(source: { src: string; type: string }): boolean {
  if (typeof document === 'undefined') return false;

  const video = document.createElement('video');
  const audio = document.createElement('audio');

  const videoSupport = video.canPlayType(source.type);
  const audioSupport = audio.canPlayType(source.type);

  return videoSupport !== '' || audioSupport !== '';
}
