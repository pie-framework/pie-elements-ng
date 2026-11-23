import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { compile } from 'svelte/compiler';
import AuthorComponent from '../src/author/Author.svelte';
import type { VideoStimulusModel } from '../src/types.js';

// A string, not a URL object: happy-dom replaces the global `URL`, which `readFileSync` rejects.
const SOURCE_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../src/author/Author.svelte');

// The dark preset redefines --pie-background, --pie-text and the borders but keeps --pie-white absolute.
const DARK = {
  '--pie-background': '#1a202c',
  '--pie-text': '#e2e8f0',
  '--pie-white': '#ffffff',
  '--pie-border-light': '#424242',
  '--pie-border-dark': '#9e9e9e',
};

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
    filename: 'Author.svelte',
    css: 'external',
    ...(hash ? { cssHash: () => hash } : {}),
  });
  const style = document.createElement('style');
  style.textContent = css?.code ?? '';
  document.head.appendChild(style);
}

function mountAuthor(vars: Record<string, string>) {
  const target = document.createElement('div');
  for (const [name, value] of Object.entries(vars)) target.style.setProperty(name, value);
  document.body.appendChild(target);
  const component = mount(AuthorComponent, {
    target,
    props: { model: authored, onChange: vi.fn(), locale: 'en' },
  });
  mounted.push({ target, component });
  flushSync();
  injectCss(target.querySelector('.video-stimulus-author') as Element);
  return (selector: string) => getComputedStyle(target.querySelector(selector) as HTMLElement);
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

describe('video-stimulus author surfaces', () => {
  it.each([
    '.author-header',
    '.editor-panel',
    '.form-section',
    '.preview-panel',
    '.preview-surface',
    'button',
    'input[type="text"]',
  ])('%s sits on the theme background', (selector) => {
    const style = mountAuthor(DARK);

    expect(style(selector).backgroundColor).toBe('#1a202c');
  });

  it('edges text fields with the dark border', () => {
    const style = mountAuthor(DARK);

    expect(style('input[type="text"]').borderTopColor).toBe('#9e9e9e');
  });
});
