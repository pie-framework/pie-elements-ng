import { describe, expect, it } from 'vitest';
import { computeAudioMode } from './computeAudioMode';

describe('computeAudioMode', () => {
  it('C1: no audio → none regardless of audioUrl', () => {
    expect(
      computeAudioMode({
        hasAudio: false,
        audioUrl: 'http://example.com/a.mp3',
        useFeatureButtonAudio: true,
      })
    ).toBe('none');
  });

  it('C2: audio enabled but no audioUrl → error', () => {
    expect(
      computeAudioMode({ hasAudio: true, audioUrl: undefined, useFeatureButtonAudio: false })
    ).toBe('error');
  });

  it('C3: audio enabled, url present, feature button → feature-button', () => {
    expect(
      computeAudioMode({
        hasAudio: true,
        audioUrl: 'http://example.com/a.mp3',
        useFeatureButtonAudio: true,
      })
    ).toBe('feature-button');
  });

  it('C4: audio enabled, url present, no feature button → controls', () => {
    expect(
      computeAudioMode({
        hasAudio: true,
        audioUrl: 'http://example.com/a.mp3',
        useFeatureButtonAudio: false,
      })
    ).toBe('controls');
  });
});
