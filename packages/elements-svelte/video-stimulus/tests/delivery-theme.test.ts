import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { compile } from 'svelte/compiler';
import { model as buildViewModel } from '../src/controller/index.js';
import VideoStimulusComponent from '../src/delivery/VideoStimulus.svelte';
import type { VideoStimulusModel } from '../src/types.js';

// A string, not a URL object: happy-dom replaces the global `URL`, which `readFileSync` rejects.
const SOURCE_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/delivery/VideoStimulus.svelte'
);

// The dark preset redefines --pie-background and --pie-text but keeps --pie-white absolute.
const DARK = { '--pie-background': '#1a202c', '--pie-text': '#e2e8f0', '--pie-white': '#ffffff' };

const authored: VideoStimulusModel = {
  element: 'video-stimulus',
  language: 'en',
  media: {
    version: 1,
    id: 'video-1',
    kind: 'video',
    label: 'Lab safety demonstration',
    sources: [{ src: 'https://cdn.example.org/video.mp4', type: 'video/mp4' }],
  },
};

const mounted: Array<{ target: HTMLElement; component: ReturnType<typeof mount> }> = [];

// The component stylesheet, scoped to the class the mounted instance carries.
function injectCss(root: Element) {
  const hash = [...root.classList].find((name) => name.startsWith('svelte-'));
  const { css } = compile(readFileSync(SOURCE_PATH, 'utf8'), {
    filename: 'VideoStimulus.svelte',
    css: 'external',
    ...(hash ? { cssHash: () => hash } : {}),
  });
  const style = document.createElement('style');
  style.textContent = css?.code ?? '';
  document.head.appendChild(style);
}

function retryButton(vars: Record<string, string>) {
  const target = document.createElement('div');
  for (const [name, value] of Object.entries(vars)) target.style.setProperty(name, value);
  document.body.appendChild(target);
  const component = mount(VideoStimulusComponent, {
    target,
    props: { model: buildViewModel(authored, undefined, { mode: 'gather' }) },
  });
  mounted.push({ target, component });
  flushSync();
  target.querySelector('source')?.dispatchEvent(new Event('error'));
  flushSync();
  injectCss(target.firstElementChild as Element);
  return getComputedStyle(target.querySelector('.retry-button') as HTMLElement);
}

let loadSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  loadSpy = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const { target, component } of mounted.splice(0)) {
    unmount(component);
    target.remove();
  }
  for (const style of document.head.querySelectorAll('style')) style.remove();
  loadSpy.mockRestore();
});

describe('video-stimulus retry button', () => {
  it('sits on the theme background in the theme text colour', () => {
    const retry = retryButton(DARK);

    expect(retry.backgroundColor).toBe('#1a202c');
    expect(retry.color).toBe('#e2e8f0');
  });

  it('shows the page through when no theme is applied, as it does today', () => {
    expect(retryButton({}).backgroundColor).toBe('transparent');
  });
});
