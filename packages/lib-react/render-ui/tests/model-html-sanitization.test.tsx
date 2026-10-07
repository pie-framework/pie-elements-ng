// @vitest-environment jsdom
// DOMPurify needs jsdom here; vitest.setup.ts says why.
/**
 * Players hand models to elements verbatim, so the components that write a model's rich
 * text into the DOM sanitize it: inline handlers and scripts never reach the page.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';

// The prompt renders math on mount, which pulls MathJax off a CDN - it has no
// bearing on sanitization and only fails noisily under happy-dom.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { PreviewPrompt } = await import('../src/preview-prompt');
const { Feedback } = await import('../src/feedback');
const { default: HtmlAndMath } = await import('../src/html-and-math');

// The shape of the Star listening prompts: an image link whose inline handler plays the audio.
const STAR_PROMPT =
  '<p>Listen, then choose.</p>' +
  '<audio id="listen.mp3"><source src="https://example.test/listen.mp3" type="audio/mpeg"></audio>' +
  '<a href="#" onclick="window.__handlerRan = true; return false;">' +
  '<img src="https://example.test/listen.svg" height="128" width="128"></a>';

let root: Root | undefined;
let host: HTMLElement | undefined;

function render(element: React.ReactElement) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root?.render(element));
  return host;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = undefined;
  host = undefined;
  delete (window as any).__handlerRan;
});

describe('model HTML sanitization', () => {
  it('renders the Star audio prompt without its inline play handler', () => {
    const container = render(<PreviewPrompt prompt={STAR_PROMPT} />);
    const link = container.querySelector('a') as HTMLAnchorElement;

    expect(link.hasAttribute('onclick')).toBe(false);
    expect(link.getAttribute('href')).toBe('#');
    expect(link.querySelector('img')?.getAttribute('src')).toBe('https://example.test/listen.svg');
    expect(container.querySelector('audio source')?.getAttribute('src')).toBe('https://example.test/listen.mp3');

    (link.querySelector('img') as HTMLElement).click();
    expect((window as any).__handlerRan).toBeUndefined();
  });

  it('keeps the prompt audio and its custom play button', () => {
    const container = render(
      <PreviewPrompt
        prompt={'<p>Listen.</p><audio src="https://example.test/a.mp3" onplay="alert(1)"></audio>'}
        customAudioButton={{ playImage: 'https://example.test/play.png', pauseImage: 'https://example.test/pause.png' }}
      />,
    );

    expect(container.querySelector('audio')?.hasAttribute('onplay')).toBe(false);
    expect(container.querySelector('audio source')?.getAttribute('src')).toBe('https://example.test/a.mp3');
    expect(container.querySelector('button.play-audio-button')).not.toBeNull();
  });

  it.each([
    ['PreviewPrompt', (html: string) => <PreviewPrompt prompt={html} />],
    ['Feedback', (html: string) => <Feedback correctness="correct" feedback={html} />],
    ['HtmlAndMath', (html: string) => <HtmlAndMath html={html} />],
  ])('%s drops scripts, handlers and javascript: links', (_name, element) => {
    const container = render(
      element(
        '<p>Text <a href="javascript:alert(1)">link</a></p>' +
          '<img src="x.png" onerror="alert(1)"><script>alert(1)</script>',
      ),
    );

    expect(container.textContent).toContain('Text link');
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
    expect(container.querySelector('a')?.hasAttribute('href')).toBe(false);
  });
});
