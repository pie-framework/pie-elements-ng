/**
 * Two audio prompts on one page: each gets its own audio and play-button ids,
 * and each one's autoplay, button and play/pause state touch only its own audio.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';

// The prompt renders math on mount, which pulls MathJax off a CDN - it has no
// bearing on the audio wiring and only fails noisily under happy-dom.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { PreviewPrompt } = await import('../src/preview-prompt');

const PLAY_IMAGE = 'https://example.test/play.png';
const PAUSE_IMAGE = 'https://example.test/pause.png';

const prompt = (name: string, text = 'Listen.') => `<p>${text}</p><audio src="https://example.test/${name}.mp3"></audio>`;

interface Item {
  host: HTMLElement;
  root: Root;
  render: (props?: Record<string, unknown>) => void;
  audio: () => HTMLAudioElement;
  button: () => HTMLElement;
}

function mount(name: string, props: Record<string, unknown> = {}): Item {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const render = (next: Record<string, unknown> = {}) =>
    act(() => {
      root.render(
        React.createElement(PreviewPrompt as any, {
          prompt: prompt(name),
          customAudioButton: { playImage: PLAY_IMAGE, pauseImage: PAUSE_IMAGE },
          ...props,
          ...next,
        }),
      );
    });
  render();

  return {
    host,
    root,
    render,
    audio: () => host.querySelector('audio') as HTMLAudioElement,
    button: () => host.querySelector('.play-audio-button') as HTMLElement,
  };
}

const ids = () => [...document.querySelectorAll('[id]')].map((el) => el.id);

let play: ReturnType<typeof vi.spyOn>;
const mounted: Item[] = [];
const item = (name: string, props?: Record<string, unknown>) => {
  const mountedItem = mount(name, props);
  mounted.push(mountedItem);
  return mountedItem;
};

beforeEach(() => {
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});

afterEach(() => {
  for (const { root } of mounted.splice(0)) act(() => root.unmount());
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('preview prompt audio ids', () => {
  it('gives each prompt its own audio and play-button ids', () => {
    const a = item('a');
    const b = item('b');

    expect(new Set(ids()).size).toBe(ids().length);
    expect(a.audio().classList).toContain('pie-prompt-audio-player');
    expect(a.audio().id).toMatch(/^pie-prompt-audio-player-/);
    expect(a.button().id).toMatch(/^play-audio-button-/);
    expect(a.audio().id).not.toBe(b.audio().id);
    expect(a.button().id).not.toBe(b.button().id);
  });

  it('autoplays each prompt on its own audio', () => {
    const a = item('a', { autoplayAudioEnabled: true });
    const b = item('b', { autoplayAudioEnabled: true });

    expect(play.mock.contexts).toEqual([a.audio(), b.audio()]);
  });

  it('plays only the clicked prompt’s audio', () => {
    item('a');
    const b = item('b');

    act(() => b.button().click());

    expect(play.mock.contexts).toEqual([b.audio()]);
  });

  it('updates only the button whose audio plays or pauses', () => {
    const a = item('a');
    const b = item('b');

    act(() => {
      b.audio().dispatchEvent(new Event('play'));
    });
    expect(b.button().style.backgroundImage).toContain(PAUSE_IMAGE);
    expect(a.button().style.backgroundImage).toContain(PLAY_IMAGE);

    act(() => {
      a.audio().dispatchEvent(new Event('play'));
      b.audio().dispatchEvent(new Event('pause'));
    });
    expect(a.button().style.backgroundImage).toContain(PAUSE_IMAGE);
    expect(b.button().style.backgroundImage).toContain(PLAY_IMAGE);
  });

  it('keeps its ids when the prompt re-renders', () => {
    const a = item('a');
    const before = { audio: a.audio().id, button: a.button().id };

    a.render({ className: 'changed' });
    a.render({ prompt: prompt('a', 'Listen again.') });

    expect(a.host.textContent).toContain('Listen again.');
    expect({ audio: a.audio().id, button: a.button().id }).toEqual(before);
  });

  it('leaves the other prompt working when one unmounts', () => {
    const a = item('a');
    const b = item('b');

    act(() => a.root.unmount());
    mounted.splice(mounted.indexOf(a), 1);
    act(() => b.button().click());

    expect(play.mock.contexts).toEqual([b.audio()]);
  });
});
