/**
 * The chrome's language: the locale a player publishes, else the item's
 * declared `language`, else `en-US`. The item's `language` stays the content
 * language on the stimulus root, unset for an item that declares none, and
 * authored `uiText` overrides apply in every locale.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';
import { model as buildViewModel } from '../src/controller/index.js';
import VideoStimulusElement from '../src/delivery/index.js';
import type { VideoStimulusModel } from '../src/types.js';

const TAG = 'test-video-stimulus-interface-locale';

const QUESTION: VideoStimulusModel = {
  element: 'video-stimulus',
  media: {
    version: 1,
    id: 'video-1',
    kind: 'video',
    label: 'Lab safety demonstration',
    lang: 'en',
    sources: [{ src: 'https://cdn.example.org/video.mp4', type: 'video/mp4' }],
    transcript: { lang: 'en', plainText: 'Wear goggles.' },
  },
};

type Publish = (locale: string) => void;

/** A stand-in player answering the element's interface-locale subscription; `publish` changes it. */
function mountPlayer(locale: string): { player: HTMLElement; publish: Publish } {
  const player = document.createElement('div');
  const subscribers: Array<(value: unknown) => void> = [];
  player.addEventListener('context-request', (event) => {
    const request = event as Event & { context?: unknown; callback?: (value: unknown) => void };
    if (request.context !== interfaceLocaleContext || !request.callback) return;
    event.stopPropagation();
    subscribers.push(request.callback);
    request.callback({ locale, direction: 'ltr' });
  });
  document.body.appendChild(player);
  const publish: Publish = (next) => {
    for (const callback of subscribers) callback({ locale: next, direction: 'ltr' });
  };
  return { player, publish };
}

function render(question: VideoStimulusModel, parent: HTMLElement = document.body) {
  const element = document.createElement(TAG) as HTMLElement & { model: unknown };
  parent.appendChild(element);
  element.model = buildViewModel(question, undefined, { mode: 'gather' });
  return element;
}

const toggleLabel = (element: HTMLElement) =>
  element.querySelector('.media-transcript__toggle')?.textContent?.trim();

beforeAll(() => {
  if (!customElements.get(TAG)) customElements.define(TAG, VideoStimulusElement);
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('video-stimulus interface locale', () => {
  it('renders the chrome in the player locale, with no English frame first', async () => {
    const { player } = mountPlayer('es');
    const element = render(QUESTION, player);
    flushSync();
    expect(element.textContent).not.toContain('Show transcript');

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Mostrar transcripción'));
    expect(element.querySelector('.media-transcript__toggle')?.getAttribute('lang')).toBe('es');
    expect(element.querySelector('.media-transcript__region')?.getAttribute('aria-label')).toBe(
      'Transcripción del video'
    );
  });

  it('follows a locale the player changes after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const element = render(QUESTION, player);
    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Show transcript'));

    publish('nl-NL');

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Transcriptie weergeven'));
  });

  it('stamps no lang for an item that declares no language', async () => {
    const { player } = mountPlayer('es');
    const element = render(QUESTION, player);
    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Mostrar transcripción'));

    expect(element.hasAttribute('lang')).toBe(false);
    expect(element.querySelector('.video-stimulus')?.hasAttribute('lang')).toBe(false);
  });

  it('renders Spanish chrome for an item declaring Spanish with no player', async () => {
    const element = render({ ...QUESTION, language: 'es-MX' });

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Mostrar transcripción'));
    expect(element.querySelector('.video-stimulus')?.getAttribute('lang')).toBe('es-MX');
  });

  it('applies authored overrides under any player locale', async () => {
    const { player } = mountPlayer('fr');
    const element = render({ ...QUESTION, uiText: { showTranscript: 'Read along' } }, player);

    await vi.waitFor(() =>
      expect(element.querySelector('.media-transcript__region')?.getAttribute('aria-label')).toBe(
        'Transcription de la vidéo'
      )
    );
    expect(toggleLabel(element)).toBe('Read along');
  });
});
