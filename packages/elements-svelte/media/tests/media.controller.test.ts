import { describe, expect, it } from 'vitest';
import {
  calculatePercentagePlayed,
  createSession,
  evaluate,
  formatTime,
  getSupportedMimeTypes,
  isSessionComplete,
  recordEvent,
  updatePlaybackTime,
  validateModel,
} from '../src/media.controller.js';
import type { MediaModel, MediaSession, PlaybackEvent } from '../src/media.types.js';

describe('Media Controller', () => {
  describe('validateModel', () => {
    it('should return no errors for valid video model', () => {
      const model: MediaModel = {
        id: 'media-1',
        element: '@pie-element/media',
        mediaType: 'video',
        sources: [{ src: 'video.mp4', type: 'video/mp4' }],
      };

      const errors = validateModel(model);
      expect(errors).toEqual([]);
    });

    it('should return no errors for valid audio model', () => {
      const model: MediaModel = {
        id: 'media-1',
        element: '@pie-element/media',
        mediaType: 'audio',
        sources: [{ src: 'audio.mp3', type: 'audio/mpeg' }],
      };

      const errors = validateModel(model);
      expect(errors).toEqual([]);
    });

    it('should require id', () => {
      const model = {
        element: '@pie-element/media',
        mediaType: 'video',
        sources: [{ src: 'video.mp4', type: 'video/mp4' }],
      } as MediaModel;

      const errors = validateModel(model);
      expect(errors).toContain('Model must have an id');
    });

    it('should require mediaType', () => {
      const model = {
        id: 'media-1',
        element: '@pie-element/media',
        sources: [{ src: 'video.mp4', type: 'video/mp4' }],
      } as MediaModel;

      const errors = validateModel(model);
      expect(errors).toContain('Model must specify mediaType (video or audio)');
    });

    it('should validate mediaType values', () => {
      const model = {
        id: 'media-1',
        element: '@pie-element/media',
        mediaType: 'invalid',
        sources: [{ src: 'video.mp4', type: 'video/mp4' }],
      } as MediaModel;

      const errors = validateModel(model);
      expect(errors).toContain('mediaType must be either "video" or "audio"');
    });

    it('should require at least one source', () => {
      const model: MediaModel = {
        id: 'media-1',
        element: '@pie-element/media',
        mediaType: 'video',
        sources: [],
      };

      const errors = validateModel(model);
      expect(errors).toContain('Model must have at least one media source');
    });

    it('should validate source src', () => {
      const model: MediaModel = {
        id: 'media-1',
        element: '@pie-element/media',
        mediaType: 'video',
        sources: [{ src: '', type: 'video/mp4' }],
      };

      const errors = validateModel(model);
      expect(errors).toContain('Source 0 must have a src URL');
    });

    it('should validate source type', () => {
      const model: MediaModel = {
        id: 'media-1',
        element: '@pie-element/media',
        mediaType: 'video',
        sources: [{ src: 'video.mp4', type: '' }],
      };

      const errors = validateModel(model);
      expect(errors).toContain('Source 0 must have a MIME type');
    });

    it('should validate minPlayedPercentage range', () => {
      const model: MediaModel = {
        id: 'media-1',
        element: '@pie-element/media',
        mediaType: 'video',
        sources: [{ src: 'video.mp4', type: 'video/mp4' }],
        minPlayedPercentage: 150,
      };

      const errors = validateModel(model);
      expect(errors).toContain('minPlayedPercentage must be between 0 and 100');
    });

    it('should validate maxPlaybackRate', () => {
      const model: MediaModel = {
        id: 'media-1',
        element: '@pie-element/media',
        mediaType: 'video',
        sources: [{ src: 'video.mp4', type: 'video/mp4' }],
        maxPlaybackRate: -1,
      };

      const errors = validateModel(model);
      expect(errors).toContain('maxPlaybackRate must be greater than 0');
    });
  });

  describe('createSession', () => {
    it('should create empty session with default values', () => {
      const session = createSession();

      expect(session).toEqual({
        played: false,
        completed: false,
        totalTimePlayed: 0,
        highestTimeReached: 0,
        playCount: 0,
        pauseCount: 0,
        seekCount: 0,
        events: [],
      });
    });
  });

  describe('recordEvent', () => {
    it('should record play event', () => {
      const session = createSession();
      const event: PlaybackEvent = {
        type: 'play',
        timestamp: Date.now(),
        currentTime: 5,
      };

      const updated = recordEvent(session, event);

      expect(updated.played).toBe(true);
      expect(updated.playCount).toBe(1);
      expect(updated.events).toHaveLength(1);
      expect(updated.events?.[0]).toEqual(event);
    });

    it('should record pause event', () => {
      const session = createSession();
      const event: PlaybackEvent = {
        type: 'pause',
        timestamp: Date.now(),
        currentTime: 10,
      };

      const updated = recordEvent(session, event);

      expect(updated.pauseCount).toBe(1);
      expect(updated.events).toHaveLength(1);
    });

    it('should record ended event', () => {
      const session = createSession();
      const event: PlaybackEvent = {
        type: 'ended',
        timestamp: Date.now(),
        currentTime: 100,
      };

      const updated = recordEvent(session, event);

      expect(updated.completed).toBe(true);
      expect(updated.events).toHaveLength(1);
    });

    it('should record seeked event', () => {
      const session = createSession();
      const event: PlaybackEvent = {
        type: 'seeked',
        timestamp: Date.now(),
        currentTime: 50,
      };

      const updated = recordEvent(session, event);

      expect(updated.seekCount).toBe(1);
      expect(updated.events).toHaveLength(1);
    });

    it('should accumulate multiple events', () => {
      let session = createSession();

      const play: PlaybackEvent = { type: 'play', timestamp: Date.now(), currentTime: 0 };
      const pause: PlaybackEvent = { type: 'pause', timestamp: Date.now(), currentTime: 10 };

      session = recordEvent(session, play);
      session = recordEvent(session, pause);

      expect(session.playCount).toBe(1);
      expect(session.pauseCount).toBe(1);
      expect(session.events).toHaveLength(2);
    });
  });

  describe('updatePlaybackTime', () => {
    it('should update highest time reached', () => {
      const session = createSession();
      const updated = updatePlaybackTime(session, 30, 100);

      expect(updated.highestTimeReached).toBe(30);
      expect(updated.totalTimePlayed).toBe(30);
    });

    it('should not decrease highest time reached', () => {
      let session = createSession();
      session = updatePlaybackTime(session, 50, 100);
      session = updatePlaybackTime(session, 30, 100);

      expect(session.highestTimeReached).toBe(50);
    });

    it('should cap total time at duration', () => {
      const session = createSession();
      const updated = updatePlaybackTime(session, 120, 100);

      expect(updated.totalTimePlayed).toBe(100);
    });
  });

  describe('isSessionComplete', () => {
    const model: MediaModel = {
      id: 'media-1',
      element: '@pie-element/media',
      mediaType: 'video',
      sources: [{ src: 'video.mp4', type: 'video/mp4' }],
    };

    it('should return true if played and no requirements', () => {
      const session: MediaSession = {
        played: true,
        completed: false,
      };

      expect(isSessionComplete(model, session)).toBe(true);
    });

    it('should return false if requireCompletion and not completed', () => {
      const modelWithReq = { ...model, requireCompletion: true };
      const session: MediaSession = {
        played: true,
        completed: false,
      };

      expect(isSessionComplete(modelWithReq, session)).toBe(false);
    });

    it('should return true if requireCompletion and completed', () => {
      const modelWithReq = { ...model, requireCompletion: true };
      const session: MediaSession = {
        played: true,
        completed: true,
      };

      expect(isSessionComplete(modelWithReq, session)).toBe(true);
    });

    it('should return false if minPlayedPercentage set', () => {
      const modelWithMin = { ...model, minPlayedPercentage: 80 };
      const session: MediaSession = {
        played: true,
        completed: false,
      };

      // Cannot determine without duration, so returns false
      expect(isSessionComplete(modelWithMin, session)).toBe(false);
    });
  });

  describe('calculatePercentagePlayed', () => {
    it('should calculate percentage correctly', () => {
      const session: MediaSession = {
        highestTimeReached: 50,
      };

      const percentage = calculatePercentagePlayed(session, 100);
      expect(percentage).toBe(50);
    });

    it('should return 0 for zero duration', () => {
      const session: MediaSession = {
        highestTimeReached: 50,
      };

      const percentage = calculatePercentagePlayed(session, 0);
      expect(percentage).toBe(0);
    });

    it('should cap at 100%', () => {
      const session: MediaSession = {
        highestTimeReached: 150,
      };

      const percentage = calculatePercentagePlayed(session, 100);
      expect(percentage).toBe(100);
    });

    it('should not go below 0%', () => {
      const session: MediaSession = {
        highestTimeReached: -10,
      };

      const percentage = calculatePercentagePlayed(session, 100);
      expect(percentage).toBe(0);
    });
  });

  describe('evaluate', () => {
    const model: MediaModel = {
      id: 'media-1',
      element: '@pie-element/media',
      mediaType: 'video',
      sources: [{ src: 'video.mp4', type: 'video/mp4' }],
    };

    it('should return complete for played media with no requirements', () => {
      const session: MediaSession = {
        played: true,
        highestTimeReached: 50,
      };

      const result = evaluate(model, session, 100);

      expect(result.complete).toBe(true);
      expect(result.score).toBe(1);
      expect(result.correct).toBe(true);
    });

    it('should check completion requirement', () => {
      const modelWithReq = { ...model, requireCompletion: true };
      const session: MediaSession = {
        played: true,
        completed: false,
        highestTimeReached: 80,
      };

      const result = evaluate(modelWithReq, session, 100);

      expect(result.complete).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should check minimum percentage requirement', () => {
      const modelWithMin = { ...model, minPlayedPercentage: 80 };
      const session: MediaSession = {
        played: true,
        highestTimeReached: 70,
      };

      const result = evaluate(modelWithMin, session, 100);

      expect(result.complete).toBe(false);
      expect(result.metMinimumRequirement).toBe(false);
      expect(result.percentagePlayed).toBe(70);
    });

    it('should pass when minimum percentage is met', () => {
      const modelWithMin = { ...model, minPlayedPercentage: 80 };
      const session: MediaSession = {
        played: true,
        highestTimeReached: 85,
      };

      const result = evaluate(modelWithMin, session, 100);

      expect(result.complete).toBe(true);
      expect(result.metMinimumRequirement).toBe(true);
      expect(result.percentagePlayed).toBe(85);
    });

    it('should check both requirements', () => {
      const modelWithBoth = {
        ...model,
        requireCompletion: true,
        minPlayedPercentage: 80,
      };
      const session: MediaSession = {
        played: true,
        completed: true,
        highestTimeReached: 100,
      };

      const result = evaluate(modelWithBoth, session, 100);

      expect(result.complete).toBe(true);
      expect(result.score).toBe(1);
    });

    it('should return incomplete for invalid model', () => {
      const invalidModel = { ...model, id: '' };
      const session = createSession();

      const result = evaluate(invalidModel, session, 100);

      expect(result.score).toBe(0);
      expect(result.correct).toBe(false);
      expect(result.complete).toBe(false);
    });

    it('should round percentage to 2 decimals', () => {
      const session: MediaSession = {
        played: true,
        highestTimeReached: 33.33333,
      };

      const result = evaluate(model, session, 100);

      expect(result.percentagePlayed).toBe(33.33);
    });
  });

  describe('formatTime', () => {
    it('should format seconds to MM:SS', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(599)).toBe('9:59');
    });

    it('should format to HH:MM:SS for hours', () => {
      expect(formatTime(3600)).toBe('1:00:00');
      expect(formatTime(3661)).toBe('1:01:01');
      expect(formatTime(7200)).toBe('2:00:00');
    });

    it('should handle edge cases', () => {
      expect(formatTime(-10)).toBe('0:00');
      expect(formatTime(Infinity)).toBe('0:00');
      expect(formatTime(NaN)).toBe('0:00');
    });

    it('should pad single digits', () => {
      expect(formatTime(65)).toBe('1:05');
      expect(formatTime(3605)).toBe('1:00:05');
    });
  });

  describe('getSupportedMimeTypes', () => {
    it('should return video MIME types', () => {
      const types = getSupportedMimeTypes('video');

      expect(types).toContain('video/mp4');
      expect(types).toContain('video/webm');
      expect(types).toContain('video/ogg');
    });

    it('should return audio MIME types', () => {
      const types = getSupportedMimeTypes('audio');

      expect(types).toContain('audio/mpeg');
      expect(types).toContain('audio/mp3');
      expect(types).toContain('audio/ogg');
    });
  });
});
