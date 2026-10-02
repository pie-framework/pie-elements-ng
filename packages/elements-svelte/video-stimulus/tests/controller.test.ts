import { describe, expect, it } from 'vitest';
import type { VideoStimulusModel } from '../src/types.js';
import {
  createDefaultModel,
  model as buildViewModel,
  reviewAccessibility,
  validate,
  validateDraft,
} from '../src/controller/index.js';

function validModel(overrides: Partial<VideoStimulusModel> = {}): VideoStimulusModel {
  return createDefaultModel({
    id: 'video-element-1',
    element: 'video-stimulus',
    language: 'en-US',
    media: {
      version: 1,
      id: 'lab-safety-video',
      kind: 'video',
      label: 'Lab safety demonstration',
      description: 'Watch the safe handling procedure.',
      lang: 'en-US',
      durationSeconds: 42,
      poster: 'https://cdn.example.org/lab-safety.jpg',
      sources: [
        {
          src: 'https://cdn.example.org/lab-safety.mp4',
          type: 'video/mp4',
          width: 1280,
          height: 720,
          bitrate: 1_500_000,
        },
      ],
      tracks: [
        {
          src: 'https://cdn.example.org/lab-safety.en.vtt',
          kind: 'captions',
          lang: 'en-US',
          label: 'English captions',
          default: true,
        },
      ],
      transcript: {
        lang: 'en-US',
        html: '<p><strong>Narrator:</strong> Put on safety goggles.</p>',
      },
    },
    accessibilityProfile: {
      audioContent: 'meaningful',
      captionSupport: 'track',
      visualSupport: 'described',
    },
    ...overrides,
  });
}

describe('video-stimulus controller', () => {
  it('exports only the non-scoring controller functions', async () => {
    const controller = await import('../src/controller/index.js');
    expect(controller).toHaveProperty('createDefaultModel');
    expect(controller).toHaveProperty('validateDraft');
    expect(controller).toHaveProperty('validate');
    expect(controller).toHaveProperty('reviewAccessibility');
    expect(controller).toHaveProperty('model');
    expect(controller).not.toHaveProperty('outcome');
    expect(controller).not.toHaveProperty('createCorrectResponseSession');
  });

  it('creates a source-less authoring draft accepted by draft validation', () => {
    const draft = createDefaultModel();
    expect(draft.media).toMatchObject({ version: 1, kind: 'video', sources: [] });
    expect(validateDraft(draft)).toEqual({});
    expect(validate(draft)).toMatchObject({
      'media.id': expect.any(String),
      'media.label': expect.any(String),
      'media.lang': expect.any(String),
      'media.sources': expect.any(String),
    });
  });

  it('accepts a complete publishable model', () => {
    expect(validate(validModel())).toEqual({});
  });

  it('uses typed row keys for unsafe, temporary, and malformed media fields', () => {
    const candidate = validModel();
    candidate.media.sources = [
      { src: 'javascript:alert(1)', type: 'text/plain', width: -1, height: 1.5, bitrate: 0 },
      { src: 'blob:https://example.org/temporary', type: 'video/webm' },
    ];
    candidate.media.poster = 'file:///tmp/poster.jpg';
    candidate.media.tracks = [
      {
        src: 'blob:https://example.org/track',
        kind: 'captions',
        lang: '',
        label: '',
        default: true,
      },
      {
        src: 'https://cdn.example.org/second.vtt',
        kind: 'captions',
        lang: 'en',
        label: 'Second',
        default: true,
      },
    ];
    candidate.media.transcript = { src: 'javascript:alert(1)' };

    expect(validate(candidate)).toMatchObject({
      'media.sources.0.src': expect.any(String),
      'media.sources.0.type': expect.any(String),
      'media.sources.0.width': expect.any(String),
      'media.sources.0.height': expect.any(String),
      'media.sources.0.bitrate': expect.any(String),
      'media.sources.1.src': expect.any(String),
      'media.poster': expect.any(String),
      'media.tracks.0.src': expect.any(String),
      'media.tracks.0.lang': expect.any(String),
      'media.tracks.0.label': expect.any(String),
      'media.tracks': expect.any(String),
      'media.transcript.src': expect.any(String),
    });
  });

  it('rejects duplicate tracks and malformed UI text while projecting safe fallbacks', () => {
    const candidate = validModel();
    const firstTrack = candidate.media.tracks?.[0];
    if (!firstTrack) throw new Error('Expected a valid captions track');
    candidate.media.tracks = [firstTrack, { ...firstTrack, label: 'Duplicate captions' }];
    candidate.uiText = {
      showTranscript: '   ',
    };
    (candidate.uiText as Record<string, unknown>).unexpected = 'Not part of the typed contract';

    expect(validate(candidate)).toMatchObject({
      'media.tracks.1.src': expect.any(String),
      'uiText.showTranscript': expect.any(String),
      uiText: expect.any(String),
    });
    const viewModel = buildViewModel(candidate, undefined, { mode: 'view' });
    expect(viewModel.media.tracks).toHaveLength(1);
    expect(viewModel.uiText.showTranscript).toBe('Show transcript');
    expect(viewModel.uiText).not.toHaveProperty('unexpected');
  });

  it('rejects incorrect media version and kind without throwing on unknown input', () => {
    const invalid = {
      media: {
        version: 2,
        kind: 'audio',
        sources: 'not-an-array',
      },
    };
    expect(() => validate(invalid)).not.toThrow();
    expect(validate(invalid)).toMatchObject({
      'media.version': expect.any(String),
      'media.kind': expect.any(String),
      'media.sources': expect.any(String),
    });
    expect(() => validate(Symbol('invalid'))).not.toThrow();
  });

  it('does not mutate validation or model inputs', () => {
    const candidate = validModel();
    const before = JSON.stringify(candidate);
    validateDraft(candidate);
    validate(candidate);
    reviewAccessibility(candidate);
    buildViewModel(candidate, { ignored: true }, { mode: 'view' });
    expect(JSON.stringify(candidate)).toBe(before);
  });

  it('returns a safe typed view model and preserves safe source order', () => {
    const candidate = validModel();
    candidate.media.sources = [
      { src: ' https://cdn.example.org/first.mp4 ', type: ' video/mp4 ', bitrate: 2000 },
      { src: 'javascript:alert(1)', type: 'video/mp4' },
      { src: 'https://cdn.example.org/second.webm', type: 'video/webm' },
      { src: 'https://cdn.example.org/first.mp4', type: 'video/mp4' },
    ];
    candidate.media.tracks = [
      ...(candidate.media.tracks ?? []),
      {
        src: 'javascript:alert(1)',
        kind: 'subtitles',
        lang: 'es',
        label: 'Unsafe',
      },
    ];
    candidate.media.transcript = {
      html: '<p>Safe text</p><script>alert(1)</script><a href="javascript:alert(2)">bad</a>',
      lang: 'en',
    };

    const viewModel = buildViewModel(candidate, { ignored: 'session' }, { mode: 'evaluate' });
    expect(viewModel.media.sources.map((source) => source.src)).toEqual([
      'https://cdn.example.org/first.mp4',
      'https://cdn.example.org/second.webm',
    ]);
    expect(viewModel.media.sources[0].bitrate).toBe(2000);
    expect(viewModel.media.tracks).toHaveLength(1);
    expect(viewModel.media.transcript?.html).toContain('Safe text');
    expect(viewModel.mode).toBe('evaluate');
  });

  it('ignores Session and keeps playback enabled in every mode', () => {
    const candidate = validModel();
    const first = buildViewModel(candidate, { position: 1 }, { mode: 'gather' });
    const second = buildViewModel(candidate, { position: 999 }, { mode: 'gather' });
    expect(first).toEqual(second);
    for (const mode of ['gather', 'view', 'evaluate']) {
      expect(buildViewModel(candidate, undefined, { mode }).media.sources).toHaveLength(1);
    }
  });

  it('reports blocking accessibility obligations separately from recommendations', () => {
    const candidate = validModel({
      media: {
        ...validModel().media,
        label: 'Video',
        tracks: [
          {
            src: 'https://cdn.example.org/subtitles.vtt',
            kind: 'subtitles',
            lang: 'en',
            label: 'English subtitles',
          },
        ],
        transcript: { src: 'https://example.org/transcript' },
      },
      accessibilityProfile: {
        audioContent: 'meaningful',
        captionSupport: 'track',
        visualSupport: 'missing',
      },
    });
    const review = reviewAccessibility(candidate);
    expect(review.errors).toMatchObject({
      'accessibilityProfile.captionSupport': expect.any(String),
      'accessibilityProfile.visualSupport': expect.any(String),
    });
    expect(review.warnings.map((warning) => warning.field)).toEqual(
      expect.arrayContaining(['media.label', 'media.tracks', 'media.transcript.src'])
    );
  });
});
