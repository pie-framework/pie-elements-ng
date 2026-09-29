import { describe, expect, it } from 'vitest';
import type { MediaAssetRef, TextTrackRef, TranscriptRef } from '../src/types.js';

const trackKinds: TextTrackRef['kind'][] = [
  'captions',
  'subtitles',
  'descriptions',
  'chapters',
  'metadata',
];

const transcript = {
  src: 'https://media.example.test/transcripts/lab-safety.html',
  html: '<p>Inline transcript</p>',
  plainText: 'Inline transcript',
  lang: 'en-US',
} satisfies TranscriptRef;

const media = {
  version: 1,
  id: 'lab-safety-video',
  kind: 'video',
  sources: [
    {
      src: 'https://media.example.test/lab-safety.mp4',
      type: 'video/mp4',
      width: 1280,
      height: 720,
      bitrate: 2_500_000,
    },
  ],
  poster: 'https://media.example.test/lab-safety-poster.jpg',
  thumbnail: 'https://media.example.test/lab-safety-thumbnail.jpg',
  durationSeconds: 84.5,
  tracks: [
    {
      src: 'https://media.example.test/lab-safety.en.vtt',
      kind: 'captions',
      lang: 'en-US',
      label: 'English',
      default: true,
    },
  ],
  transcript,
  label: 'Lab safety demonstration',
  description: 'A demonstration of safe laboratory procedures.',
  lang: 'en-US',
} satisfies MediaAssetRef;

describe('media asset contract', () => {
  it('carries the accepted additive media metadata', () => {
    expect(media.sources[0].bitrate).toBe(2_500_000);
    expect(media.poster).toContain('poster');
    expect(media.thumbnail).toContain('thumbnail');
    expect(media.durationSeconds).toBe(84.5);
    expect(media.tracks[0]).toMatchObject({ kind: 'captions', default: true });
    expect(media.transcript).toBe(transcript);
  });

  it('pins the complete accepted text-track vocabulary', () => {
    expect(trackKinds).toEqual(['captions', 'subtitles', 'descriptions', 'chapters', 'metadata']);
  });
});
