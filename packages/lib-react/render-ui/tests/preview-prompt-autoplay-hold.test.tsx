/**
 * The item player writes `autoplayAudioHeld` onto the model when the host holds autoplay. A hold
 * outranks `autoplayAudioEnabled`: the prompt audio does not start on its own and the learner gets
 * a control to start it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { PreviewPrompt } = await import('../src/preview-prompt');

const PLAY_IMAGE = 'https://example.test/bird-silent.png';
const PAUSE_IMAGE = 'https://example.test/bird-playing.png';
const AUDIO = '<p>Listen.</p><audio src="https://example.test/sample.mp3"></audio>';

let play: ReturnType<typeof vi.fn>;

function render(props: Record<string, unknown>) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  act(() => {
    createRoot(host).render(React.createElement(PreviewPrompt as any, { prompt: AUDIO, ...props }));
  });
  return host;
}

beforeEach(() => {
  document.body.innerHTML = '';
  play = vi.fn(() => Promise.resolve());
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    writable: true,
    value: play,
  });
});

describe('preview prompt autoplay hold', () => {
  it('autoplays without native controls when autoplay is on', () => {
    const host = render({ autoplayAudioEnabled: true });

    expect(play).toHaveBeenCalledTimes(1);
    expect(host.querySelector('audio')?.hasAttribute('controls')).toBe(false);
  });

  it('does not autoplay when autoplay is held, and shows native controls', () => {
    const host = render({ autoplayAudioEnabled: true, autoplayAudioHeld: true });

    expect(play).not.toHaveBeenCalled();
    expect(host.querySelector('audio')?.hasAttribute('controls')).toBe(true);
  });

  it('shows native controls when autoplay is off', () => {
    const host = render({ autoplayAudioEnabled: false });

    expect(host.querySelector('audio')?.hasAttribute('controls')).toBe(true);
  });

  it('leaves the controls to a play link that targets the audio', () => {
    const host = render({
      prompt:
        '<audio id="a.mp3" src="https://example.test/a.mp3"></audio>' +
        '<a href="#" onclick="document.getElementById(\'a.mp3\').play(); return false;">listen</a>',
      autoplayAudioHeld: true,
    });

    expect(host.querySelector('audio')?.hasAttribute('controls')).toBe(false);
  });

  it('puts a held custom button in its idle state', () => {
    const host = render({
      autoplayAudioEnabled: true,
      autoplayAudioHeld: true,
      customAudioButton: { playImage: PLAY_IMAGE, pauseImage: PAUSE_IMAGE },
    });
    const button = host.querySelector('.play-audio-button') as HTMLElement;

    expect(play).not.toHaveBeenCalled();
    expect(button.style.backgroundImage).toContain(PLAY_IMAGE);
    expect(host.querySelector('audio')?.hasAttribute('controls')).toBe(false);
  });

  it('gives audio the model declares without a source no source', () => {
    const host = render({ prompt: '<audio></audio>' });

    expect(host.querySelector('audio source')).toBeNull();
  });
});
