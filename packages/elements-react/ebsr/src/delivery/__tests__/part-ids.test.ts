import { afterEach, describe, expect, it, vi } from 'vitest';

import Ebsr from '../index';
import EbsrPrint from '../../print/index';

// The page's math renderer, as a player installs it, so the parts load no MathJax.
(window as unknown as Record<string, unknown>)['@pie-lib/math-rendering'] = { renderMath: () => {} };

// The element reads the part through `srcElement`, which browsers alias to `target` and
// happy-dom leaves out.
if (!('srcElement' in Event.prototype)) {
  Object.defineProperty(Event.prototype, 'srcElement', {
    get() {
      return this.target;
    },
  });
}

type Host = HTMLElement & { model: object; session: { value?: Record<string, { value?: string[] }> }; options: object };

customElements.define('test-ebsr-part-ids', Ebsr as unknown as CustomElementConstructor);
customElements.define('test-ebsr-print-part-ids', EbsrPrint as unknown as CustomElementConstructor);

const part = (key: string, extra: object = {}) => ({
  choiceMode: 'radio',
  choicePrefix: 'letters',
  prompt: `<p>Part ${key}</p>`,
  choices: [
    { value: `${key}1`, label: `${key} one` },
    { value: `${key}2`, label: `${key} two` },
  ],
  ...extra,
});

const model = (extra: object = {}) => ({
  mode: 'gather',
  partA: part('a', extra),
  partB: part('b', extra),
});

const parts = (el: ParentNode) => [el.querySelector('[data-part="a"]'), el.querySelector('[data-part="b"]')] as HTMLElement[];

const rendered = async <T extends HTMLElement>(el: T) => {
  await vi.waitFor(() => {
    for (const p of parts(el)) expect(p?.querySelector('.main-container')).toBeTruthy();
  });
  return el;
};

const mount = async (extra: object = {}) => {
  const el = document.createElement('test-ebsr-part-ids') as Host;
  document.body.appendChild(el);
  el.model = model(extra);
  el.session = {};
  return rendered(el);
};

const mountPrint = async () => {
  const el = document.createElement('test-ebsr-print-part-ids') as Host;
  document.body.appendChild(el);
  el.options = { role: 'student' };
  el.model = model();
  return rendered(el);
};

const ids = (root: ParentNode) => [...root.querySelectorAll('[id]')].map((node) => node.id);

const REFERENCE_ATTRIBUTES = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'for'];

const references = (root: ParentNode) =>
  [...root.querySelectorAll('*')].flatMap((node) =>
    REFERENCE_ATTRIBUTES.flatMap((name) => (node.getAttribute(name) || '').split(/\s+/).filter(Boolean)),
  );

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('ebsr part ids', () => {
  it('repeat no id inside one item, or when two items share a page', async () => {
    await mount();
    expect(ids(document).length).toBeGreaterThan(0);
    expect(new Set(ids(document)).size).toBe(ids(document).length);

    await mount();
    expect(new Set(ids(document)).size).toBe(ids(document).length);
  });

  it('give each part its own main container', async () => {
    const el = await mount();
    const [a, b] = parts(el).map((p) => p.querySelector('.main-container') as HTMLElement);

    expect(a.id).toMatch(/^main-container-/);
    expect(b.id).toMatch(/^main-container-/);
    expect(a.id).not.toBe(b.id);
  });

  it('resolve every reference inside its own part', async () => {
    const el = await mount();

    for (const p of parts(el)) {
      expect(references(p).length).toBeGreaterThan(0);
      for (const id of references(p)) {
        expect(p.querySelector(`[id="${id}"]`)).not.toBeNull();
      }
    }
  });

  it('keep their ids when the item takes a new model', async () => {
    const el = await mount();
    const before = ids(el);

    el.model = model({ prompt: '<p>Reworded</p>' });
    await vi.waitFor(() => expect(el.textContent).toContain('Reworded'));

    expect(ids(el)).toEqual(before);
  });

  it('record an answer under the part that took it', async () => {
    const first = await mount();
    const second = await mount();

    (parts(second)[1].querySelector('input[value="b2"]') as HTMLInputElement).click();
    await vi.waitFor(() => expect(second.session.value?.partB?.value).toEqual(['b2']));

    expect(second.session.value?.partA?.value ?? []).toEqual([]);
    expect(first.session.value?.partB?.value ?? []).toEqual([]);
  });

  it('show each part its own enable-audio toast, inside its own container', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const el = await mount({ autoplayAudioEnabled: true, prompt: '<audio src="prompt.mp3"></audio>' });

    await vi.waitFor(() => {
      for (const p of parts(el)) expect(p.querySelector('.play-audio-info')).not.toBeNull();
    });

    const toasts = parts(el).map((p) => p.querySelector('.play-audio-info') as HTMLElement);
    for (const [i, p] of parts(el).entries()) {
      expect(toasts[i].parentElement).toBe(p.querySelector('.main-container'));
    }
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });
});

describe('ebsr print part ids', () => {
  it('repeat no id inside one item, or when two items share a page', async () => {
    await mountPrint();
    await mountPrint();

    expect(ids(document).length).toBeGreaterThan(0);
    expect(new Set(ids(document)).size).toBe(ids(document).length);
  });

  it('hand each part its own model', async () => {
    const el = await mountPrint();

    expect(parts(el)[0].textContent).toContain('Part a');
    expect(parts(el)[1].textContent).toContain('Part b');
  });
});
