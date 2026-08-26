import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { model as buildViewModel } from '../src/controller/index.js';
import VideoStimulusElement, { VideoStimulusComponent } from '../src/delivery/index.js';
import type { VideoStimulusModel, VideoStimulusViewModel } from '../src/types.js';

const TAG = 'test-video-stimulus-delivery';
type Mounted = ReturnType<typeof mount>;

function authoredModel(source = 'https://cdn.example.org/video.mp4'): VideoStimulusModel {
  return {
    element: 'video-stimulus',
    language: 'en',
    media: {
      version: 1,
      id: 'video-1',
      kind: 'video',
      label: 'Lab safety demonstration',
      description: 'Watch the safe handling procedure.',
      lang: 'en',
      poster: 'https://cdn.example.org/poster.jpg',
      sources: [{ src: source, type: 'video/mp4' }],
      tracks: [
        {
          src: 'https://cdn.example.org/captions.vtt',
          kind: 'captions',
          lang: 'en',
          label: 'English captions',
          default: true,
        },
      ],
      transcript: {
        lang: 'en',
        html: '<p><strong>Narrator:</strong> Wear goggles.</p><script>alert(1)</script>',
      },
    },
    presentation: {
      showLabel: true,
      showDescription: true,
      transcriptInitiallyExpanded: false,
    },
    accessibilityProfile: {
      audioContent: 'meaningful',
      captionSupport: 'track',
      visualSupport: 'described',
    },
  };
}

function viewModel(mode = 'gather', source?: string): VideoStimulusViewModel {
  return buildViewModel(authoredModel(source), undefined, { mode });
}

const mountedComponents: Array<{ target: HTMLElement; component: Mounted }> = [];

function requiredElement<T extends Element>(target: ParentNode, selector: string): T {
  const element = target.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector} to be rendered`);
  return element;
}

function mountComponent(model: VideoStimulusViewModel = viewModel()): {
  target: HTMLElement;
  component: Mounted;
} {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(VideoStimulusComponent, { target, props: { model } });
  mountedComponents.push({ target, component });
  flushSync();
  return { target, component };
}

beforeAll(() => {
  if (!customElements.get(TAG)) customElements.define(TAG, VideoStimulusElement);
});

let loadSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  loadSpy = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const mounted of mountedComponents.splice(0)) {
    unmount(mounted.component);
    mounted.target.remove();
  }
  document.body.replaceChildren();
  loadSpy.mockRestore();
});

describe('video-stimulus delivery', () => {
  it('renders one light-DOM video with native playback attributes and ordered children', () => {
    const { target } = mountComponent();
    expect(target.querySelectorAll('video')).toHaveLength(1);
    const video = requiredElement<HTMLVideoElement>(target, 'video');
    expect(video.controls).toBe(true);
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.getAttribute('preload')).toBe('metadata');
    expect(video.hasAttribute('autoplay')).toBe(false);
    expect(video.hasAttribute('loop')).toBe(false);
    expect(video.getAttribute('poster')).toBe('https://cdn.example.org/poster.jpg');
    expect(video.querySelectorAll(':scope > source')).toHaveLength(1);
    expect(video.querySelectorAll(':scope > track')).toHaveLength(1);
    expect(video.querySelector('track')?.getAttribute('srclang')).toBe('en');
  });

  it('keeps the same playable native surface in gather, view, and evaluate modes', () => {
    for (const mode of ['gather', 'view', 'evaluate']) {
      const { target } = mountComponent(viewModel(mode));
      expect(target.querySelector('video')?.controls).toBe(true);
    }
  });

  it('renders the shared transcript before video and removes unsafe markup', () => {
    const { target } = mountComponent();
    const video = requiredElement<HTMLVideoElement>(target, 'video');
    const transcript = requiredElement<HTMLElement>(target, '.media-transcript');
    expect(
      transcript.compareDocumentPosition(video) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(transcript).toHaveTextContent('Wear goggles');
    expect(target.querySelector('script')).toBeNull();
  });

  it('visually hides the label without removing its accessible text', () => {
    const hiddenLabel = authoredModel();
    hiddenLabel.presentation = { ...hiddenLabel.presentation, showLabel: false };
    const { target } = mountComponent(buildViewModel(hiddenLabel, undefined, { mode: 'view' }));
    const caption = target.querySelector('figcaption');
    expect(caption).toHaveClass('visually-hidden');
    expect(caption).toHaveTextContent('Lab safety demonstration');
  });

  it('preserves the video node and calls load when sources change', () => {
    const { target, component } = mountComponent(
      viewModel('view', 'https://cdn.example.org/first.mp4')
    );
    const firstVideo = target.querySelector('video');
    loadSpy.mockClear();
    (component as unknown as { model: VideoStimulusViewModel }).model = viewModel(
      'view',
      'https://cdn.example.org/second.mp4'
    );
    flushSync();
    expect(target.querySelector('video')).toBe(firstVideo);
    expect(target.querySelector('source')?.getAttribute('src')).toBe(
      'https://cdn.example.org/second.mp4'
    );
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps a failure and focused retry control available until media succeeds', () => {
    const { target } = mountComponent();
    const video = requiredElement<HTMLVideoElement>(target, 'video');
    video.dispatchEvent(new Event('error'));
    flushSync();
    const status = target.querySelector('[role="alert"]');
    const retry = target.querySelector('.retry-button') as HTMLButtonElement;
    expect(status).toHaveTextContent('Video unavailable');
    retry.focus();
    retry.click();
    flushSync();
    expect(document.activeElement).toBe(retry);
    expect(target.querySelector('[role="alert"]')).not.toBeNull();
    expect(loadSpy).toHaveBeenCalled();
    video.dispatchEvent(new Event('loadeddata'));
    flushSync();
    expect(target.querySelector('[role="alert"]')).toBeNull();
    expect(document.activeElement).toBe(video);
  });

  it('keeps every text-track failure persistent until each failed track loads', () => {
    const candidate = authoredModel();
    candidate.media.tracks = [
      ...(candidate.media.tracks ?? []),
      {
        src: 'https://cdn.example.org/captions-es.vtt',
        kind: 'captions',
        lang: 'es',
        label: 'Spanish captions',
      },
    ];
    const { target } = mountComponent(buildViewModel(candidate, undefined, { mode: 'view' }));
    const video = requiredElement<HTMLVideoElement>(target, 'video');
    const tracks = Array.from(target.querySelectorAll<HTMLTrackElement>('track'));
    tracks[0].dispatchEvent(new Event('error'));
    tracks[1].dispatchEvent(new Event('error'));
    flushSync();
    expect(target.querySelector('[role="alert"]')).toHaveTextContent('English captions');
    expect(target.querySelector('[role="alert"]')).toHaveTextContent('Spanish captions');
    video.dispatchEvent(new Event('canplay'));
    flushSync();
    tracks[0].dispatchEvent(new Event('load'));
    flushSync();
    expect(target.querySelector('[role="alert"]')).toHaveTextContent('Spanish captions');
    tracks[1].dispatchEvent(new Event('load'));
    flushSync();
    expect(target.querySelector('[role="alert"]')).toBeNull();
  });

  it('keeps learner UI and authored media languages distinct', () => {
    const candidate = authoredModel();
    candidate.language = 'es-MX';
    candidate.media.lang = 'en-US';
    candidate.media.transcript = { plainText: 'English transcript' };
    candidate.uiText = { showTranscript: '   ' };
    const { target } = mountComponent(buildViewModel(candidate, undefined, { mode: 'view' }));

    expect(target.querySelector('.video-stimulus')?.getAttribute('lang')).toBe('es-MX');
    expect(target.querySelector('figcaption')?.getAttribute('lang')).toBe('en-US');
    expect(target.querySelector('.media-transcript__toggle')).toHaveTextContent(
      'Mostrar transcripción'
    );
    expect(target.querySelector('.media-transcript__region')?.getAttribute('lang')).toBe('en-US');
    const video = requiredElement<HTMLVideoElement>(target, 'video');
    video.dispatchEvent(new Event('error'));
    flushSync();
    expect(target.querySelector('[role="alert"]')).toHaveTextContent('Video no disponible');
  });

  it('dispatches model-set but no Session events from the wrapper', () => {
    const element = document.createElement(TAG) as InstanceType<typeof VideoStimulusElement>;
    const modelSet = vi.fn();
    const sessionChanged = vi.fn();
    element.addEventListener('model-set', modelSet);
    element.addEventListener('session-changed', sessionChanged);
    element.model = viewModel();
    expect(element.shadowRoot).toBeNull();
    expect(modelSet).toHaveBeenCalledTimes(1);
    expect(sessionChanged).not.toHaveBeenCalled();
  });

  it('omits video entirely when no safe sources remain', () => {
    const unsafe = authoredModel('javascript:alert(1)');
    const { target } = mountComponent(buildViewModel(unsafe, undefined, { mode: 'view' }));
    expect(target.querySelector('video')).toBeNull();
    expect(target.querySelector('[role="alert"]')).toHaveTextContent('No playable video source');
  });
});
