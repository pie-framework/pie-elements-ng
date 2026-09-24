/**
 * `customAudioButton` swaps the native audio control for a two-image button:
 * `playImage` is the idle state, `pauseImage` the playing state. The button
 * has to start in the state the audio is actually in, or the click handler's
 * "already playing" guard swallows the first click.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

// The prompt renders math on mount, which pulls MathJax off a CDN - it has no
// bearing on the audio button and only fails noisily under happy-dom.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { PreviewPrompt } = await import('../src/preview-prompt');

const PLAY_IMAGE = 'https://example.test/bird-silent.png';
const PAUSE_IMAGE = 'https://example.test/bird-playing.png';

const PROMPT = [
  '<p>Pick the letter.</p>',
  '<audio id="sample.mp3">',
  '<source src="https://example.test/sample.mp3" type="audio/mpeg">',
  '</audio>',
].join('');

let play: ReturnType<typeof vi.fn>;
let paused: boolean;

function stubPlayback(impl: () => Promise<void>) {
  play = vi.fn(impl);
  // happy-dom's play() is a no-op stub that never flips `paused`; the
  // component reads both, so they are driven explicitly here.
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    writable: true,
    value: play,
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
    configurable: true,
    get: () => paused,
  });
}

function render(autoplayAudioEnabled?: boolean) {
  const host = document.createElement('div');
  document.body.appendChild(host);

  act(() => {
    createRoot(host).render(
      React.createElement(PreviewPrompt as any, {
        prompt: PROMPT,
        autoplayAudioEnabled,
        customAudioButton: { playImage: PLAY_IMAGE, pauseImage: PAUSE_IMAGE },
      }),
    );
  });

  return document.getElementById('play-audio-button') as HTMLElement;
}

beforeEach(() => {
  document.body.innerHTML = '';
  paused = true;
  stubPlayback(() => Promise.resolve());
});

describe('preview prompt custom audio button', () => {
  it('starts on the idle image when autoplay is off', () => {
    const button = render(false);

    expect(button).toBeTruthy();
    expect(button.style.backgroundImage).toContain(PLAY_IMAGE);
  });

  it('plays on click when autoplay is off', () => {
    const button = render(false);

    button.dispatchEvent(new Event('click'));

    expect(play).toHaveBeenCalledTimes(1);
  });

  // No controller defaults `autoplayAudioEnabled`, so an item that does not set
  // it reaches delivery as undefined. The initial image tracks whether play()
  // is called - which is a truthy check - not whether the author opted out.
  it('starts on the idle image and does not autoplay when autoplay is unset', () => {
    const button = render(undefined);

    expect(button.style.backgroundImage).toContain(PLAY_IMAGE);
    expect(play).not.toHaveBeenCalled();

    button.dispatchEvent(new Event('click'));

    expect(play).toHaveBeenCalledTimes(1);
  });

  it('starts on the playing image and autoplays when autoplay is on', () => {
    const button = render(true);

    expect(button.style.backgroundImage).toContain(PAUSE_IMAGE);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('ignores a click while the audio is already playing', () => {
    const button = render(false);
    paused = false;

    button.dispatchEvent(new Event('click'));

    expect(play).not.toHaveBeenCalled();
  });

  it('falls back to the idle image and stays clickable when autoplay is blocked', async () => {
    stubPlayback(() => Promise.reject(new Error('NotAllowedError')));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const button = render(true);
    await act(async () => {});

    expect(button.style.backgroundImage).toContain(PLAY_IMAGE);

    button.dispatchEvent(new Event('click'));

    expect(play).toHaveBeenCalledTimes(2);
  });
});
