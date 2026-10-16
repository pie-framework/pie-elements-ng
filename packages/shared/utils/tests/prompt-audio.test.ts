import { describe, expect, it, vi } from 'vitest';
import { autoplayAudioOn, promptAudioPending, trackPromptAudioFailure } from '../src/prompt-audio';

const root = (html: string) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
};

const PROMPT = '<div class="preview-prompt"><audio><source src="a.mp3"></audio></div>';

describe('autoplayAudioOn', () => {
  it.each([
    [{}, false],
    [{ autoplayAudioEnabled: true }, true],
    [{ autoplayAudioEnabled: true, autoplayAudioHeld: true }, false],
    [{ autoplayAudioHeld: true }, false],
  ])('%o -> %s', (fields, expected) => {
    expect(autoplayAudioOn(fields)).toBe(expected);
  });
});

describe('promptAudioPending', () => {
  it('waits on prompt audio with a source', () => {
    expect(promptAudioPending(root(PROMPT), {}, false)).toBe(true);
    expect(
      promptAudioPending(
        root('<div class="preview-prompt"><audio src="a.mp3"></audio></div>'),
        {},
        false
      )
    ).toBe(true);
  });

  it.each([
    ['no audio', '<div class="preview-prompt"></div>'],
    ['audio outside the prompt', '<audio src="a.mp3"></audio>'],
    ['audio without a source', '<div class="preview-prompt"><audio><source src=""></audio></div>'],
  ])('does not wait with %s', (_, html) => {
    expect(promptAudioPending(root(html), {}, false)).toBe(false);
  });

  it('does not wait once this mount or a resumed session has played it', () => {
    expect(promptAudioPending(root(PROMPT), {}, true)).toBe(false);
    expect(promptAudioPending(root(PROMPT), { audioEndTime: 1 }, false)).toBe(false);
  });

  it('stops waiting when a source fails to load', () => {
    const el = root(PROMPT);
    const audio = el.querySelector('audio') as HTMLAudioElement;
    const onFailure = vi.fn();
    const stop = trackPromptAudioFailure(audio, onFailure);

    (audio.querySelector('source') as HTMLSourceElement).dispatchEvent(new Event('error'));

    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(promptAudioPending(el, {}, false)).toBe(false);

    stop();
    audio.dispatchEvent(new Event('error'));
    expect(onFailure).toHaveBeenCalledTimes(1);
  });
});
