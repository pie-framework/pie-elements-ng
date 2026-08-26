import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { AuthorComponent } from '../src/author/index.js';
import type { VideoStimulusModel } from '../src/types.js';

type Mounted = ReturnType<typeof mount>;

function authorModel(): VideoStimulusModel {
  return {
    element: 'video-stimulus',
    language: 'en',
    media: {
      version: 1,
      id: 'author-video',
      kind: 'video',
      label: 'Authoring video',
      lang: 'en',
      sources: [
        { src: 'https://cdn.example.org/first.mp4', type: 'video/mp4' },
        { src: 'https://cdn.example.org/second.webm', type: 'video/webm' },
      ],
      tracks: [],
      transcript: { plainText: 'A complete transcript.', lang: 'en' },
    },
    presentation: {
      showLabel: true,
      showDescription: true,
      transcriptInitiallyExpanded: false,
    },
    accessibilityProfile: {
      audioContent: 'none',
      captionSupport: 'notRequired',
      visualSupport: 'notMeaningful',
    },
  };
}

const mountedComponents: Array<{ target: HTMLElement; component: Mounted }> = [];

function mountAuthor(
  onChange = vi.fn(),
  locale = 'en'
): {
  target: HTMLElement;
  onChange: ReturnType<typeof vi.fn>;
  original: VideoStimulusModel;
} {
  const original = authorModel();
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(AuthorComponent, {
    target,
    props: { model: original, onChange, locale },
  });
  mountedComponents.push({ target, component });
  flushSync();
  return { target, onChange, original };
}

afterEach(() => {
  for (const mounted of mountedComponents.splice(0)) {
    unmount(mounted.component);
    mounted.target.remove();
  }
  document.body.replaceChildren();
});

describe('video-stimulus author', () => {
  it('renders a real delivery preview', () => {
    const { target } = mountAuthor();
    expect(target.querySelector('.preview-surface video')).not.toBeNull();
    expect(target.querySelector('.preview-surface source')?.getAttribute('src')).toBe(
      'https://cdn.example.org/first.mp4'
    );
  });

  it('adds sources through immutable onChange updates', () => {
    const { target, onChange, original } = mountAuthor();
    (target.querySelector('[data-testid="add-source"]') as HTMLButtonElement).click();
    flushSync();
    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0] as VideoStimulusModel;
    expect(updated).not.toBe(original);
    expect(updated.media).not.toBe(original.media);
    expect(updated.media.sources).toHaveLength(3);
    expect(original.media.sources).toHaveLength(2);
  });

  it('supports keyboard-operable source reordering and removal buttons', () => {
    const { target, onChange } = mountAuthor();
    const moveDown = target.querySelector(
      'button[aria-label="Move down: Source 1"]'
    ) as HTMLButtonElement;
    moveDown.click();
    flushSync();
    const reordered = onChange.mock.calls.at(-1)?.[0] as VideoStimulusModel;
    expect(reordered.media.sources.map((source) => source.src)).toEqual([
      'https://cdn.example.org/second.webm',
      'https://cdn.example.org/first.mp4',
    ]);

    const remove = target.querySelector(
      'button[aria-label="Remove: Source 1"]'
    ) as HTMLButtonElement;
    remove.click();
    flushSync();
    const removed = onChange.mock.calls.at(-1)?.[0] as VideoStimulusModel;
    expect(removed.media.sources).toHaveLength(1);
  });

  it('enforces one default track in author updates', () => {
    const { target, onChange } = mountAuthor();
    const addTrack = target.querySelector('[data-testid="add-track"]') as HTMLButtonElement;
    addTrack.click();
    flushSync();
    addTrack.click();
    flushSync();
    const trackDefaults = Array.from(
      target.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    ).filter((checkbox) => checkbox.parentElement?.textContent?.includes('Default track'));
    trackDefaults[0].click();
    flushSync();
    trackDefaults[1].click();
    flushSync();
    const updated = onChange.mock.calls.at(-1)?.[0] as VideoStimulusModel;
    expect(updated.media.tracks?.filter((track) => track.default)).toHaveLength(1);
    expect(updated.media.tracks?.[1].default).toBe(true);
  });

  it('adjusts the editor/preview split with keyboard controls', () => {
    const { target } = mountAuthor();
    const splitter = target.querySelector('input[type="range"]') as HTMLInputElement;
    expect(splitter.value).toBe('48');
    splitter.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(splitter.value).toBe('50');
    splitter.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    flushSync();
    expect(splitter.value).toBe('70');
  });

  it('shows strict publish errors linked to exact controls', () => {
    const { target } = mountAuthor();
    const assetId = target.querySelector('input[id$="-media-id"]') as HTMLInputElement;
    assetId.value = '';
    assetId.dispatchEvent(new Event('change', { bubbles: true }));
    const publishReview = Array.from(target.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Review for publish')
    ) as HTMLButtonElement;
    publishReview.click();
    flushSync();
    expect(target.querySelector(`a[href="#${assetId.id}"]`)).not.toBeNull();
    expect(assetId.getAttribute('aria-invalid')).toBe('true');
  });

  it('uses unique light-DOM IDs for multiple author instances', () => {
    const first = mountAuthor().target;
    const second = mountAuthor().target;
    const ids = [
      ...first.querySelectorAll<HTMLElement>('[id]'),
      ...second.querySelectorAll<HTMLElement>('[id]'),
    ]
      .map((element) => element.id)
      .filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('marks and localizes the Spanish authoring surface and track guidance', () => {
    const { target } = mountAuthor(vi.fn(), 'es-MX');
    expect(target.querySelector('.video-stimulus-author')?.getAttribute('lang')).toBe('es');
    expect(target.querySelector('h1')).toHaveTextContent('Estímulo de video');
    expect(target.querySelector('.section-help')).toHaveTextContent('subtítulos descriptivos');
    const assetId = target.querySelector('input[id$="-media-id"]') as HTMLInputElement;
    assetId.value = '';
    assetId.dispatchEvent(new Event('change', { bubbles: true }));
    const publishReview = Array.from(target.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Revisar para publicar')
    ) as HTMLButtonElement;
    publishReview.click();
    flushSync();
    expect(target.querySelector(`a[href="#${assetId.id}"]`)).toHaveTextContent(
      'Se requiere el ID del recurso'
    );
    (target.querySelector('[data-testid="add-track"]') as HTMLButtonElement).click();
    flushSync();
    expect(target.querySelector('select option[value="captions"]')).toHaveTextContent(
      'Subtítulos descriptivos'
    );
  });
});
