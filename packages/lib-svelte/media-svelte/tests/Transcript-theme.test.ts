import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { compile } from 'svelte/compiler';
import { Transcript } from '../src/index.js';

// A string, not a URL object: happy-dom replaces the global `URL`, which `readFileSync` rejects.
const SOURCE_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../src/Transcript.svelte');

// The dark preset redefines --pie-background and --pie-text but keeps --pie-white absolute.
const DARK = { '--pie-background': '#1a202c', '--pie-text': '#e2e8f0', '--pie-white': '#ffffff' };

const mounted: Array<{ target: HTMLElement; component: ReturnType<typeof mount> }> = [];

// The component stylesheet, scoped to the class the mounted instance carries.
function injectCss(root: Element) {
  const hash = [...root.classList].find((name) => name.startsWith('svelte-'));
  const { css } = compile(readFileSync(SOURCE_PATH, 'utf8'), {
    filename: 'Transcript.svelte',
    css: 'external',
    ...(hash ? { cssHash: () => hash } : {}),
  });
  const style = document.createElement('style');
  style.textContent = css?.code ?? '';
  document.head.appendChild(style);
}

function toggle(vars: Record<string, string>) {
  const target = document.createElement('div');
  for (const [name, value] of Object.entries(vars)) target.style.setProperty(name, value);
  document.body.appendChild(target);
  const component = mount(Transcript, {
    target,
    props: { transcript: { plainText: 'Step one.' }, label: 'Video transcript' },
  });
  mounted.push({ target, component });
  flushSync();
  injectCss(target.firstElementChild as Element);
  return getComputedStyle(target.querySelector('button') as HTMLElement);
}

afterEach(() => {
  for (const { target, component } of mounted.splice(0)) {
    unmount(component);
    target.remove();
  }
  for (const style of document.head.querySelectorAll('style')) style.remove();
});

describe('Transcript toggle', () => {
  it('sits on the theme background in the theme text colour', () => {
    const button = toggle(DARK);

    expect(button.backgroundColor).toBe('#1a202c');
    expect(button.color).toBe('#e2e8f0');
  });

  it('shows the page through when no theme is applied, as it does today', () => {
    expect(toggle({}).backgroundColor).toBe('transparent');
  });

  it('draws its border in the theme text colour', () => {
    const button = toggle(DARK);

    expect(button.borderTopStyle).toBe('solid');
    expect(button.borderTopWidth).toBe('1px');
    expect(button.borderTopColor).toBe('#e2e8f0');
  });

  it('keeps a border in the inherited text colour when no theme is applied', () => {
    const button = toggle({});

    expect(button.borderTopStyle).toBe('solid');
    expect(button.borderTopWidth).toBe('1px');
    expect(button.borderTopColor).toBe('currentcolor');
  });
});
