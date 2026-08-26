// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import TranscriptDefault, { Transcript } from '../src/index.js';
import type { TranscriptProps } from '../src/types.js';

const mounts: Array<{ target: HTMLElement; component: ReturnType<typeof mount> }> = [];

function mountTranscript(props: TranscriptProps): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(Transcript, { target, props });
  mounts.push({ target, component });
  flushSync();
  return target;
}

afterEach(() => {
  for (const { target, component } of mounts.splice(0)) {
    unmount(component);
    target.remove();
  }
});

describe('Transcript', () => {
  it('exports the component as both the default and named value', () => {
    expect(TranscriptDefault).toBe(Transcript);
  });

  it('renders a native collapsed disclosure and labelled normal-flow region', () => {
    const target = mountTranscript({
      transcript: { plainText: 'First line\nSecond line', lang: 'en-US' },
      label: 'Video transcript',
    });
    const button = target.querySelector('button');
    const region = target.querySelector('section');

    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.getAttribute('aria-expanded')).toBe('false');
    expect(button?.getAttribute('aria-controls')).toBe(region?.id);
    expect(region?.getAttribute('aria-label')).toBe('Video transcript');
    expect(region?.getAttribute('lang')).toBe('en-US');
    expect(region?.hidden).toBe(true);
    expect(region?.hasAttribute('aria-live')).toBe(false);
    expect(region?.getAttribute('role')).toBeNull();

    button?.click();
    flushSync();

    expect(button?.getAttribute('aria-expanded')).toBe('true');
    expect(button?.textContent?.trim()).toBe('Hide transcript');
    expect(region?.hidden).toBe(false);
    expect(document.activeElement).not.toBe(region);
  });

  it('separates localized controls from inherited transcript content language', () => {
    const target = mountTranscript({
      transcript: { plainText: 'English transcript' },
      label: 'Transcripción del video',
      language: 'es-ES',
      contentLanguage: 'en-US',
      initiallyExpanded: true,
      uiText: { hideTranscript: 'Cerrar transcripción' },
    });

    expect(target.querySelector('button')?.getAttribute('aria-expanded')).toBe('true');
    expect(target.querySelector('button')?.textContent?.trim()).toBe('Cerrar transcripción');
    expect(target.querySelector('section')?.getAttribute('lang')).toBe('en-US');
    expect(target.querySelector('section')?.hidden).toBe(false);
  });

  it('uses sanitized inline HTML before plain text and an external link', () => {
    const target = mountTranscript({
      transcript: {
        html: '<p onclick="alert(1)">Inline <strong>transcript</strong></p>',
        plainText: 'Plain fallback',
        src: 'https://example.test/transcript',
      },
      label: 'Video transcript',
      initiallyExpanded: true,
    });

    expect(target.querySelector('strong')?.textContent).toBe('transcript');
    expect(target.textContent).not.toContain('Plain fallback');
    expect(target.querySelector('a')).toBeNull();
    expect(target.querySelector('p')?.getAttribute('onclick')).toBeNull();
  });

  it('falls back from empty sanitized HTML to plain text, then to an external link', () => {
    const plainTarget = mountTranscript({
      transcript: {
        html: '<script>alert(1)</script>',
        plainText: 'Plain fallback',
        src: 'https://example.test/transcript',
      },
      label: 'Video transcript',
      initiallyExpanded: true,
    });
    const externalTarget = mountTranscript({
      transcript: { src: '/transcripts/lab-safety' },
      label: 'Video transcript',
      initiallyExpanded: true,
    });

    expect(plainTarget.textContent).toContain('Plain fallback');
    expect(plainTarget.querySelector('a')).toBeNull();
    expect(externalTarget.querySelector('a')?.getAttribute('href')).toBe('/transcripts/lab-safety');
    expect(externalTarget.querySelector('a')?.textContent?.trim()).toBe('View transcript');
  });

  it('renders nothing for an absent or unsafe-only transcript', () => {
    const absentTarget = mountTranscript({ label: 'Video transcript' });
    const unsafeTarget = mountTranscript({
      transcript: { src: 'javascript:alert(1)' },
      label: 'Video transcript',
    });

    expect(absentTarget.querySelector('button')).toBeNull();
    expect(unsafeTarget.querySelector('button')).toBeNull();
  });
});
